// Keep a failed item's operation ID across retries and reloads. An HTTP error
// does not prove that Stripe failed to take payment.
const pending = new Map<string, string>();

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, canonical(item)]));
  }
  return value;
}

export async function withSubscriptionMutationRetry<T extends { operationId?: string }, R>(
  target: string,
  payload: T,
  send: (body: T & { operationId: string }) => Promise<R>,
): Promise<R> {
  if (payload.operationId) return send({ ...payload, operationId: payload.operationId });
  const key = `portal:subscription-mutation:${target}:${JSON.stringify(canonical(payload))}`;
  let operationId = pending.get(key);
  try { operationId ||= sessionStorage.getItem(key) || undefined; } catch { /* Memory fallback for restricted storage. */ }
  operationId ||= globalThis.crypto.randomUUID();
  pending.set(key, operationId);
  try { sessionStorage.setItem(key, operationId); } catch { /* Keep the in-memory retry ID. */ }
  const result = await send({ ...payload, operationId });
  pending.delete(key);
  try { sessionStorage.removeItem(key); } catch { /* The server safely replays an already completed ID. */ }
  return result;
}

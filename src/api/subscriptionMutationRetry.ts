// Keep a failed item's operation ID across retries and reloads. An HTTP error
// does not prove that Stripe failed to take payment.
type PendingMutation = { operationId: string; payload: Record<string, unknown> };
const pending = new Map<string, PendingMutation>();

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
  // A saved operation may already have committed its new version when its
  // response/collection-restoration step fails. Reload must retry its ORIGINAL
  // payload and ID, rather than create a conflicting operation at the new version.
  const selection = { ...payload } as Record<string, unknown>;
  delete selection.expectedVersion;
  const key = `portal:subscription-mutation:v2:${target}:${JSON.stringify(canonical(selection))}`;
  let saved = pending.get(key);
  try {
    const stored = sessionStorage.getItem(key);
    if (!saved && stored) {
      const candidate = JSON.parse(stored) as PendingMutation;
      const originalSelection = { ...candidate.payload };
      delete originalSelection.expectedVersion;
      if (typeof candidate.operationId === "string" &&
          JSON.stringify(canonical(originalSelection)) === JSON.stringify(canonical(selection))) saved = candidate;
    }
  } catch { /* Memory fallback for restricted or stale storage. */ }
  saved ||= { operationId: globalThis.crypto.randomUUID(), payload: JSON.parse(JSON.stringify(payload)) };
  pending.set(key, saved);
  try { sessionStorage.setItem(key, JSON.stringify(saved)); } catch { /* Keep the in-memory retry ID. */ }
  let result: R;
  try {
    result = await send({ ...saved.payload, operationId: saved.operationId } as T & { operationId: string });
  } catch (error) {
    const body = (error as { body?: { data?: { staleSubscription?: boolean } } })?.body;
    if (body?.data?.staleSubscription) {
      pending.delete(key);
      try { sessionStorage.removeItem(key); } catch { /* Nothing was accepted at the stale version. */ }
    }
    throw error;
  }
  pending.delete(key);
  try { sessionStorage.removeItem(key); } catch { /* The server safely replays an already completed ID. */ }
  return result;
}


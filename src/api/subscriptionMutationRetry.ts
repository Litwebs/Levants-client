// Keep a failed item's operation ID across retries and reloads. An HTTP error
// does not prove that Stripe failed to take payment.
type PendingMutation = { operationId: string; payload: Record<string, unknown>; legacyKey?: string };
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
  const legacyPrefix = `portal:subscription-mutation:${target}:`;
  let saved = pending.get(key);
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(key);
  } catch { /* Preserve the existing in-memory fallback for restricted storage. */ }
  if (!saved && stored) {
    try {
      const candidate = JSON.parse(stored) as PendingMutation;
      if (!candidate || !candidate.payload || typeof candidate.payload !== "object") throw Error("Invalid saved payload");
      const originalSelection = { ...candidate.payload };
      delete originalSelection.expectedVersion;
      if (typeof candidate.operationId !== "string" || !candidate.operationId ||
          JSON.stringify(canonical(originalSelection)) !== JSON.stringify(canonical(selection)) ||
          (candidate.legacyKey && !candidate.legacyKey.startsWith(legacyPrefix))) throw Error("Invalid saved operation");
      saved = candidate;
    } catch {
      throw new Error("The saved subscription change needs confirmation. Contact support before starting another payment.");
    }
  }
  if (!saved) {
    // Preserve in-flight operations saved by the previous portal version too.
    // Inspect only this subscription mutation target's own legacy keys.
    let legacyKeys: string[] = [];
    try {
      legacyKeys = Array.from({ length: sessionStorage.length }, (_, index) => sessionStorage.key(index))
        .filter((candidate): candidate is string => Boolean(candidate?.startsWith(legacyPrefix)));
    } catch { /* Existing restricted-storage fallback. */ }
    for (const legacyKey of legacyKeys) {
      let candidatePayload: Record<string, unknown>;
      try { candidatePayload = JSON.parse(legacyKey.slice(legacyPrefix.length)); }
      catch { throw new Error("A saved subscription change needs confirmation before another payment can start."); }
      const originalSelection = { ...candidatePayload };
      delete originalSelection.expectedVersion;
      if (JSON.stringify(canonical(originalSelection)) !== JSON.stringify(canonical(selection))) continue;
      let originalId: string | null = null;
      try { originalId = sessionStorage.getItem(legacyKey); } catch { /* Keep memory fallback. */ }
      if (!originalId) throw new Error("The original subscription operation needs confirmation before retrying.");
      saved = { operationId: originalId, payload: candidatePayload, legacyKey };
      break;
    }
  }
  saved ||= { operationId: globalThis.crypto.randomUUID(), payload: JSON.parse(JSON.stringify(payload)) };
  pending.set(key, saved);
  const clear = () => {
    pending.delete(key);
    try {
      sessionStorage.removeItem(key);
      if (saved?.legacyKey) sessionStorage.removeItem(saved.legacyKey);
    } catch { /* The server safely replays an already completed ID. */ }
  };
  try { sessionStorage.setItem(key, JSON.stringify(saved)); } catch { /* Keep the in-memory retry ID. */ }
  let result: R;
  try {
    result = await send({ ...saved.payload, operationId: saved.operationId } as T & { operationId: string });
  } catch (error) {
    const body = (error as { body?: { data?: { staleSubscription?: boolean } } })?.body;
    if (body?.data?.staleSubscription) {
      clear();
    }
    throw error;
  }
  clear();
  return result;
}


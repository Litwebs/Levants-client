function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, canonical(item)]));
  return value;
}

export async function withSubscriptionCreationRetry<T extends { operationId?: string }, R>(
  customerId: string, payload: T, send: (body: T & { operationId: string }) => Promise<R>,
): Promise<R> {
  if (!customerId) throw new Error("Could not verify your account before starting payment.");
  const key = `portal:subscription-creation:${customerId}`;
  const { operationId: explicit, ...fields } = payload;
  const fingerprint = JSON.stringify(canonical(fields));
  let record: { operationId: string; fingerprint: string } | null;
  try {
    const raw = sessionStorage.getItem(key);
    record = raw ? JSON.parse(raw) : null;
    if (record && (!record.operationId || !record.fingerprint)) throw new Error("Invalid saved purchase");
  } catch {
    throw new Error("Your browser could not read the saved payment attempt. Enable browser storage or contact support before starting another subscription.");
  }
  if (record && (record.fingerprint !== fingerprint || (explicit && explicit !== record.operationId))) {
    throw new Error("Your earlier subscription payment still needs confirmation. Restore its original products and delivery details and retry before starting a different subscription.");
  }
  record ||= { fingerprint, operationId: explicit || globalThis.crypto.randomUUID() };
  try { sessionStorage.setItem(key, JSON.stringify(record)); }
  catch { throw new Error("Enable browser storage before starting this subscription so an interrupted payment can be recovered safely."); }
  const result = await send({ ...payload, operationId: record.operationId });
  sessionStorage.removeItem(key);
  return result;
}

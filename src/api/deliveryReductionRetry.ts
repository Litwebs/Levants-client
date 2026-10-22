import type { DeliveryReductionQuote, DeliveryReductionRequest } from "./portalSubscriptions";

export type PendingDeliveryReduction = { quote: DeliveryReductionQuote; request: DeliveryReductionRequest };
const memory = new Map<string, PendingDeliveryReduction>();

function isPending(value: unknown): value is PendingDeliveryReduction {
  if (!value || typeof value !== "object") return false;
  const { quote, request } = value as Partial<PendingDeliveryReduction>;
  const minor = (amount: unknown) => Number.isSafeInteger(amount) && Number(amount) >= 0;
  return Boolean(quote && request && typeof quote.deliveryId === "string" &&
    Number.isFinite(Date.parse(quote.scheduledDate)) && Number.isFinite(Date.parse(quote.cutoffAt)) &&
    typeof quote.cancelsDelivery === "boolean" && typeof quote.hasChanges === "boolean" &&
    [quote.originalTotalMinor, quote.revisedTotalMinor, quote.creditedMinor, quote.deliveryFeeMinor].every(minor) &&
    Array.isArray(quote.before) && quote.before.length > 0 &&
    quote.before.every(item => item && typeof item.variant === "string" && typeof item.name === "string" &&
      Number.isSafeInteger(item.quantity) && item.quantity > 0 && Number.isFinite(item.unitPrice) && item.unitPrice >= 0) &&
    Array.isArray(quote.after) && quote.after.every(item => item && typeof item.variant === "string" &&
      Number.isSafeInteger(item.quantity) && item.quantity > 0) &&
    Array.isArray(request.items) && request.items.length === quote.before.length &&
    request.items.every(item => item && typeof item.variant === "string" && minor(item.quantity)) &&
    typeof request.operationId === "string" && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(request.operationId) &&
    /^[\da-f]{64}$/i.test(request.quoteToken) && request.quoteToken === quote.quoteToken &&
    minor(request.expectedVersion) && request.expectedVersion === quote.expectedVersion);
}

export function deliveryReductionKey(customerId: string, subscriptionId: string, deliveryId: string) {
  return `portal:delivery-reduction:v1:${[customerId, subscriptionId, deliveryId].map(encodeURIComponent).join(":")}`;
}

export function readDeliveryReduction(key: string): PendingDeliveryReduction | null {
  const cached = memory.get(key);
  if (cached) return cached;
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(key) || "null");
    if (isPending(value)) {
      memory.set(key, value);
      return value;
    }
  } catch { /* Browser storage may be unavailable; the memory copy still works. */ }
  return null;
}

// Save the complete reviewed request before submitting it. Recovery must use
// the original quote and operation ID, even after a reload or the cut-off.
export function saveDeliveryReduction(key: string, value: PendingDeliveryReduction) {
  memory.set(key, value);
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Memory fallback. */ }
}

export function clearDeliveryReduction(key: string) {
  memory.delete(key);
  try { sessionStorage.removeItem(key); } catch { /* A stale saved ID still replays safely on the server. */ }
}

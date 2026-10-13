export type SelectedAddOn = {
  variantId: string; productName: string; variantName: string; unitPrice: number; quantity: number;
};
export type PendingAddOn = {
  operationId: string; deliveryId: string; deliveryDate: string; items: SelectedAddOn[];
};
const key = (id: string) => `portal:add-on-purchase:${id}`;
export function readPendingAddOn(id: string): PendingAddOn | null {
  const raw = sessionStorage.getItem(key(id));
  if (!raw) return null;
  const value = JSON.parse(raw) as PendingAddOn;
  if (!value.operationId || !value.deliveryId || !value.deliveryDate || !Array.isArray(value.items) ||
    !value.items.length || value.items.some(item => !item.variantId || !Number.isInteger(item.quantity) || item.quantity < 1)) {
    throw new Error("Your saved purchase needs support review before another payment can be started.");
  }
  return value;
}
export function savePendingAddOn(id: string, value: PendingAddOn): void {
  // Fail before charging if a refresh-safe retry record cannot be stored.
  sessionStorage.setItem(key(id), JSON.stringify(value));
}
export function clearPendingAddOn(id: string): void { sessionStorage.removeItem(key(id)); }
export function canReplaceAddOnAttempt(body: unknown): boolean {
  const outcome = (body as { data?: { paymentOutcome?: string } } | null)?.data?.paymentOutcome;
  return outcome === "not_started" || outcome === "declined";
}

export type StockShortage = {
  variantId: string;
  productId: string | null;
  productName: string;
  variantName: string;
  requested: number;
  available: number;
};

export function getStockShortages(error: unknown): StockShortage[] {
  const body = (error as { body?: { error?: { code?: string }; data?: { shortages?: unknown } } })?.body;
  if (body?.error?.code !== "INSUFFICIENT_STOCK" || !Array.isArray(body.data?.shortages)) return [];
  return body.data.shortages.filter((item): item is StockShortage => Boolean(item &&
    typeof item.variantId === "string" && typeof item.productName === "string" && typeof item.variantName === "string" &&
    Number.isSafeInteger(item.requested) && Number.isSafeInteger(item.available) &&
    item.available >= 0 && item.requested > item.available));
}

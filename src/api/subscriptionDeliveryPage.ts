import type { PaginationMeta, PortalSubscriptionDelivery } from "./portalSubscriptions";

export type SubscriptionDeliveryPage = { deliveries: PortalSubscriptionDelivery[]; meta: PaginationMeta };

// The existing API sorts all delivery history oldest first. Locate the page
// containing the next-delivery date without downloading an account's history.
export async function selectSubscriptionDeliveryPage(
  first: SubscriptionDeliveryPage,
  anchor: string | null | undefined,
  readPage: (page: number) => Promise<SubscriptionDeliveryPage>,
  requestedPage = 0,
): Promise<SubscriptionDeliveryPage> {
  const pages = Math.max(1, Math.ceil(first.meta.total / first.meta.pageSize));
  const cache = new Map<number, SubscriptionDeliveryPage>([[1, first]]);
  const read = async (page: number) => {
    if (!cache.has(page)) cache.set(page, await readPage(page));
    return cache.get(page)!;
  };
  if (requestedPage > 0) return read(Math.max(1, Math.min(pages, requestedPage)));
  const target = Date.parse(anchor || "");
  if (!Number.isFinite(target) || pages === 1) return first;
  let low = 1, high = pages;
  let candidate: SubscriptionDeliveryPage | null = null;
  while (low <= high) {
    const page = Math.floor((low + high) / 2);
    const value = await read(page);
    const last = Date.parse(value.deliveries.at(-1)?.scheduledDate || "");
    if (!Number.isFinite(last)) { high = page - 1; continue; }
    if (last >= target) { candidate = value; high = page - 1; }
    else low = page + 1;
  }
  return candidate || read(pages);
}

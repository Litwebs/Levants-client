import type { Deal } from "@/api/deals";

type ProductLine = {
  quantity: number;
  variant?: { id: string; price: number };
  product: { id: string; price: number };
};
export type BasketDealLine = { deal: Deal; quantity: number };

export function buildBasketOrderItems(items: ProductLine[], explicit: BasketDealLine[]) {
  const quantities = new Map<string, number>();
  for (const item of items) {
    const id = item.variant?.id || item.product.id;
    quantities.set(id, (quantities.get(id) || 0) + item.quantity);
  }
  for (const entry of explicit) for (const item of entry.deal.items) {
    quantities.set(item.variantId, (quantities.get(item.variantId) || 0) + item.quantity * entry.quantity);
  }
  return [...quantities].map(([variantId, quantity]) => ({ variantId, quantity }));
}

// Match complete packages only. Quantities assigned to one offer are removed
// before considering another, so a bottle cannot receive two deal discounts.
export function matchBasketDeals(items: ProductLine[], offers: Deal[], explicit: BasketDealLine[]) {
  const remaining = new Map<string, number>();
  const prices = new Map<string, number>();
  const reserved = new Map<string, number>();
  const explicitById = new Map(explicit.map((entry) => [entry.deal.id, entry]));
  for (const item of items) {
    const id = item.variant?.id || item.product.id;
    remaining.set(id, (remaining.get(id) || 0) + item.quantity);
    prices.set(id, Math.round((item.variant?.price ?? item.product.price) * 100));
  }
  for (const entry of explicit) for (const component of entry.deal.items) {
    reserved.set(component.variantId, (reserved.get(component.variantId) || 0) + component.quantity * entry.quantity);
  }
  const now = Date.now();
  const candidates = offers.filter((offer) => offer.items.length && offer.maxPackages > 0 &&
    (!offer.startsAt || new Date(offer.startsAt).getTime() <= now) &&
    (!offer.endsAt || new Date(offer.endsAt).getTime() > now))
    .map((deal) => {
      const requirements = new Map<string, number>();
      for (const item of deal.items) requirements.set(item.variantId, (requirements.get(item.variantId) || 0) + item.quantity);
      const originalMinor = [...requirements].reduce((sum, [id, qty]) => sum + (prices.get(id) || 0) * qty, 0);
      return { deal, requirements, savingMinor: originalMinor - Math.round(deal.packagePrice * 100) };
    })
    .filter((candidate) => candidate.savingMinor > 0)
    .sort((a, b) => b.savingMinor - a.savingMinor || a.deal.id.localeCompare(b.deal.id));
  const automaticDeals: BasketDealLine[] = [];
  let savingsMinor = 0;
  const claimedIds = new Set(explicit.map((entry) => entry.deal.id));
  for (const { deal, requirements, savingMinor } of candidates) {
    if (!claimedIds.has(deal.id) && claimedIds.size >= 20) continue;
    const explicitQuantity = explicitById.get(deal.id)?.quantity || 0;
    let quantity = Math.min(99 - explicitQuantity, deal.maxPackages - explicitQuantity);
    for (const [id, required] of requirements) {
      const available = deal.items.find((item) => item.variantId === id)?.variant.availableStock ?? 0;
      const stockLeft = Math.max(0, available - (reserved.get(id) || 0));
      quantity = Math.min(quantity, Math.floor(Math.min(remaining.get(id) || 0, stockLeft) / required));
    }
    if (quantity <= 0) continue;
    automaticDeals.push({ deal, quantity });
    claimedIds.add(deal.id);
    savingsMinor += savingMinor * quantity;
    for (const [id, required] of requirements) {
      remaining.set(id, (remaining.get(id) || 0) - required * quantity);
      reserved.set(id, (reserved.get(id) || 0) + required * quantity);
    }
  }
  const claims = new Map(explicit.map((entry) => [entry.deal.id, { ...entry }]));
  for (const entry of automaticDeals) {
    const current = claims.get(entry.deal.id);
    claims.set(entry.deal.id, { deal: entry.deal, quantity: entry.quantity + (current?.quantity || 0) });
  }
  return { automaticDeals, checkoutDeals: [...claims.values()], automaticSavings: savingsMinor / 100 };
}

export function basketOfferSignature(items: ProductLine[], explicit: BasketDealLine[], offers: Deal[]) {
  const { checkoutDeals, automaticSavings } = matchBasketDeals(items, offers, explicit);
  return JSON.stringify({
    items: items.map((item) => ({ id: item.variant?.id || item.product.id, quantity: item.quantity, price: item.variant?.price ?? item.product.price })).sort((a, b) => a.id.localeCompare(b.id)),
    automaticSavings,
    deals: checkoutDeals.map(({ deal, quantity }) => ({
      id: deal.id, quantity, price: deal.packagePrice,
      contents: deal.items.map((item) => [item.variantId, item.quantity]).sort(),
    })).sort((a, b) => a.id.localeCompare(b.id)),
  });
}

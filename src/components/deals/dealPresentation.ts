import type { Deal } from "@/api/deals";

// Presentation only: checkout and inventory remain server validated.
export function dealPresentation(deal: Deal) {
  const validPrice =
    Number.isFinite(deal.packagePrice) && deal.packagePrice >= 0;
  let formatter: Intl.NumberFormat;
  try {
    formatter = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: deal.currency || "GBP",
    });
  } catch {
    // An invalid currency must not turn a price into a different currency.
    return {
      validPrice: false,
      price: "Price unavailable",
      saving: null,
      percent: null,
      original: null,
    };
  }
  const hasSaving =
    validPrice &&
    Number.isFinite(deal.originalValue) &&
    deal.originalValue > deal.packagePrice &&
    Number.isFinite(deal.savings) &&
    deal.savings > 0 &&
    Math.abs(deal.originalValue - deal.packagePrice - deal.savings) < 0.011;
  const validPercent =
    hasSaving &&
    Number.isFinite(deal.savingsPercent) &&
    deal.savingsPercent > 0 &&
    deal.savingsPercent <= 100 &&
    Math.abs(deal.savingsPercent - (deal.savings / deal.originalValue) * 100) <=
      0.51;
  return {
    validPrice,
    price: validPrice
      ? formatter.format(deal.packagePrice)
      : "Price unavailable",
    original: hasSaving ? formatter.format(deal.originalValue) : null,
    saving: hasSaving ? formatter.format(deal.savings) : null,
    percent: validPercent ? deal.savingsPercent : null,
  };
}

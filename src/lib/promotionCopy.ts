/** Copy only: eligibility and delivery fees always come from the server quote. */
export function freeDeliveryTerms(minimum?: number) {
  if (typeof minimum !== "number" || !Number.isFinite(minimum) || minimum < 0)
    return "Free delivery offer — check your basket for eligibility";
  if (minimum === 0) return "Free delivery";
  const amount = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: minimum % 1 ? 2 : 0 }).format(minimum);
  return `Free delivery when you spend ${amount} or more on products`;
}

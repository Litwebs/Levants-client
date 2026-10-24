export type SubscriptionPricingQuote = {
  productsMinor: number; deliveryMinor: number; discountMinor: number;
  firstChargeMinor: number; renewalMinor: number; percentOff: number;
  eligible: boolean; quoteToken: string; nextPaymentDate: string; firstDeliveryDate: string;
};
const money = (minor: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(minor / 100);
export default function SubscriptionIntroOfferSummary({ quote }: { quote: SubscriptionPricingQuote }) {
  return <div className="space-y-2 rounded-xl border border-forest/30 bg-forest/5 p-3 text-sm" aria-live="polite">
    {quote.discountMinor > 0 && <>
      <p className="font-semibold">{quote.percentOff}% off products on your first subscription payment</p>
      <p>Products before discount: {money(quote.productsMinor)}. You save {money(quote.discountMinor)}.</p>
      <p>Delivery: {money(quote.deliveryMinor)}. Delivery is not discounted.</p>
    </>}
    <p className="font-semibold">First payment: {money(quote.firstChargeMinor)}</p>
    <p>Normal recurring payment: {money(quote.renewalMinor)}. Next payment expected {new Date(quote.nextPaymentDate).toLocaleDateString("en-GB", { timeZone: "Europe/London" })}.</p>
    {quote.discountMinor > 0 && <p>The offer applies once per customer, across all deliveries in this first billing period. Future payments use the normal recurring price.</p>}
  </div>;
}

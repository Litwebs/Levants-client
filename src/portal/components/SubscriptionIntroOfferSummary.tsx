export type SubscriptionPricingQuote = {
  stockDeferralAvailable?: boolean;
  canCreate?: boolean;
  availability?: Array<{scheduledDate: string; deferred: Array<{name: string; quantity: number}>; included: Array<{name: string; quantity: number}>; notChargedMinor: number}>;
  productsMinor: number; deliveryMinor: number; discountMinor: number;
  firstChargeMinor: number; renewalMinor: number; percentOff: number; discountType?: "percentage" | "fixed"; amountOff?: number;
  eligible: boolean; quoteToken: string; nextPaymentDate: string; firstDeliveryDate: string;
};
const money = (minor: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(minor / 100);
export default function SubscriptionIntroOfferSummary({ quote }: { quote: SubscriptionPricingQuote }) {
  return <div className="space-y-1 text-sm" aria-live="polite">
    {quote.discountMinor > 0 && <div className="flex items-center justify-between gap-4 text-forest">
      <span>{quote.discountType === "fixed" ? "First payment offer" : `${quote.percentOff}% first payment offer`}</span>
      <span className="font-semibold">−{money(quote.discountMinor)}</span>
    </div>}
    {quote.availability?.filter(day => day.deferred.length > 0).map(day => <div key={day.scheduledDate} role="status" className="rounded-md border p-3">
      <p className="font-medium">Unavailable for {new Date(day.scheduledDate).toLocaleDateString("en-GB", {timeZone: "Europe/London"})}</p>
      <ul>{day.deferred.map((item,index) => <li key={index}>{item.name} ×{item.quantity}</li>)}</ul>
      <p>{money(day.notChargedMinor)} will not be charged. These items stay on your recurring plan and will be included in a future eligible delivery when stock is available. Missed quantities do not accumulate.</p>
    </div>)}
    {quote.canCreate === false && <p role="alert">All selected items are unavailable. Adjust your selection before subscribing. No payment will be taken.</p>}
    <p className="text-muted-foreground">Then {money(quote.renewalMinor)} per billing period {quote.stockDeferralAvailable ? "at current prices, subject to availability, " : ""}from {new Date(quote.nextPaymentDate).toLocaleDateString("en-GB", { timeZone: "Europe/London" })}.</p>
  </div>;
}

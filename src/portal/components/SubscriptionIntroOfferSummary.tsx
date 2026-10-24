export type SubscriptionPricingQuote = {
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
    <p className="text-muted-foreground">Then {money(quote.renewalMinor)} per billing period from {new Date(quote.nextPaymentDate).toLocaleDateString("en-GB", { timeZone: "Europe/London" })}.</p>
  </div>;
}

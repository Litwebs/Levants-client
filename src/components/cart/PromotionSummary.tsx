import { freeDeliveryTerms } from "@/lib/promotionCopy";
import { useCart } from "@/context/CartContext";

export function PromotionCodeInput() {
  const { promotionCode, setPromotionCode, refreshPricing, pricingLoading } = useCart();
  return <div className="mb-4">
    <label htmlFor="promotion-code" className="block text-sm font-medium mb-2">Discount Code</label>
    <div className="flex gap-2">
      <input id="promotion-code" value={promotionCode} maxLength={32} onChange={e => setPromotionCode(e.target.value.toUpperCase())}
        placeholder="Enter code" className="input-field h-10 min-w-0 flex-1" />
      <button type="button" className="btn-outline checkout-button-md" disabled={pricingLoading} onClick={() => { void refreshPricing().catch(() => {}); }}>Apply</button>
      {promotionCode && <button type="button" className="inline-flex h-10 items-center px-2 text-sm underline" onClick={() => setPromotionCode("")}>Remove</button>}
    </div>
    <p className="text-xs text-muted-foreground mt-2">One campaign per basket. A code replaces automatic offers.</p>
  </div>;
}

export default function PromotionSummary() {
  const { promotion, pricingError, pricingLoading, refreshPricing, checkoutDeals } = useCart();
  if (checkoutDeals.length) return null;
  if (pricingLoading) return <p className="text-sm text-muted-foreground mb-3" role="status">Checking promotions…</p>;
  if (pricingError) return <div className="text-sm text-destructive mb-3" role="alert">{pricingError} <button type="button" className="inline-flex h-10 items-center px-2 underline" onClick={() => { void refreshPricing().catch(() => {}); }}>Retry</button></div>;
  if (!promotion?.campaign) return null;
  return <div className="text-sm text-primary mb-3" data-testid="promotion-summary" role="status">
    <p className="font-medium">{promotion.campaign.name}</p>
    <p>{promotion.campaign.kind === "free_delivery" ? (promotion.deliveryFee === 0 ? `Free delivery applied — £0.00 delivery. ${freeDeliveryTerms(promotion.campaign.minimumBasketValue)}` : freeDeliveryTerms(promotion.campaign.minimumBasketValue)) : `Campaign saving −£${promotion.discountAmount.toFixed(2)}`}</p>
  </div>;
}

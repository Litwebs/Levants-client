import { useCallback, useEffect, useRef, useState } from "react";
import { quotePromotions, type PromotionQuote } from "@/api/promotions";
import { getStockShortages, type StockShortage } from "@/lib/stockShortages";

export function usePromotionPricing(items: Array<{ variantId: string; quantity: number }>, hasDeals: boolean) {
  const [promotionCode, setPromotionCode] = useState("");
  const [promotion, setPromotion] = useState<PromotionQuote | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState("");
  const [pricingShortages, setPricingShortages] = useState<StockShortage[]>([]);
  const [shortageSignature, setShortageSignature] = useState("");
  const generation = useRef(0);
  const signature = JSON.stringify({ items, hasDeals, discountCode: hasDeals ? undefined : promotionCode.trim() || undefined });
  const signatureRef = useRef(signature);
  signatureRef.current = signature;
  const [pricedSignature, setPricedSignature] = useState("");
  const invalidatePricing = useCallback(() => { generation.current++; }, []);

  const refreshPricing = useCallback(async (customer?: string): Promise<PromotionQuote | null> => {
    const currentSignature = signatureRef.current;
    const payload = JSON.parse(currentSignature);
    const requestId = ++generation.current;
    if (!payload.items.length || payload.hasDeals) { setPromotion(null); setPricingError(""); setPricingShortages([]); setPricingLoading(false); return null; }
    setPricingLoading(true);
    try {
      const quote = await quotePromotions({ ...payload, customerId: customer });
      if (requestId === generation.current && currentSignature === signatureRef.current) {
        setPromotion(quote); setPricedSignature(currentSignature); setPricingError(""); setPricingShortages([]);
      }
      return quote;
    } catch (error) {
      if (requestId === generation.current && currentSignature === signatureRef.current) {
        setPromotion(null); setPricingError(error instanceof Error ? error.message : "Could not check promotions");
        setPricingShortages(getStockShortages(error)); setShortageSignature(currentSignature);
      }
      throw error;
    } finally { if (requestId === generation.current) setPricingLoading(false); }
  }, []);

  useEffect(() => {
    if ((hasDeals || !items.length) && promotionCode) setPromotionCode("");
    const timer = window.setTimeout(() => { void refreshPricing().catch(() => {}); }, 150);
    return () => { window.clearTimeout(timer); invalidatePricing(); };
  }, [signature, hasDeals, promotionCode, refreshPricing, invalidatePricing, items.length]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") void refreshPricing().catch(() => {}); };
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => { window.removeEventListener("focus", refresh); window.clearInterval(timer); };
  }, [refreshPricing]);
  useEffect(() => {
    const end = promotion?.campaign?.endsAt;
    if (!end) return;
    const delay = Math.max(0, new Date(end).getTime() - Date.now() + 20);
    const timer = window.setTimeout(() => { void refreshPricing().catch(() => {}); }, Math.min(delay, 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [promotion, refreshPricing]);

  return { promotion: pricedSignature === signature ? promotion : null, promotionCode, setPromotionCode,
    pricingLoading: !hasDeals && (pricingLoading || (!!items.length && pricedSignature !== signature && !pricingError)),
    pricingError, pricingShortages: shortageSignature === signature ? pricingShortages : [], refreshPricing };
}


import api from "@/api/client";

export type PromotionQuote = {
  subtotal: number;
  items?: Array<{ variantId: string; price: number }>;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  campaign: { id: string; name: string; kind: "percent" | "amount" | "free_delivery";
    minimumBasketValue?: number; applicationMode: "code" | "automatic"; code: string | null; endsAt: string | null } | null;
};

export async function quotePromotions(payload: {
  items: Array<{ variantId: string; quantity: number }>;
  hasDeals: boolean;
  discountCode?: string;
  customerId?: string;
}) {
  const response = await api.post<{ success: boolean; data: PromotionQuote; message?: string }>("/discounts/quote", payload);
  if (!response.success || !response.data) throw new Error(response.message || "Could not check promotions");
  return response.data;
}

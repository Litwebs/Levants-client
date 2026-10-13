import api from "@/api/client";

export type DealItem = {
  variantId: string;
  quantity: number;
  variant: {
    id: string;
    name: string;
    sku: string;
    price: number;
    stockQuantity: number;
    availableStock: number;
    thumbnailImage?: { url?: string } | null;
  };
  product: {
    id: string;
    name: string;
    category: string;
    thumbnailImage?: { url?: string } | null;
  };
};

export type Deal = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  packagePrice: number;
  originalValue: number;
  savings: number;
  savingsPercent: number;
  currency: string;
  isFeatured: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  maxPackages: number;
  items: DealItem[];
};

type Envelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export async function listDeals(params?: {
  page?: number;
  pageSize?: number;
  featured?: boolean;
}) {
  const res = await api.get<Envelope<{ deals: Deal[] }>>("/deals", params);
  return {
    deals: res.data?.deals ?? [],
    meta: res.meta,
  };
}

export async function getDeal(slug: string) {
  const res = await api.get<Envelope<{ deal: Deal }>>(
    "/deals/" + encodeURIComponent(slug),
  );
  return res.data?.deal ?? null;
}

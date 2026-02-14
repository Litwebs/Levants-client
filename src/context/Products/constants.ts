/* ========================
   TYPES
======================== */

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  currency: string;
  stockQuantity: number;
  lowStock: boolean;
}

export interface ProductPricing {
  min: number;
  max: number;
  currency: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  thumbnailImage: string;
  galleryImages: string[];
  variants: ProductVariant[];
  pricing: ProductPricing;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ProductsState {
  products: Product[];
  meta: PaginationMeta | null;
  currentProduct: Product | null;
  loading: boolean;
  error: string | null;
}

/* ========================
   INITIAL STATE
======================== */

export const initialProductsState: ProductsState = {
  products: [],
  meta: null,
  currentProduct: null,
  loading: false,
  error: null,
};

/* ========================
   QUERY PARAMS
======================== */

export interface ProductsQueryParams {
  page?: number;
  pageSize?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  sort?: 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';
}

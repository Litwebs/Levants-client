import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";
import api from "@/api/client";
import ProductsReducer, {
  PRODUCTS_REQUEST,
  PRODUCTS_SUCCESS,
  PRODUCTS_FAILURE,
  PRODUCT_DETAIL_SUCCESS,
  CLEAR_CURRENT_PRODUCT,
} from "./ProductsReducer";
import {
  Product,
  PaginationMeta,
  ProductsState,
  ProductsQueryParams,
  initialProductsState,
} from "./constants";

function normalizeProduct(candidate: any): Product {
  const normalized = { ...candidate } as any;

  if (typeof normalized.name !== "string") normalized.name = "";
  if (typeof normalized.category !== "string") normalized.category = "";
  if (typeof normalized.slug !== "string") normalized.slug = "";
  if (typeof normalized.description !== "string") normalized.description = "";

  if (!Array.isArray(normalized.galleryImages)) normalized.galleryImages = [];
  if (!Array.isArray(normalized.variants)) normalized.variants = [];

  if (!normalized.pricing || typeof normalized.pricing !== "object") {
    const prices = (normalized.variants as any[])
      .map((v) => (typeof v?.price === "number" ? v.price : undefined))
      .filter((p) => typeof p === "number") as number[];

    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : min;
    const currency =
      (normalized.variants as any[])?.find(
        (v) => typeof v?.currency === "string",
      )?.currency || "gbp";
    normalized.pricing = { min, max, currency };
  }

  return normalized as Product;
}

function unwrapProduct(payload: unknown): Product {
  const anyPayload = payload as any;
  const candidates = [
    anyPayload,
    anyPayload?.data,
    anyPayload?.data?.data,
    anyPayload?.data?.item,
    anyPayload?.data?.product,
    anyPayload?.item,
    anyPayload?.product,
  ].filter(Boolean);

  for (const c of candidates) {
    if (!c || typeof c !== "object") continue;

    // The detail endpoint returns `{ success: true, data: product }` where product may not include `pricing`.
    const hasId = "id" in c && typeof (c as any).id === "string";
    const looksLikeProduct =
      "name" in c ||
      "variants" in c ||
      "category" in c ||
      "thumbnailImage" in c;
    if (hasId && looksLikeProduct) return normalizeProduct(c);
  }

  // Fallback: return the most likely object to help surface shape issues in UI/logs.
  if (candidates.length) return normalizeProduct(candidates[0]);
  return normalizeProduct(anyPayload);
}

/* ========================
   CONTEXT TYPE
======================== */

interface ProductsContextType extends ProductsState {
  fetchProducts: (params?: ProductsQueryParams) => Promise<void>;
  fetchProductById: (productId: string) => Promise<void>;
  clearCurrentProduct: () => void;
}

const ProductsContext = createContext<ProductsContextType | null>(null);

/* ========================
   PROVIDER
======================== */

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(ProductsReducer, initialProductsState);

  const fetchProducts = useCallback(async (params?: ProductsQueryParams) => {
    dispatch({ type: PRODUCTS_REQUEST });
    try {
      const queryParams: Record<string, string | number | boolean | undefined> =
        {};
      if (params?.page) queryParams.page = params.page;
      if (params?.pageSize) queryParams.pageSize = params.pageSize;
      if (params?.category) queryParams.category = params.category;
      if (params?.minPrice !== undefined)
        queryParams.minPrice = params.minPrice;
      if (params?.maxPrice !== undefined)
        queryParams.maxPrice = params.maxPrice;
      if (params?.inStock) queryParams.inStock = params.inStock;
      if (params?.search) queryParams.search = params.search;
      if (params?.sort) queryParams.sort = params.sort;

      const res = await api.get<{
        success: boolean;
        data: { items: Product[] };
        meta: PaginationMeta;
      }>("/products", queryParams);

      console.log("Fetched products:", res.data.items);
      dispatch({
        type: PRODUCTS_SUCCESS,
        payload: { items: res.data.items, meta: res.meta },
      });
    } catch (err: any) {
      dispatch({
        type: PRODUCTS_FAILURE,
        payload: err.message || "Failed to fetch products",
      });
    }
  }, []);

  const fetchProductById = useCallback(async (productId: string) => {
    dispatch({ type: PRODUCTS_REQUEST });
    try {
      const res = await api.get<unknown>(`/products/${productId}`);
      console.log("Fetched product detail:", res);
      const product = unwrapProduct(res);
      dispatch({ type: PRODUCT_DETAIL_SUCCESS, payload: product });
    } catch (err: any) {
      dispatch({
        type: PRODUCTS_FAILURE,
        payload: err.message || "Failed to fetch product",
      });
    }
  }, []);

  const clearCurrentProduct = useCallback(() => {
    dispatch({ type: CLEAR_CURRENT_PRODUCT });
  }, []);

  return (
    <ProductsContext.Provider
      value={{
        ...state,
        fetchProducts,
        fetchProductById,
        clearCurrentProduct,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used inside ProductsProvider");
  return ctx;
};

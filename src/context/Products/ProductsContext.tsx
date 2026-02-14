import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import api from '@/api/client';
import ProductsReducer, {
  PRODUCTS_REQUEST,
  PRODUCTS_SUCCESS,
  PRODUCTS_FAILURE,
  PRODUCT_DETAIL_SUCCESS,
  CLEAR_CURRENT_PRODUCT,
} from './ProductsReducer';
import {
  Product,
  PaginationMeta,
  ProductsState,
  ProductsQueryParams,
  initialProductsState,
} from './constants';

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
      const queryParams: Record<string, string | number | boolean | undefined> = {};
      if (params?.page) queryParams.page = params.page;
      if (params?.pageSize) queryParams.pageSize = params.pageSize;
      if (params?.category) queryParams.category = params.category;
      if (params?.minPrice !== undefined) queryParams.minPrice = params.minPrice;
      if (params?.maxPrice !== undefined) queryParams.maxPrice = params.maxPrice;
      if (params?.inStock) queryParams.inStock = params.inStock;
      if (params?.search) queryParams.search = params.search;
      if (params?.sort) queryParams.sort = params.sort;

      const res = await api.get<{
        success: boolean;
        data: { items: Product[] };
        meta: PaginationMeta;
      }>('/products', queryParams);

      dispatch({
        type: PRODUCTS_SUCCESS,
        payload: { items: res.data.items, meta: res.meta },
      });
    } catch (err: any) {
      dispatch({ type: PRODUCTS_FAILURE, payload: err.message || 'Failed to fetch products' });
    }
  }, []);

  const fetchProductById = useCallback(async (productId: string) => {
    dispatch({ type: PRODUCTS_REQUEST });
    try {
      const res = await api.get<{ success: boolean; data: Product }>(`/products/${productId}`);
      dispatch({ type: PRODUCT_DETAIL_SUCCESS, payload: res.data });
    } catch (err: any) {
      dispatch({ type: PRODUCTS_FAILURE, payload: err.message || 'Failed to fetch product' });
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
  if (!ctx) throw new Error('useProducts must be used inside ProductsProvider');
  return ctx;
};

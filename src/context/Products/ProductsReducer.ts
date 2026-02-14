import { Product, PaginationMeta, ProductsState } from './constants';

/* ========================
   ACTION TYPES
======================== */

export const PRODUCTS_REQUEST = 'PRODUCTS_REQUEST';
export const PRODUCTS_SUCCESS = 'PRODUCTS_SUCCESS';
export const PRODUCTS_FAILURE = 'PRODUCTS_FAILURE';
export const PRODUCT_DETAIL_SUCCESS = 'PRODUCT_DETAIL_SUCCESS';
export const CLEAR_CURRENT_PRODUCT = 'CLEAR_CURRENT_PRODUCT';

/* ========================
   ACTIONS
======================== */

export type ProductsAction =
  | { type: typeof PRODUCTS_REQUEST }
  | { type: typeof PRODUCTS_SUCCESS; payload: { items: Product[]; meta: PaginationMeta } }
  | { type: typeof PRODUCTS_FAILURE; payload: string }
  | { type: typeof PRODUCT_DETAIL_SUCCESS; payload: Product }
  | { type: typeof CLEAR_CURRENT_PRODUCT };

/* ========================
   REDUCER
======================== */

export default function ProductsReducer(
  state: ProductsState,
  action: ProductsAction,
): ProductsState {
  switch (action.type) {
    case PRODUCTS_REQUEST:
      return { ...state, loading: true, error: null };

    case PRODUCTS_SUCCESS:
      return {
        ...state,
        loading: false,
        products: action.payload.items,
        meta: action.payload.meta,
        error: null,
      };

    case PRODUCTS_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case PRODUCT_DETAIL_SUCCESS:
      return { ...state, loading: false, currentProduct: action.payload, error: null };

    case CLEAR_CURRENT_PRODUCT:
      return { ...state, currentProduct: null };

    default:
      return state;
  }
}

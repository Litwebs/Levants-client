import { Customer, OrderState } from './constants';

/* ========================
   ACTION TYPES
======================== */

export const ORDER_REQUEST = 'ORDER_REQUEST';
export const ORDER_FAILURE = 'ORDER_FAILURE';
export const CUSTOMER_SUCCESS = 'CUSTOMER_SUCCESS';
export const CHECKOUT_SUCCESS = 'CHECKOUT_SUCCESS';
export const ORDER_RESET = 'ORDER_RESET';

/* ========================
   ACTIONS
======================== */

export type OrderAction =
  | { type: typeof ORDER_REQUEST }
  | { type: typeof ORDER_FAILURE; payload: string }
  | { type: typeof CUSTOMER_SUCCESS; payload: Customer }
  | { type: typeof CHECKOUT_SUCCESS; payload: string }
  | { type: typeof ORDER_RESET };

/* ========================
   REDUCER
======================== */

export default function OrdersReducer(
  state: OrderState,
  action: OrderAction,
): OrderState {
  switch (action.type) {
    case ORDER_REQUEST:
      return { ...state, loading: true, error: null };

    case ORDER_FAILURE:
      return { ...state, loading: false, error: action.payload };

    case CUSTOMER_SUCCESS:
      return { ...state, loading: false, customer: action.payload, error: null };

    case CHECKOUT_SUCCESS:
      return { ...state, loading: false, checkoutUrl: action.payload, error: null };

    case ORDER_RESET:
      return { customer: null, loading: false, error: null, checkoutUrl: null };

    default:
      return state;
  }
}

import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import api from '@/api/client';
import OrdersReducer, {
  ORDER_REQUEST,
  ORDER_FAILURE,
  CUSTOMER_SUCCESS,
  CHECKOUT_SUCCESS,
  ORDER_RESET,
} from './OrdersReducer';
import {
  OrderState,
  CustomerPayload,
  Customer,
  CreateOrderPayload,
  CreateOrderResponse,
  initialOrderState,
} from './constants';

/* ========================
   CONTEXT TYPE
======================== */

interface OrdersContextType extends OrderState {
  createGuestCustomer: (payload: CustomerPayload) => Promise<Customer | null>;
  createOrder: (payload: CreateOrderPayload) => Promise<string | null>;
  resetOrder: () => void;
}

const OrdersContext = createContext<OrdersContextType | null>(null);

/* ========================
   PROVIDER
======================== */

export const OrdersProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(OrdersReducer, initialOrderState);

  const createGuestCustomer = useCallback(async (payload: CustomerPayload): Promise<Customer | null> => {
    dispatch({ type: ORDER_REQUEST });
    try {
      const res = await api.post<{
        success: boolean;
        data: { customer: Customer };
        message?: string;
      }>('/customers/guest', payload);

      if (!res.success) {
        dispatch({ type: ORDER_FAILURE, payload: res.message || 'Failed to create customer' });
        return null;
      }

      dispatch({ type: CUSTOMER_SUCCESS, payload: res.data.customer });
      return res.data.customer;
    } catch (err: any) {
      dispatch({ type: ORDER_FAILURE, payload: err.message || 'Failed to create customer' });
      return null;
    }
  }, []);

  const createOrder = useCallback(async (payload: CreateOrderPayload): Promise<string | null> => {
    dispatch({ type: ORDER_REQUEST });
    try {
      const res = await api.post<{
        success: boolean;
        data: CreateOrderResponse;
        message?: string;
      }>('/orders', payload);

      if (!res.success) {
        dispatch({ type: ORDER_FAILURE, payload: res.message || 'Failed to create order' });
        return null;
      }

      dispatch({ type: CHECKOUT_SUCCESS, payload: res.data.checkoutUrl });
      return res.data.checkoutUrl;
    } catch (err: any) {
      dispatch({ type: ORDER_FAILURE, payload: err.message || 'Failed to create order' });
      return null;
    }
  }, []);

  const resetOrder = useCallback(() => {
    dispatch({ type: ORDER_RESET });
  }, []);

  return (
    <OrdersContext.Provider
      value={{
        ...state,
        createGuestCustomer,
        createOrder,
        resetOrder,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used inside OrdersProvider');
  return ctx;
};

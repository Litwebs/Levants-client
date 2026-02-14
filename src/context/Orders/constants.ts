/* ========================
   TYPES
======================== */

export interface CustomerAddress {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
}

export interface CustomerPayload {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: CustomerAddress;
}

export interface Customer {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  addresses: (CustomerAddress & { isDefault: boolean })[];
  isGuest: boolean;
  address: CustomerAddress | null;
}

export interface OrderItemPayload {
  variantId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  customerId: string;
  items: OrderItemPayload[];
  discountCode?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  checkoutUrl: string;
}

export interface OrderState {
  customer: Customer | null;
  loading: boolean;
  error: string | null;
  checkoutUrl: string | null;
}

/* ========================
   INITIAL STATE
======================== */

export const initialOrderState: OrderState = {
  customer: null,
  loading: false,
  error: null,
  checkoutUrl: null,
};

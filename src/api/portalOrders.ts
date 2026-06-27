import api from "@/api/client";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type PortalOrderItem = {
  name: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type PortalOrderRefund = {
  stripeRefundId?: string;
  paymentIntentId?: string;
  currency?: string;
  amount?: number;
  amountMinor?: number;
  status?: "pending" | "succeeded" | "failed";
  refundedAt?: string;
  failedAt?: string;
  reason?: string;
  restock?: boolean;
  createdAt?: string;
};

export type PortalLegacyRefund = {
  refundedAt?: string;
  reason?: string;
  restock?: boolean;
  stripeRefundId?: string;
};

export type PortalOrder = {
  _id: string;
  customer: string;
  orderId: string;
  status: string;
  orderType?: "one_time" | "subscription_generated";
  subscription?: {
    _id: string;
    subscriptionNumber?: string;
  } | null;
  deliveryStatus?: string;
  portalDeliveryStatus?: string | null;
  total: number;
  subtotal: number;
  deliveryFee?: number;
  currency?: string;
  customerInstructions?: string;
  deliveryDate?: string | null;
  paidAt?: string | null;
  amountPaid?: number;
  stripePaymentIntentId?: string;
  stripeCheckoutSessionId?: string;
  items: PortalOrderItem[];
  refund?: PortalLegacyRefund;
  refunds?: PortalOrderRefund[];
  deliveryAddress: {
    fullName?: string | null;
    phone?: string | null;
    line1: string;
    line2?: string | null;
    city: string;
    postcode: string;
    country: string;
  };
  customerDetails?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  metadata?: {
    deliveredAt?: string;
    deliveryProofUrl?: string;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
};

export type OrdersListMeta = {
  page: number;
  pageSize: number;
  total: number;
};

type ListOrdersResponse = {
  orders: PortalOrder[];
  meta: OrdersListMeta;
};

type GetOrderResponse = {
  order: PortalOrder;
};

type GetReceiptUrlResponse = {
  receiptUrl: string;
};

export type ListOrdersQuery = {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
};

const base = "/portal/orders";

export const portalOrdersApi = {
  list: (query: ListOrdersQuery = {}) =>
    api.get<ApiEnvelope<ListOrdersResponse>>(base, query),

  getById: (orderId: string) =>
    api.get<ApiEnvelope<GetOrderResponse>>(`${base}/${orderId}`),

  getReceiptUrl: (orderId: string) =>
    api.get<ApiEnvelope<GetReceiptUrlResponse>>(`${base}/${orderId}/receipt-url`),
};

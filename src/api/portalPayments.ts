import api from "@/api/client";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type PortalPaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type PortalPayment = {
  _id: string;
  amount: number;
  currency?: string;
  status: PortalPaymentStatus;
  providerReference?: string | null;
  paidAt?: string | null;
  failedAt?: string | null;
  refundedAt?: string | null;
  createdAt: string;
  order?: {
    _id: string;
    orderId?: string;
    status?: string;
    total?: number;
  } | null;
  subscription?: {
    _id: string;
    subscriptionNumber?: string;
  } | null;
};

export type PortalPaymentMethod = {
  _id: string;
  type: "card" | "bank_transfer" | "cash" | "other";
  cardBrand?: string | null;
  lastFour?: string | null;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  isDefault?: boolean;
};

export type PaymentsMeta = {
  page: number;
  pageSize: number;
  total: number;
};

type ListPaymentsResponse = {
  payments: PortalPayment[];
  meta: PaymentsMeta;
};

type ListPaymentMethodsResponse = {
  paymentMethods: PortalPaymentMethod[];
};

type StripeConfigResponse = {
  publishableKey: string;
};

type SetupIntentResponse = {
  clientSecret: string;
  publishableKey: string;
};

export type ListPaymentsQuery = {
  page?: number;
  pageSize?: number;
};

const base = "/portal/payments";

export const portalPaymentsApi = {
  list: (query: ListPaymentsQuery = {}) =>
    api.get<ApiEnvelope<ListPaymentsResponse>>(base, query),

  listPaymentMethods: () =>
    api.get<ApiEnvelope<ListPaymentMethodsResponse>>(`${base}/payment-methods`),

  getStripeConfig: () =>
    api.get<ApiEnvelope<StripeConfigResponse>>(`${base}/config`),

  createSetupIntent: () =>
    api.post<ApiEnvelope<SetupIntentResponse>>(
      `${base}/payment-methods/setup-intent`,
    ),

  attachPaymentMethod: (payload: {
    stripePaymentMethodId: string;
    setDefault?: boolean;
  }) =>
    api.post<ApiEnvelope<{ paymentMethod: PortalPaymentMethod }>>(
      `${base}/payment-methods/attach`,
      payload,
    ),

  setDefaultPaymentMethod: (paymentMethodId: string) =>
    api.post<ApiEnvelope<{ paymentMethod: PortalPaymentMethod }>>(
      `${base}/payment-methods/${paymentMethodId}/default`,
    ),

  deletePaymentMethod: (paymentMethodId: string) =>
    api.delete<ApiEnvelope<null>>(`${base}/payment-methods/${paymentMethodId}`),
};

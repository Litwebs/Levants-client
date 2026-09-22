import api from "@/api/client";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type ConfirmCheckoutResponse = {
  orderId: string;
  orderNumber: string;
  status: string;
  paidAt?: string | null;
};

export const ordersApi = {
  confirmCheckout: (checkoutSessionId: string) =>
    api.post<ApiEnvelope<ConfirmCheckoutResponse>>("/orders/checkout/confirm", {
      checkoutSessionId,
    }),
};

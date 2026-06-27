import api from "@/api/client";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type StoreCreditTransactionType =
  | "subscription_refund"
  | "order_redemption"
  | "order_redemption_reversal"
  | "admin_adjustment";

export type PortalCreditTransaction = {
  _id: string;
  /** Signed amount in MINOR units (pence). Positive = credit, negative = spend. */
  amount: number;
  balanceAfter: number;
  type: StoreCreditTransactionType;
  reason?: string | null;
  subscription?: string | null;
  order?: string | null;
  createdAt: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
};

type CreditResponse = {
  /** Current balance in MINOR units (pence). */
  balance: number;
  transactions: PortalCreditTransaction[];
};

export const portalCreditsApi = {
  get: (query: { page?: number; pageSize?: number } = {}) =>
    api.get<ApiEnvelope<CreditResponse> & { meta?: PaginationMeta }>(
      "/portal/credits",
      query,
    ),
};

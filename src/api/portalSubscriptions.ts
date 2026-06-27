import api from "@/api/client";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type PortalSubscriptionStatus = "active" | "paused" | "cancelled";
export type PortalSubscriptionFrequency =
  | "weekly"
  | "every_two_weeks"
  | "monthly";

export type PortalSubscriptionItem = {
  _id: string;
  product: string;
  variant: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string | null;
};

export type PortalSubscription = {
  _id: string;
  subscriptionNumber?: string;
  status: PortalSubscriptionStatus;
  frequency: PortalSubscriptionFrequency;
  preferredDeliveryDay: number;
  nextDeliveryDate?: string | null;
  startDate?: string | null;
  deliveryAddress: {
    line1: string;
    line2?: string | null;
    city: string;
    postcode: string;
    country: string;
    deliveryInstructions?: string | null;
  };
  items: PortalSubscriptionItem[];
  // Edits made after the cut-off are staged here and applied automatically
  // from `effectiveFrom` (the delivery after the upcoming one).
  pendingChanges?: {
    items?: Array<{
      name: string;
      sku?: string;
      quantity: number;
      unitPrice: number;
    }>;
    effectiveFrom?: string | null;
  } | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PortalSubscriptionDelivery = {
  _id: string;
  scheduledDate: string;
  status: string;
  generatedAt?: string | null;
  order?: {
    _id: string;
    orderId?: string;
    status?: string;
    deliveryStatus?: string;
    total?: number;
  } | null;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
};

type ListSubscriptionsResponse = {
  subscriptions: PortalSubscription[];
  meta: PaginationMeta;
};

export type PortalSubscriptionCutoff = {
  cutoffAt?: string | null;
  isPastCutoff: boolean;
  cutoffDaysBefore: number;
  cutoffTime: string;
  deliveryDays: number[];
};

export type SubscriptionRefundMethod = "credit" | "refund";

type SubscriptionResponse = {
  subscription: PortalSubscription;
  cutoff?: PortalSubscriptionCutoff;
  appliedTo?: "upcoming" | "next";
  chargedMinor?: number;
  /** Amount refunded back to the customer's card, in MINOR units (pence). */
  refundedMinor?: number;
  /** Amount granted as store credit, in MINOR units (pence). */
  creditedMinor?: number;
  stripeRefundId?: string | null;
};

export type PortalSubscriptionSettings = {
  deliveryDays: number[];
  cutoffDaysBefore: number;
  cutoffTime: string;
};

type SubscriptionSettingsResponse = {
  settings: PortalSubscriptionSettings;
};

type DeliveriesResponse = {
  deliveries: PortalSubscriptionDelivery[];
  meta: PaginationMeta;
};

export type CreateSubscriptionPayload = {
  frequency: PortalSubscriptionFrequency;
  preferredDeliveryDay: number;
  deliveryAddressId: string;
  notes?: string;
  items: Array<{ variantId: string; quantity: number }>;
};

const base = "/portal/subscriptions";

export const portalSubscriptionsApi = {
  list: (query: { status?: PortalSubscriptionStatus; page?: number; pageSize?: number } = {}) =>
    api.get<ApiEnvelope<ListSubscriptionsResponse>>(base, query),

  getSettings: () =>
    api.get<ApiEnvelope<SubscriptionSettingsResponse>>(`${base}/settings`),

  get: (subscriptionId: string) =>
    api.get<ApiEnvelope<SubscriptionResponse>>(`${base}/${subscriptionId}`),

  create: (payload: CreateSubscriptionPayload) =>
    api.post<ApiEnvelope<SubscriptionResponse>>(base, payload),

  update: (
    subscriptionId: string,
    payload: Partial<{
      frequency: PortalSubscriptionFrequency;
      preferredDeliveryDay: number;
      deliveryAddressId: string;
      notes: string;
    }>,
  ) => api.patch<ApiEnvelope<SubscriptionResponse>>(`${base}/${subscriptionId}`, payload),

  pause: (subscriptionId: string) =>
    api.post<ApiEnvelope<SubscriptionResponse>>(`${base}/${subscriptionId}/pause`),

  resume: (subscriptionId: string) =>
    api.post<ApiEnvelope<SubscriptionResponse>>(`${base}/${subscriptionId}/resume`),

  cancel: (subscriptionId: string, reason?: string) =>
    api.post<ApiEnvelope<SubscriptionResponse>>(`${base}/${subscriptionId}/cancel`, {
      ...(reason ? { reason } : {}),
    }),

  addItem: (
    subscriptionId: string,
    payload: {
      variantId: string;
      quantity: number;
      refundMethod?: SubscriptionRefundMethod;
    },
  ) =>
    api.post<ApiEnvelope<SubscriptionResponse>>(`${base}/${subscriptionId}/items`, payload),

  updateItem: (
    subscriptionId: string,
    itemId: string,
    payload: { quantity: number; refundMethod?: SubscriptionRefundMethod },
  ) =>
    api.patch<ApiEnvelope<SubscriptionResponse>>(
      `${base}/${subscriptionId}/items/${itemId}`,
      payload,
    ),

  removeItem: (
    subscriptionId: string,
    itemId: string,
    payload: { refundMethod?: SubscriptionRefundMethod } = {},
  ) =>
    api.delete<ApiEnvelope<SubscriptionResponse>>(
      `${base}/${subscriptionId}/items/${itemId}`,
      payload,
    ),

  listDeliveries: (
    subscriptionId: string,
    query: { page?: number; pageSize?: number } = {},
  ) =>
    api.get<ApiEnvelope<DeliveriesResponse>>(
      `${base}/${subscriptionId}/deliveries`,
      query,
    ),
};

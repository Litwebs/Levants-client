import api from "@/api/client";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

const ensureOperationId = <T extends { operationId?: string }>(payload: T): T & {
  operationId: string;
} => ({
  ...payload,
  operationId: payload.operationId || globalThis.crypto.randomUUID(),
});

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
  pausedUntil?: string | null;
  isCancellationScheduled?: boolean;
  cancellationEffectiveAfter?: string | null;
  frequency: PortalSubscriptionFrequency;
  preferredDeliveryDay: number;
  preferredDeliveryDays?: number[];
  deliveryDayPlans?: Array<{
    day: number;
    items: PortalSubscriptionItem[];
  }>;
  upcomingDeliveryDate?: string | null;
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
      _id?: string;
      name: string;
      sku?: string;
      quantity: number;
      unitPrice: number;
      variant?: string;
      imageUrl?: string | null;
    }>;
    deliveryDayPlans?: Array<{
      day: number;
      items: PortalSubscriptionItem[];
    }>;
    deliveryAddress?: {
      line1: string;
      line2?: string | null;
      city: string;
      postcode: string;
      country: string;
      deliveryInstructions?: string | null;
    };
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
  cutoffAt?: string | null;
  isPastCutoff?: boolean;
  generatedAt?: string | null;
  order?: {
    _id: string;
    orderId?: string;
    status?: string;
    deliveryStatus?: string;
    total?: number;
  } | null;
  addOns?: Array<{
    operationId: string;
    amountMinor: number;
    stripePaymentIntentId: string;
    paidAt: string;
    items: Array<{
      product: string;
      variant: string;
      name: string;
      sku: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }>;
  }>;
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
  timeZone?: string;
  deliveryDayCutoffs?: Array<{
    day: number;
    deliveryDate?: string | null;
    cutoffAt?: string | null;
    effectiveFrom?: string | null;
    isPastCutoff: boolean;
  }>;
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

type DeliveryAddOnResponse = {
  delivery: PortalSubscriptionDelivery;
  chargedMinor: number;
  order?: {
    _id: string;
    orderId?: string;
    total?: number;
  } | null;
};

export type CreateSubscriptionPayload = {
  operationId?: string;
  frequency: PortalSubscriptionFrequency;
  preferredDeliveryDay?: number;
  preferredDeliveryDays?: number[];
  deliveryDayPlans?: Array<{
    day: number;
    items: Array<{ variantId: string; quantity: number }>;
  }>;
  deliveryAddressId: string;
  deliveryInstructions?: string;
  notes?: string;
  items: Array<{ variantId: string; quantity: number }>;
};

const base = "/portal/subscriptions";

export const portalSubscriptionsApi = {
  list: (query: { status?: PortalSubscriptionStatus; page?: number; pageSize?: number } = {}) =>
    api.get<ApiEnvelope<ListSubscriptionsResponse>>(base, query),

  getSettings: () =>
    api.get<ApiEnvelope<SubscriptionSettingsResponse>>(`${base}/settings`),

  getPreparedDraft: () =>
    api.get<ApiEnvelope<{ draft: Record<string, unknown> | null }>>(
      `${base}/prepared-draft`,
    ),

  get: (subscriptionId: string) =>
    api.get<ApiEnvelope<SubscriptionResponse>>(`${base}/${subscriptionId}`),

  create: (payload: CreateSubscriptionPayload) =>
    api.post<ApiEnvelope<SubscriptionResponse>>(base, ensureOperationId(payload)),

  update: (
    subscriptionId: string,
    payload: Partial<{
      frequency: PortalSubscriptionFrequency;
      preferredDeliveryDay: number;
      preferredDeliveryDays: number[];
      changedDeliveryDays: number[];
      deliveryDayPlans: Array<{
        day: number;
        items: Array<{ variantId: string; quantity: number }>;
      }>;
      deliveryAddressId: string;
      notes: string;
      refundMethod: SubscriptionRefundMethod;
      operationId: string;
    }>,
  ) =>
    api.patch<ApiEnvelope<SubscriptionResponse>>(
      `${base}/${subscriptionId}`,
      ensureOperationId(payload),
    ),

  pause: (
    subscriptionId: string,
    resumeOn: string,
    refundMethod: SubscriptionRefundMethod = "refund",
    operationId?: string,
  ) =>
    api.post<ApiEnvelope<SubscriptionResponse>>(
      `${base}/${subscriptionId}/pause`,
      ensureOperationId({
        resumeOn,
        refundMethod,
        operationId,
      }),
    ),

  resume: (subscriptionId: string, operationId?: string) =>
    api.post<ApiEnvelope<SubscriptionResponse>>(
      `${base}/${subscriptionId}/resume`,
      ensureOperationId({ operationId }),
    ),

  cancel: (
    subscriptionId: string,
    payload: {
      reason?: string;
      refundMethod?: SubscriptionRefundMethod;
      operationId?: string;
    } = {},
  ) =>
    api.post<ApiEnvelope<SubscriptionResponse>>(
      `${base}/${subscriptionId}/cancel`,
      ensureOperationId({
        ...(payload.reason ? { reason: payload.reason } : {}),
        ...(payload.refundMethod ? { refundMethod: payload.refundMethod } : {}),
        operationId: payload.operationId,
      }),
    ),

  addItem: (
    subscriptionId: string,
    payload: {
      variantId: string;
      quantity: number;
      refundMethod?: SubscriptionRefundMethod;
      operationId?: string;
    },
  ) =>
    api.post<ApiEnvelope<SubscriptionResponse>>(
      `${base}/${subscriptionId}/items`,
      ensureOperationId(payload),
    ),

  replaceItems: (
    subscriptionId: string,
    payload: {
      items: Array<{ itemId: string; quantity: number }>;
      refundMethod?: SubscriptionRefundMethod;
      operationId?: string;
    },
  ) =>
    api.put<ApiEnvelope<SubscriptionResponse>>(
      `${base}/${subscriptionId}/items`,
      ensureOperationId(payload),
    ),

  addNextDeliveryAddOn: (
    subscriptionId: string,
    payload: {
      operationId: string;
      items: Array<{ variantId: string; quantity: number }>;
    },
  ) =>
    api.post<ApiEnvelope<DeliveryAddOnResponse>>(
      `${base}/${subscriptionId}/next-delivery/add-ons`,
      payload,
    ),

  updateItem: (
    subscriptionId: string,
    itemId: string,
    payload: {
      quantity: number;
      refundMethod?: SubscriptionRefundMethod;
      operationId?: string;
    },
  ) =>
    api.patch<ApiEnvelope<SubscriptionResponse>>(
      `${base}/${subscriptionId}/items/${itemId}`,
      ensureOperationId(payload),
    ),

  removeItem: (
    subscriptionId: string,
    itemId: string,
    payload: {
      refundMethod?: SubscriptionRefundMethod;
      operationId?: string;
    } = {},
  ) =>
    api.delete<ApiEnvelope<SubscriptionResponse>>(
      `${base}/${subscriptionId}/items/${itemId}`,
      ensureOperationId(payload),
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

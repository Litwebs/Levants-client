import api from "@/api/client";
import { withSubscriptionMutationRetry } from "./subscriptionMutationRetry";
import { withSubscriptionCreationRetry } from "./subscriptionCreationRetry";
import { portalAuthApi } from "./portalAuth";

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
  stockDeferralEnabled?: boolean;
  stockDeferralAvailable?: boolean;
  recurringPriceChange?: {
    status: "queued" | "provider_pending" | "applied";
    previousAmountMinor: number;
    nextAmountMinor: number;
    effectiveFrom?: string | null;
  } | null;
  introOffer?: { firstChargeMinor: number; discountMinor: number; percentOff: number; discountType?: "percentage" | "fixed"; amountOff?: number };
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
  customerVersion: number;
};

export type SubscriptionRefundRecovery = {
  orderId: string;
  refundedMinor: number;
  remainingMinor: number;
  retryAvailable: boolean;
  operationId?: string;
  resumeOn?: string;
  expectedVersion?: number;
  refundMethod?: "refund";
};

export type PortalSubscriptionDelivery = {
  stockAvailability?: { deferred: Array<{name: string; quantity: number}>; notChargedMinor: number; amountMinor: number } | null;
  _id: string;
  scheduledDate: string;
  status: string;
  cutoffAt?: string | null;
  isPastCutoff?: boolean;
  generatedAt?: string | null;
  canChangeThisDelivery?: boolean;
  recurringItems?: DeliveryReductionItem[];
  oneTimeChanges?: DeliveryReductionChange[];
  order?: {
    _id: string;
    orderId?: string;
    status?: string;
    deliveryStatus?: string;
    total?: number;
    deliveryFee?: number;
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

export type DeliveryReductionItem = Omit<PortalSubscriptionItem, "_id"> & { _id?: string };
export type DeliveryReductionSelection = Array<{ variant: string; quantity: number }>;
export type DeliveryReductionQuote = {
  deliveryId: string;
  scheduledDate: string;
  cutoffAt: string;
  expectedVersion: number;
  quoteToken: string;
  before: DeliveryReductionItem[];
  after: DeliveryReductionItem[];
  originalTotalMinor: number;
  revisedTotalMinor: number;
  creditedMinor: number;
  deliveryFeeMinor: number;
  cancelsDelivery: boolean;
  hasChanges: boolean;
};
export type DeliveryReductionChange = Pick<DeliveryReductionQuote,
  "before" | "after" | "originalTotalMinor" | "revisedTotalMinor" | "creditedMinor" | "cancelsDelivery"> & {
    operationId: string;
    createdAt: string;
    creditTransaction: string | null;
  };
export type DeliveryReductionRequest = {
  items: DeliveryReductionSelection;
  quoteToken: string;
  expectedVersion: number;
  operationId: string;
};
export type DeliveryReductionResult = {
  deliveryId: string;
  adjustment: DeliveryReductionChange;
  creditedMinor: number;
  revisedTotalMinor: number;
  customerVersion: number;
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
    paymentState?: "paid" | "unpaid";
    lockedForFulfilment?: boolean;
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
  discountCode?: string;
  operationId?: string;
  pricingQuoteToken?: string;
  deferUnavailable?: boolean;
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
  enableStockDeferral: (id: string) => api.post<ApiEnvelope<{subscription: PortalSubscription}>>(`${base}/${id}/stock-deferral`, {accept: true, operationId: crypto.randomUUID()}),
  getDeliveryReduction: (subscriptionId: string, deliveryId: string) =>
    api.get<ApiEnvelope<DeliveryReductionQuote>>(`${base}/${subscriptionId}/deliveries/${deliveryId}/one-time-change`),

  previewDeliveryReduction: (subscriptionId: string, deliveryId: string, items: DeliveryReductionSelection) =>
    api.post<ApiEnvelope<DeliveryReductionQuote>>(`${base}/${subscriptionId}/deliveries/${deliveryId}/one-time-change/preview`, { items }),

  confirmDeliveryReduction: (subscriptionId: string, deliveryId: string, payload: DeliveryReductionRequest) =>
    api.post<ApiEnvelope<DeliveryReductionResult>>(`${base}/${subscriptionId}/deliveries/${deliveryId}/one-time-change/confirm`, payload),

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

  preview: (payload: CreateSubscriptionPayload) => api.post<ApiEnvelope<{ quote: import("@/portal/components/SubscriptionIntroOfferSummary").SubscriptionPricingQuote }>>(`${base}/preview`, payload),

  create: async (payload: CreateSubscriptionPayload) => {
    const account = await portalAuthApi.me();
    return withSubscriptionCreationRetry(account.data?.customer?._id || "", payload,
      (body) => api.post<ApiEnvelope<SubscriptionResponse>>(base, body));
  },

  update: (
    subscriptionId: string,
    payload: {
      expectedVersion: number;
      operationId?: string;
      frequency?: PortalSubscriptionFrequency;
      preferredDeliveryDay?: number;
      preferredDeliveryDays?: number[];
      changedDeliveryDays?: number[];
      deliveryDayPlans?: Array<{
        day: number;
        items: Array<{ variantId: string; quantity: number }>;
      }>;
      deliveryAddressId?: string;
      notes?: string;
      refundMethod?: SubscriptionRefundMethod;
    },
  ) =>
    withSubscriptionMutationRetry(`patch:${subscriptionId}/update`, payload,
      (body) => api.patch<ApiEnvelope<SubscriptionResponse>>(`${base}/${subscriptionId}`, body)),

  pause: (
    subscriptionId: string,
    resumeOn: string,
    expectedVersion: number,
    refundMethod: SubscriptionRefundMethod = "refund",
    operationId?: string,
  ) =>
    api.post<ApiEnvelope<SubscriptionResponse>>(
      `${base}/${subscriptionId}/pause`,
      ensureOperationId({
        resumeOn,
        refundMethod,
        expectedVersion,
        operationId,
      }),
    ),

  resume: (
    subscriptionId: string,
    expectedVersion: number,
    operationId?: string,
  ) =>
    api.post<ApiEnvelope<SubscriptionResponse>>(
      `${base}/${subscriptionId}/resume`,
      ensureOperationId({ expectedVersion, operationId }),
    ),

  cancel: (
    subscriptionId: string,
    payload: {
      expectedVersion: number;
      reason?: string;
      refundMethod?: SubscriptionRefundMethod;
      operationId?: string;
    },
  ) =>
    api.post<ApiEnvelope<SubscriptionResponse>>(
      `${base}/${subscriptionId}/cancel`,
      ensureOperationId({
        ...(payload.reason ? { reason: payload.reason } : {}),
        ...(payload.refundMethod ? { refundMethod: payload.refundMethod } : {}),
        expectedVersion: payload.expectedVersion,
        operationId: payload.operationId,
      }),
    ),

  addItem: (
    subscriptionId: string,
    payload: {
      variantId: string;
      quantity: number;
      expectedVersion: number;
      refundMethod?: SubscriptionRefundMethod;
      operationId?: string;
    },
  ) =>
    withSubscriptionMutationRetry(`post:${subscriptionId}/addItem`, payload,
      (body) => api.post<ApiEnvelope<SubscriptionResponse>>(`${base}/${subscriptionId}/items`, body)),

  replaceItems: (
    subscriptionId: string,
    payload: {
      items: Array<{ itemId: string; quantity: number }>;
      expectedVersion: number;
      refundMethod?: SubscriptionRefundMethod;
      operationId?: string;
    },
  ) =>
    withSubscriptionMutationRetry(`put:${subscriptionId}/replaceItems`, payload,
      (body) => api.put<ApiEnvelope<SubscriptionResponse>>(`${base}/${subscriptionId}/items`, body)),

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
      expectedVersion: number;
      refundMethod?: SubscriptionRefundMethod;
      operationId?: string;
    },
  ) =>
    withSubscriptionMutationRetry(`patch:${subscriptionId}/${itemId}`, payload,
      (body) => api.patch<ApiEnvelope<SubscriptionResponse>>(`${base}/${subscriptionId}/items/${itemId}`, body)),

  removeItem: (
    subscriptionId: string,
    itemId: string,
    payload: {
      expectedVersion: number;
      refundMethod?: SubscriptionRefundMethod;
      operationId?: string;
    },
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




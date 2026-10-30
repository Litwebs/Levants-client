import RecurringPriceNotice from "@/portal/components/RecurringPriceNotice";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  Plus,
  Minus,
  Trash2,
  CalendarDays,
  MapPin,
  Pause,
  Play,
  Loader2,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  Package,
  Settings2,
  Clock3,
  CheckCircle2,
  Info,
} from "lucide-react";
import { canModifySubscription } from "@/portal/utils/subscriptionEditingPolicy";
import { recurringItemPaymentMessage } from "@/portal/utils/recurringItemPaymentMessage";
import { deliveryFeesForDraft } from "@/portal/utils/subscriptionDraftPricing";
import { needsItemRefundChoice, saveDeliveryDayItemEdits } from "@/api/subscriptionDayItemEdits";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import styles from "./SubscriptionDetailPage.module.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  SubscriptionStatusBadge,
  DeliveryStatusBadge,
} from "@/portal/components/StatusBadges";
import DeliveryReduction from "@/portal/components/DeliveryReduction";
import DeliveryReductionHistory from "@/portal/components/DeliveryReductionHistory";
import DeliveryReductionGuide from "@/portal/components/DeliveryReductionGuide";
import { ConfirmationModal, EmptyState } from "@/portal/components/PortalUI";
import { ApiError } from "@/api/client";
import { usePortalCustomer } from "@/portal/context/CustomerContext";
import { useAddresses } from "@/portal/context/AddressesContext";
import { selectSubscriptionDeliveryPage, type SubscriptionDeliveryPage } from "@/api/subscriptionDeliveryPage";
import {
  portalSubscriptionsApi,
  type PortalSubscription,
  type PortalSubscriptionItem,
  type PortalSubscriptionDelivery,
  type PortalSubscriptionCutoff,
  type SubscriptionRefundMethod,
  type SubscriptionRefundRecovery,
} from "@/api/portalSubscriptions";
import {
  formatCutoffDate,
  getDeliveryDayCutoff,
  isPastCutoffInstant,
} from "@/portal/utils/subscriptionCutoff";
import {
  getNextSubscriptionDelivery,
  getNextSubscriptionDeliveryDate,
} from "@/portal/utils/nextSubscriptionDelivery";

type EditableSubscriptionItem = {
  localId: string;
  existingItemId?: string;
  variantId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string | null;
};

const toEditableItem = (
  item: PortalSubscriptionItem,
): EditableSubscriptionItem => ({
  localId: item._id,
  existingItemId: item._id,
  variantId: item.variant,
  name: item.name,
  sku: item.sku,
  quantity: Number(item.quantity || 1),
  unitPrice: Number(item.unitPrice || 0),
  imageUrl: item.imageUrl,
});

const getItemMatchKey = (item: { sku?: string; name: string }) =>
  item.sku || item.name;

const toEditablePendingItem = (
  item: NonNullable<
    NonNullable<PortalSubscription["pendingChanges"]>["items"]
  >[number],
  index: number,
  liveItems: PortalSubscriptionItem[],
): EditableSubscriptionItem => {
  const matchKey = getItemMatchKey(item);
  const liveMatch = liveItems.find(
    (liveItem) => getItemMatchKey(liveItem) === matchKey,
  );
  const pendingItemId = item._id || liveMatch?._id;

  return {
    localId: pendingItemId || `pending:${matchKey}:${index}`,
    existingItemId: pendingItemId,
    variantId: item.variant || liveMatch?.variant || matchKey,
    name: item.name,
    sku: item.sku || liveMatch?.sku || "",
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.unitPrice || 0),
    imageUrl: liveMatch?.imageUrl,
  };
};

const buildEditableItems = (
  subscription: PortalSubscription,
  isPastCutoff: boolean,
): EditableSubscriptionItem[] => {
  if (isPastCutoff && subscription.pendingChanges?.items?.length) {
    return subscription.pendingChanges.items.map((item, index) =>
      toEditablePendingItem(item, index, subscription.items),
    );
  }

  return subscription.items.map(toEditableItem);
};

const cloneEditableItem = (
  item: EditableSubscriptionItem,
): EditableSubscriptionItem => ({
  ...item,
});

const buildEditableDayPlans = (
  subscription: PortalSubscription,
  isPastCutoff: boolean,
  selectedDays: string[],
) => {
  const sourcePlans =
    isPastCutoff && subscription.pendingChanges?.deliveryDayPlans?.length
      ? subscription.pendingChanges.deliveryDayPlans
      : subscription.deliveryDayPlans;
  const fallbackItems = buildEditableItems(subscription, isPastCutoff);

  const planByDay = new Map(
    (sourcePlans || []).map((plan) => [toDayName(plan.day), plan.items || []]),
  );

  return selectedDays.reduce<Record<string, EditableSubscriptionItem[]>>(
    (acc, dayName) => {
      const planItems = planByDay.get(dayName);
      if (Array.isArray(planItems) && planItems.length > 0) {
        acc[dayName] = planItems.map(toEditableItem);
        return acc;
      }
      acc[dayName] = fallbackItems.map(cloneEditableItem);
      return acc;
    },
    {},
  );
};

const getDraftIdentityKey = (item: EditableSubscriptionItem) =>
  item.existingItemId || getItemMatchKey(item);

const getDayPlanItemKey = (item: EditableSubscriptionItem) =>
  item.variantId || getDraftIdentityKey(item);

const toDayName = (day: number) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[day] || "Tuesday";
};

const dayNameToIndex = (value: string) => {
  const map: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  return map[value] ?? 2;
};

const normalizeDayIndexes = (days: number[]) =>
  [...new Set(days)]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b);

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatInputDate = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount || 0);

const SUBSCRIPTION_DELIVERY_FEE = 1;

const getDeliveryAddOnTotal = (delivery: PortalSubscriptionDelivery) =>
  (delivery.addOns || []).reduce(
    (sum, addOn) => sum + Number(addOn.amountMinor || 0) / 100,
    0,
  );

const getDeliveryAddOnQuantity = (delivery: PortalSubscriptionDelivery) =>
  (delivery.addOns || []).reduce(
    (total, addOn) =>
      total +
      addOn.items.reduce(
        (itemTotal, item) => itemTotal + Number(item.quantity || 0),
        0,
      ),
    0,
  );

const getDeliveryAddOnItems = (delivery: PortalSubscriptionDelivery) => {
  const itemsByVariant = new Map<
    string,
    { key: string; name: string; quantity: number; subtotal: number }
  >();

  for (const addOn of delivery.addOns || []) {
    for (const item of addOn.items) {
      const key = String(item.variant || item.sku || item.name);
      const current = itemsByVariant.get(key);
      if (current) {
        current.quantity += Number(item.quantity || 0);
        current.subtotal += Number(item.subtotal || 0);
        continue;
      }
      itemsByVariant.set(key, {
        key,
        name: item.name,
        quantity: Number(item.quantity || 0),
        subtotal: Number(item.subtotal || 0),
      });
    }
  }

  return Array.from(itemsByVariant.values());
};

const getRecurringItemsForDelivery = (
  delivery: PortalSubscriptionDelivery,
  subscription: PortalSubscription,
) => {
  if (Array.isArray(delivery.recurringItems)) return delivery.recurringItems;
  const adjustment = delivery.oneTimeChanges?.at(-1);
  if (adjustment) return adjustment.after;
  const deliveryDay = new Date(delivery.scheduledDate).getDay();
  const dayPlan = subscription.deliveryDayPlans?.find(
    (plan) => Number(plan.day) === deliveryDay,
  );
  return dayPlan?.items?.length ? dayPlan.items : subscription.items;
};

const getRecurringSubtotalForDelivery = (
  delivery: PortalSubscriptionDelivery,
  subscription: PortalSubscription,
) =>
  getRecurringItemsForDelivery(delivery, subscription).reduce(
    (sum, item) =>
      sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
    0,
  );

const getTotalForDelivery = (
  delivery: PortalSubscriptionDelivery,
  subscription: PortalSubscription,
) => {
  const orderTotal = Number(delivery.order?.total);
  if (delivery.order?.total != null && Number.isFinite(orderTotal) && orderTotal >= 0) return orderTotal;
  return (
    getRecurringSubtotalForDelivery(delivery, subscription) +
    SUBSCRIPTION_DELIVERY_FEE +
    getDeliveryAddOnTotal(delivery)
  );
};

const formatDayList = (days: string[]) => {
  if (days.length <= 1) return days[0] || "the selected day";
  if (days.length === 2) return `${days[0]} and ${days[1]}`;
  return `${days.slice(0, -1).join(", ")}, and ${days[days.length - 1]}`;
};

const getDayCutoffLabel = (
  dayIndex: number,
  cutoff: PortalSubscriptionCutoff,
) => {
  const dayCutoff = getDeliveryDayCutoff(cutoff, dayIndex);
  const cutoffLabel = formatCutoffDate(
    dayCutoff?.cutoffAt,
    cutoff.timeZone,
  );
  if (!cutoffLabel) return "Cut-off unavailable";

  if (dayCutoff?.lockedForFulfilment) return "Already being fulfilled · edits apply to the following delivery";
  const isPastCutoff = isPastCutoffInstant(
    dayCutoff?.cutoffAt,
    dayCutoff?.isPastCutoff ?? cutoff.isPastCutoff,
  );

  return `${isPastCutoff ? "Locked after" : "Editable until"} ${cutoffLabel} at ${cutoff.cutoffTime}`;
};

const isDayPastOwnCutoff = (
  dayIndex: number,
  cutoff: PortalSubscriptionCutoff,
) => {
  const dayCutoff = getDeliveryDayCutoff(cutoff, dayIndex);
  return Boolean(dayCutoff?.lockedForFulfilment) || isPastCutoffInstant(
    dayCutoff?.cutoffAt,
    dayCutoff?.isPastCutoff ?? cutoff.isPastCutoff,
  );
};

// The server provides the authoritative effective date in the business timezone.
// Never reconstruct it from the browser's local calendar.
const getDayScheduledFromLabel = (
  dayIndex: number,
  cutoff?: PortalSubscriptionCutoff | null,
) => {
  if (!cutoff) return "-";
  const effectiveFrom = getDeliveryDayCutoff(cutoff, dayIndex)?.effectiveFrom;
  return formatCutoffDate(effectiveFrom, cutoff.timeZone) || "-";
};

const getAddressId = (address?: { _id?: string; id?: string } | null) =>
  address?._id || address?.id || "";

const addressMatchesSubscription = (
  address: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  },
  deliveryAddress?: PortalSubscription["deliveryAddress"] | null,
) => {
  if (!deliveryAddress) return false;

  return (
    String(address.line1 || "").trim() ===
      String(deliveryAddress.line1 || "").trim() &&
    String(address.line2 || "").trim() ===
      String(deliveryAddress.line2 || "").trim() &&
    String(address.city || "").trim() ===
      String(deliveryAddress.city || "").trim() &&
    String(address.postcode || "").trim() ===
      String(deliveryAddress.postcode || "").trim() &&
    String(address.country || "").trim() ===
      String(deliveryAddress.country || "").trim()
  );
};

const SubscriptionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { customer, refreshCustomer } = usePortalCustomer();
  const currentId = useRef(id);
  const loadGeneration = useRef(0);
  currentId.current = id;
  const {
    addresses,
    fetchAddresses,
    loading: addressesLoading,
  } = useAddresses();
  const [subscription, setSubscription] = useState<PortalSubscription | null>(
    null,
  );
  const [refundRecovery, setRefundRecovery] = useState<SubscriptionRefundRecovery | null>(null);
  const [deliveries, setDeliveries] = useState<PortalSubscriptionDelivery[]>(
    [],
  );
  const deliveryPage = useRef(0);
  const [deliveryPages, setDeliveryPages] = useState({ page: 1, totalPages: 1 });
  const [deliveryPageLoading, setDeliveryPageLoading] = useState(false);
  const canModify = canModifySubscription(subscription);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockConsent, setStockConsent] = useState(false);
  const [notice, setNotice] = useState<string | null>(() => typeof location.state?.subscriptionNotice === "string" ? location.state.subscriptionNotice : null);
  const [pauseResumeOn, setPauseResumeOn] = useState("");
  const [pauseRefundMethod, setPauseRefundMethod] =
    useState<SubscriptionRefundMethod>("refund");
  const [pauseError, setPauseError] = useState<string | null>(null);
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(
    null,
  );

  const [deliveryEditorOpen, setDeliveryEditorOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [removeProductId, setRemoveProductId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState("weekly");
  const [deliveryDays, setDeliveryDays] = useState<string[]>(["Tuesday"]);
  const [cutoff, setCutoff] = useState<PortalSubscriptionCutoff | null>(null);
  const isProductDeliveryLocked = Boolean(cutoff?.isPastCutoff || (!((subscription?.preferredDeliveryDays?.length || 0) > 1) && cutoff?.deliveryDayCutoffs?.some(day => day.lockedForFulfilment)));
  const [refundChoiceOpen, setRefundChoiceOpen] = useState(false);
  const [cancelRefundChoiceOpen, setCancelRefundChoiceOpen] = useState(false);
  const [pendingDeliveryDetailsSave, setPendingDeliveryDetailsSave] = useState<{
    preferredDeliveryDay: number;
    preferredDeliveryDays: number[];
    deliveryDayPlans?: Array<{
      day: number;
      items: Array<{ variantId: string; quantity: number }>;
    }>;
    deliveryAddressId: string;
  } | null>(null);
  const [productDraft, setProductDraft] = useState<EditableSubscriptionItem[]>(
    [],
  );
  const [dayProductDraft, setDayProductDraft] = useState<
    Record<string, EditableSubscriptionItem[]>
  >({});
  const [changedMultiDayIndexes, setChangedMultiDayIndexes] = useState<
    number[]
  >([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  // Measure the sticky site header so the actions sidebar sits below it
  // instead of sliding underneath the navbar.
  const [siteHeaderHeight, setSiteHeaderHeight] = useState(0);
  useEffect(() => {
    const headerEl = document.querySelector("header");
    if (!headerEl) return;
    const update = () =>
      setSiteHeaderHeight(headerEl.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(headerEl);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  const stickyTopOffset = siteHeaderHeight + 16;
  const pauseMinDate = useMemo(() => {
    const value = new Date();
    value.setDate(value.getDate() + 1);
    return formatInputDate(value);
  }, []);
  const pauseMaxDate = useMemo(() => {
    const value = new Date();
    value.setDate(value.getDate() + 28);
    return formatInputDate(value);
  }, []);

  useEffect(() => {
    if (frequency === "weekly") return;
    setDeliveryDays((prev) => (prev.length > 1 ? [prev[0]] : prev));
  }, [frequency]);

  useEffect(() => {
    if (frequency !== "weekly" || deliveryDays.length <= 1) return;

    setDayProductDraft((prev) => {
      const next: Record<string, EditableSubscriptionItem[]> = {};
      for (const day of deliveryDays) {
        const existing = prev[day];
        next[day] = (existing?.length ? existing : productDraft).map(
          cloneEditableItem,
        );
      }
      return next;
    });
  }, [deliveryDays, frequency, productDraft]);

  const load = async (background = false, requestedPage = deliveryPage.current) => {
    if (!id) return;
    const serial = ++loadGeneration.current;

    try {
      if (!background) { setLoading(true); setError(null); }
      setDeliveryPageLoading(true);

      const [subRes, delRes] = await Promise.all([
        portalSubscriptionsApi.get(id),
        portalSubscriptionsApi.listDeliveries(id, { page: 1, pageSize: 10 }),
      ]);

      const sub = (subRes as any)?.data?.subscription as PortalSubscription;
      const nextCutoff =
        ((subRes as any)?.data?.cutoff as PortalSubscriptionCutoff) || null;
      const firstDeliveries =
        ((delRes as any)?.data?.deliveries as PortalSubscriptionDelivery[]) ||
        [];
      if (currentId.current !== id || serial !== loadGeneration.current) return;
      const firstPage: SubscriptionDeliveryPage = { deliveries: firstDeliveries,
        meta: delRes.data?.meta || { page: 1, pageSize: 10, total: firstDeliveries.length } };
      const chosen = await selectSubscriptionDeliveryPage(firstPage, sub?.upcomingDeliveryDate || sub?.nextDeliveryDate,
        async page => {
          const response = await portalSubscriptionsApi.listDeliveries(id, { page, pageSize: 10 });
          if (!response.success || !response.data) throw new Error("Unable to load delivery history.");
          return response.data;
        }, requestedPage);

      if (currentId.current !== id || serial !== loadGeneration.current) return;

      setSubscription(sub || null);
      setRefundRecovery(((subRes as any)?.data?.refundRecovery as SubscriptionRefundRecovery) || null);
      setCutoff(nextCutoff);
      setDeliveries(chosen.deliveries);
      deliveryPage.current = chosen.meta.page;
      setDeliveryPages({ page: chosen.meta.page, totalPages: Math.max(1, Math.ceil(chosen.meta.total / chosen.meta.pageSize)) });

      if (sub && !background) {
        setFrequency(sub.frequency);
        const subDays = normalizeDayIndexes(
          Array.isArray(sub.preferredDeliveryDays) &&
            sub.preferredDeliveryDays.length > 0
            ? sub.preferredDeliveryDays
            : [sub.preferredDeliveryDay],
        );
        const selectedDayNames = subDays.map((day) => toDayName(day));
        setDeliveryDays(selectedDayNames);

        const nextProductDraft = buildEditableItems(
          sub,
          Boolean(nextCutoff?.isPastCutoff || nextCutoff?.deliveryDayCutoffs?.some(day => day.lockedForFulfilment)),
        );
        setProductDraft(nextProductDraft);
        setChangedMultiDayIndexes([]);
        setDayProductDraft(
          buildEditableDayPlans(
            sub,
            Boolean(nextCutoff?.isPastCutoff || nextCutoff?.deliveryDayCutoffs?.some(day => day.lockedForFulfilment)),
            selectedDayNames,
          ),
        );
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to load subscription details.";
      if (currentId.current !== id || serial !== loadGeneration.current) return;
      if (!background) { setNotice(null); setError(message); }

      if (!background) { setSubscription(null); setRefundRecovery(null); }
      else throw err;
    } finally {
      if (currentId.current === id && serial === loadGeneration.current) {
        setDeliveryPageLoading(false);
        if (!background) setLoading(false);
      }
    }
  };

  useEffect(() => {
    deliveryPage.current = 0;
    void load();
  }, [id]);

  useEffect(() => {
    void fetchAddresses();
  }, [fetchAddresses]);

  const subscriptionAddressKey = JSON.stringify(subscription?.pendingChanges?.deliveryAddress || subscription?.deliveryAddress || null);
  useEffect(() => {
    const effectiveDeliveryAddress = JSON.parse(subscriptionAddressKey) as PortalSubscription["deliveryAddress"] | null;
    if (!effectiveDeliveryAddress || addresses.length === 0) return;

    const matchingAddress = addresses.find((address) =>
      addressMatchesSubscription(address, effectiveDeliveryAddress),
    );
    const fallbackAddress =
      matchingAddress ||
      addresses.find((address) => address.isDefault) ||
      addresses[0];

    setSelectedAddressId(getAddressId(fallbackAddress));
  }, [addresses, id, subscriptionAddressKey]);

  useEffect(() => {
    if (!pauseOpen) {
      setPauseError(null);
      return;
    }

    const defaultResumeOn = new Date();
    defaultResumeOn.setDate(defaultResumeOn.getDate() + 7);
    const maxResumeOn = new Date();
    maxResumeOn.setDate(maxResumeOn.getDate() + 28);
    setPauseResumeOn(
      formatInputDate(
        defaultResumeOn > maxResumeOn ? maxResumeOn : defaultResumeOn,
      ),
    );
  }, [pauseOpen]);

  const updateQty = (localId: string, quantity: number) => {
    setProductDraft((prev) =>
      prev.map((item) =>
        item.localId === localId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item,
      ),
    );
  };

  const updateDayQty = (day: string, localId: string, quantity: number) => {
    setChangedMultiDayIndexes((prev) => {
      const dayIndex = dayNameToIndex(day);
      return prev.includes(dayIndex) ? prev : [...prev, dayIndex];
    });
    setDayProductDraft((prev) => {
      const dayItems = prev[day] || [];
      return {
        ...prev,
        [day]: dayItems.map((item) =>
          item.localId === localId
            ? { ...item, quantity: Math.max(0, quantity) }
            : item,
        ),
      };
    });
  };

  const toggleDayItemIncluded = (day: string, localId: string) => {
    setChangedMultiDayIndexes((prev) => {
      const dayIndex = dayNameToIndex(day);
      return prev.includes(dayIndex) ? prev : [...prev, dayIndex];
    });
    setDayProductDraft((prev) => {
      const dayItems = prev[day] || [];
      return {
        ...prev,
        [day]: dayItems.map((item) => {
          if (item.localId !== localId) return item;
          return {
            ...item,
            quantity: item.quantity > 0 ? 0 : Math.max(1, item.quantity || 1),
          };
        }),
      };
    });
  };

  const selectedDayIndexes = useMemo(
    () => normalizeDayIndexes(deliveryDays.map(dayNameToIndex)),
    [deliveryDays],
  );
  const isMultiDayWeekly =
    frequency === "weekly" && selectedDayIndexes.length > 1;

  const mergedDayDraft = useMemo(() => {
    if (!isMultiDayWeekly) return [] as EditableSubscriptionItem[];

    const mergedByVariant = new Map<string, EditableSubscriptionItem>();
    for (const day of deliveryDays) {
      for (const item of dayProductDraft[day] || []) {
        const qty = Number(item.quantity || 0);
        const key = item.variantId || item.existingItemId || item.localId;
        const existing = mergedByVariant.get(key);
        if (existing) {
          existing.quantity += Math.max(0, qty);
        } else {
          mergedByVariant.set(key, {
            ...item,
            quantity: Math.max(0, qty),
          });
        }
      }
    }

    return Array.from(mergedByVariant.values()).filter(
      (item) => item.quantity > 0,
    );
  }, [dayProductDraft, deliveryDays, isMultiDayWeekly]);

  const effectiveProductDraft = isMultiDayWeekly
    ? mergedDayDraft
    : productDraft;

  const total = useMemo(() => {
    if (!effectiveProductDraft.length) return 0;
    return effectiveProductDraft.reduce(
      (sum, item) =>
        sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
      0,
    );
  }, [effectiveProductDraft]);
  const hasEmptyProductDraft = isMultiDayWeekly
    ? deliveryDays.some(day => !(dayProductDraft[day] || []).some(item => Number(item.quantity) > 0))
    : !productDraft.some(item => Number(item.quantity) > 0);

  const perDayPricing = useMemo(() => {
    if (!isMultiDayWeekly)
      return [] as Array<{
        dayName: string;
        itemsTotal: number;
        deliveryFee: number;
        totalWithFee: number;
        includedCount: number;
        totalQty: number;
      }>;

    return deliveryDays.map((dayName) => {
      const dayItems = dayProductDraft[dayName] || [];
      const includedItems = dayItems.filter(
        (item) => Number(item.quantity || 0) > 0,
      );
      const itemsTotal = includedItems.reduce(
        (sum, item) =>
          sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0,
      );
      const totalQty = includedItems.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0,
      );
      const deliveryFee = includedItems.length ? SUBSCRIPTION_DELIVERY_FEE : 0;

      return {
        dayName,
        itemsTotal,
        deliveryFee,
        totalWithFee: itemsTotal + deliveryFee,
        includedCount: includedItems.length,
        totalQty,
      };
    });
  }, [dayProductDraft, deliveryDays, isMultiDayWeekly]);

  const perDayPricingByDay = useMemo(
    () => new Map(perDayPricing.map((entry) => [entry.dayName, entry])),
    [perDayPricing],
  );

  const deliveryFeeTotal = useMemo(
    () => deliveryFeesForDraft(isMultiDayWeekly
      ? perDayPricing.map(day => day.itemsTotal) : [total], SUBSCRIPTION_DELIVERY_FEE),
    [isMultiDayWeekly, perDayPricing, total],
  );

  const totalWithDeliveryFee = useMemo(
    () => total + deliveryFeeTotal,
    [total, deliveryFeeTotal],
  );

  const nextDelivery = getNextSubscriptionDelivery(subscription, deliveries);
  const nextDeliveryAddOnTotal = nextDelivery
    ? getDeliveryAddOnTotal(nextDelivery)
    : 0;
  const nextDeliveryAddOnItems = nextDelivery
    ? getDeliveryAddOnItems(nextDelivery)
    : [];
  const nextDeliveryTotal =
    nextDelivery && subscription
      ? getTotalForDelivery(nextDelivery, subscription)
      : 0;

  const editableBaseline = useMemo(() => {
    if (!subscription) return [];
    return buildEditableItems(subscription, isProductDeliveryLocked);
  }, [subscription, cutoff]);

  const dayPlanBaseline = useMemo(() => {
    if (!subscription) return {} as Record<string, EditableSubscriptionItem[]>;
    return buildEditableDayPlans(
      subscription,
      isProductDeliveryLocked,
      deliveryDays,
    );
  }, [subscription, cutoff, deliveryDays]);

  const liveDayPlanBaseline = useMemo(() => {
    if (!subscription) return {} as Record<string, EditableSubscriptionItem[]>;
    return buildEditableDayPlans(subscription, false, deliveryDays);
  }, [subscription, deliveryDays]);

  const hasScheduledMultiDayPlanChanges = Boolean(
    isMultiDayWeekly &&
    cutoff?.isPastCutoff &&
    subscription?.pendingChanges?.deliveryDayPlans?.length,
  );

  const scheduledRemovedDayItems = useMemo(() => {
    if (!hasScheduledMultiDayPlanChanges) {
      return {} as Record<string, EditableSubscriptionItem[]>;
    }

    return deliveryDays.reduce<Record<string, EditableSubscriptionItem[]>>(
      (acc, dayName) => {
        const dayIndex = dayNameToIndex(dayName);
        // Only locked days carry staged changes; open days settle immediately.
        if (!cutoff || !isDayPastOwnCutoff(dayIndex, cutoff)) {
          acc[dayName] = [];
          return acc;
        }

        const pendingKeys = new Set(
          (dayPlanBaseline[dayName] || [])
            .filter((item) => Number(item.quantity || 0) > 0)
            .map(getDayPlanItemKey),
        );

        acc[dayName] = (liveDayPlanBaseline[dayName] || []).filter(
          (item) =>
            Number(item.quantity || 0) > 0 &&
            !pendingKeys.has(getDayPlanItemKey(item)),
        );

        return acc;
      },
      {},
    );
  }, [
    cutoff,
    dayPlanBaseline,
    deliveryDays,
    hasScheduledMultiDayPlanChanges,
    liveDayPlanBaseline,
  ]);

  const getScheduledMultiDayItemChange = (
    dayName: string,
    item: EditableSubscriptionItem,
  ) => {
    if (!hasScheduledMultiDayPlanChanges || !cutoff) return null;

    const dayIndex = dayNameToIndex(dayName);
    // Open days (before their own cut-off) apply immediately — no staged text.
    if (!isDayPastOwnCutoff(dayIndex, cutoff)) return null;

    const scheduledFromLabel = getDayScheduledFromLabel(dayIndex, cutoff);

    const liveItem = (liveDayPlanBaseline[dayName] || []).find(
      (candidate) => getDayPlanItemKey(candidate) === getDayPlanItemKey(item),
    );

    if (!liveItem) {
      return `Scheduled from ${scheduledFromLabel}: ${item.quantity} per delivery`;
    }

    const liveQuantity = Number(liveItem.quantity || 0);
    const pendingQuantity = Number(item.quantity || 0);

    if (liveQuantity === pendingQuantity) return null;

    return `Scheduled quantity ${
      pendingQuantity < liveQuantity ? "decrease" : "increase"
    } from ${scheduledFromLabel}: ${liveQuantity} to ${pendingQuantity}`;
  };

  const buildComparableDayPlans = (
    source: Record<string, EditableSubscriptionItem[]>,
  ) =>
    JSON.stringify(
      deliveryDays
        .map((day) => ({
          day: dayNameToIndex(day),
          items: (source[day] || [])
            .filter((item) => Number(item.quantity || 0) > 0)
            .map((item) => ({
              variantId: item.variantId,
              quantity: Number(item.quantity || 0),
            }))
            .sort((a, b) => a.variantId.localeCompare(b.variantId)),
        }))
        .sort((a, b) => a.day - b.day),
    );

  const getChangedMultiDayIndexes = (
    nextSource: Record<string, EditableSubscriptionItem[]>,
    baselineSource: Record<string, EditableSubscriptionItem[]>,
  ) =>
    deliveryDays
      .filter(
        (day) =>
          JSON.stringify(
            (nextSource[day] || [])
              .filter((item) => Number(item.quantity || 0) > 0)
              .map((item) => ({
                variantId: item.variantId,
                quantity: Number(item.quantity || 0),
              }))
              .sort((a, b) => a.variantId.localeCompare(b.variantId)),
          ) !==
          JSON.stringify(
            (baselineSource[day] || [])
              .filter((item) => Number(item.quantity || 0) > 0)
              .map((item) => ({
                variantId: item.variantId,
                quantity: Number(item.quantity || 0),
              }))
              .sort((a, b) => a.variantId.localeCompare(b.variantId)),
          ),
      )
      .map(dayNameToIndex);

  const calculateDayPlanTotal = (
    source: Record<string, EditableSubscriptionItem[]>,
  ) =>
    deliveryDays.reduce((sum, dayName) => {
      const dayItems = source[dayName] || [];
      return (
        sum +
        dayItems.reduce(
          (daySum, item) =>
            daySum +
            Math.max(0, Number(item.quantity || 0)) *
              Number(item.unitPrice || 0),
          0,
        )
      );
    }, 0);

  const originalTotal = useMemo(() => {
    if (!subscription) return 0;
    return subscription.items.reduce(
      (sum, item) =>
        sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
      0,
    );
  }, [subscription]);

  const previewOriginalTotal = isMultiDayWeekly
    ? calculateDayPlanTotal(dayPlanBaseline)
    : editableBaseline.reduce(
        (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0,
      );
  const previewDelta = total - previewOriginalTotal;
  const changedPreviewDays = isMultiDayWeekly
    ? deliveryDays.filter((day) =>
        getChangedMultiDayIndexes(dayProductDraft, dayPlanBaseline).includes(dayNameToIndex(day)),
      )
    : [toDayName(subscription?.preferredDeliveryDay ?? 0)];

  const hasScheduledProductChanges = Boolean(
    isProductDeliveryLocked &&
    (subscription?.pendingChanges?.items?.length ||
      subscription?.pendingChanges?.deliveryDayPlans?.length),
  );

  const hasUnsavedProductChanges = useMemo(() => {
    if (!subscription) return false;

    if (isMultiDayWeekly) {
      return (
        buildComparableDayPlans(dayProductDraft) !==
        buildComparableDayPlans(dayPlanBaseline)
      );
    }

    if (productDraft.length !== editableBaseline.length) return true;

    const byId = new Map(
      editableBaseline.map((item) => [getDraftIdentityKey(item), item]),
    );
    for (const draftItem of productDraft) {
      const original = byId.get(getDraftIdentityKey(draftItem));
      if (!original) return true;
      if (Number(original.quantity || 0) !== Number(draftItem.quantity || 0)) {
        return true;
      }
    }
    return false;
  }, [
    dayPlanBaseline,
    dayProductDraft,
    editableBaseline,
    isMultiDayWeekly,
    productDraft,
    subscription,
  ]);

  const liveItemsByKey = useMemo(
    () =>
      new Map(
        (subscription?.items || []).map((item) => [
          getItemMatchKey(item),
          item,
        ]),
      ),
    [subscription],
  );

  const pendingItemsByKey = useMemo(
    () =>
      new Map(
        (subscription?.pendingChanges?.items || []).map((item) => [
          getItemMatchKey(item),
          item,
        ]),
      ),
    [subscription],
  );

  const scheduledRemovedItems = useMemo(() => {
    if (isMultiDayWeekly) return [] as PortalSubscriptionItem[];
    if (!isProductDeliveryLocked || !subscription?.pendingChanges?.items?.length) {
      return [] as PortalSubscriptionItem[];
    }

    return subscription.items.filter(
      (item) => !pendingItemsByKey.has(getItemMatchKey(item)),
    );
  }, [cutoff, isMultiDayWeekly, pendingItemsByKey, subscription]);

  const handleSaveDeliveryDetails = async () => {
    if (!id || !selectedAddressId || !canModify) return;

    const buildDeliveryDayPlansPayload = () => {
      const wasMultiDayWeekly = subscription?.frequency === "weekly" &&
        (subscription.preferredDeliveryDays?.length || 0) > 1;
      if (!isMultiDayWeekly && !wasMultiDayWeekly) return undefined;

      return deliveryDays.map((dayName) => {
        const dayItems = (dayProductDraft[dayName] || [])
          .filter((item) => Number(item.quantity || 0) > 0)
          .map((item) => ({
            variantId: item.variantId,
            quantity: Number(item.quantity || 0),
          }));

        if (dayItems.length === 0) {
          throw new Error(
            `Please keep at least one product in ${dayName} delivery order.`,
          );
        }

        return {
          day: dayNameToIndex(dayName),
          items: dayItems,
        };
      });
    };

    const selectedDays = normalizeDayIndexes(deliveryDays.map(dayNameToIndex));
    const previousDays = normalizeDayIndexes(
      Array.isArray(subscription?.preferredDeliveryDays) &&
        subscription.preferredDeliveryDays.length > 0
        ? subscription.preferredDeliveryDays
        : [subscription?.preferredDeliveryDay ?? 2],
    );
    const removedDays = previousDays.filter(
      (day) => !selectedDays.includes(day),
    );

    // Only trigger refund if reducing the number of delivery days
    // (e.g., multi-day → fewer days). Don't refund for simple day changes
    // (e.g., Wednesday → Sunday when both are single-day subscriptions)
    const isReducingDays = selectedDays.length < previousDays.length;

    const payload = {
      preferredDeliveryDay: dayNameToIndex(deliveryDays[0] || "Tuesday"),
      preferredDeliveryDays: selectedDays,
      deliveryDayPlans: buildDeliveryDayPlansPayload(),
      deliveryAddressId: selectedAddressId,
      // Only include changed days for refund if reducing the delivery schedule
      ...(isReducingDays &&
        removedDays.length > 0 && { changedDeliveryDays: removedDays }),
    };

    // Only ask for refund method if reducing delivery days
    const shouldAskRefundMethod =
      isReducingDays &&
      removedDays.length > 0 &&
      (!cutoff ||
        removedDays.some((day) => !isDayPastOwnCutoff(day, cutoff as any)));

    if (shouldAskRefundMethod) {
      setPendingDeliveryDetailsSave(payload);
      setRefundChoiceOpen(true);
      return;
    }

    const submitDeliveryDetails = async (
      refundMethod?: SubscriptionRefundMethod,
    ) => {
      setSaving(true);
      setError(null); setNotice(null);
      setNotice(null);
      await portalSubscriptionsApi.update(id, {
        ...payload,
        ...(refundMethod ? { refundMethod } : {}),
        expectedVersion: subscription.customerVersion,
      });
      await load();
      setNotice("Delivery details updated.");

    };

    try {
      await submitDeliveryDetails();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to update delivery details.";
      setNotice(null); setError(message);

    } finally {
      setSaving(false);
    }
  };

  const handleSaveDeliveryDetailsWithRefundMethod = async (
    refundMethod: SubscriptionRefundMethod,
  ) => {
    if (!id || !pendingDeliveryDetailsSave) return;

    try {
      setSaving(true);
      setError(null); setNotice(null);
      setNotice(null);
      await portalSubscriptionsApi.update(id, {
        ...pendingDeliveryDetailsSave,
        refundMethod,
        expectedVersion: subscription.customerVersion,
      });
      await load();
      setNotice("Delivery details updated.");

    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to update delivery details.";
      setNotice(null); setError(message);

    } finally {
      setSaving(false);
      setPendingDeliveryDetailsSave(null);
    }
  };

  const handlePause = async () => {
    if (!id) return;
    if (!pauseResumeOn || pauseResumeOn < pauseMinDate || pauseResumeOn > pauseMaxDate) {
      setPauseError(`Choose a resume date from ${formatDate(pauseMinDate)} to ${formatDate(pauseMaxDate)}.`);
      return;
    }
    setSaving(true);
    try {
      setError(null); setNotice(null);
      setNotice(null);
      setPauseError(null);
      const res = await portalSubscriptionsApi.pause(
        id,
        pauseResumeOn,
        subscription.customerVersion,
        pauseRefundMethod,
      );
      await load();
      setPauseOpen(false);
      const message = (res as any)?.message || "Subscription paused.";
      setError(null); setNotice(message);

    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to pause subscription.";
      setNotice(null); setError(message);

    } finally {
      setSaving(false);
    }
  };

  const handleRetryPauseRefund = async () => {
    if (!id || !refundRecovery?.retryAvailable || !refundRecovery.operationId || !refundRecovery.resumeOn) return;
    setSaving(true);
    setError(null);
    try {
      const response = await portalSubscriptionsApi.pause(id, refundRecovery.resumeOn,
        refundRecovery.expectedVersion ?? subscription.customerVersion, "refund", refundRecovery.operationId);
      await load();
      setNotice((response as any)?.message || "Card refund completed and subscription paused.");
    } catch (err) {
      await load();
      setError(err instanceof ApiError ? err.message : "Card refund recovery could not be completed. Please try again or contact support.");
    } finally {
      setSaving(false);
    }
  };

  const handleResume = async () => {
    if (!id) return;
    setSaving(true);
    setError(null); setNotice(null);
    try {
      const res = await portalSubscriptionsApi.resume(
        id,
        subscription.customerVersion,
      );
      await load();
      const message = (res as any)?.message || "Subscription resumed.";
      setError(null); setNotice(message);

    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to resume subscription. Please try again.";
      setNotice(null); setError(message);

    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (refundMethod: SubscriptionRefundMethod) => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await portalSubscriptionsApi.cancel(id, {
        refundMethod,
        expectedVersion: subscription.customerVersion,
      });
      await load();
      setCancelOpen(false);
      setCancelRefundChoiceOpen(false);
      const message = (res as any)?.message || "Subscription cancelled.";
      setNotice(message);

    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to cancel subscription.";
      setNotice(null); setError(message);

    } finally {
      setSaving(false);
    }
  };

  const handleCancelAttempt = async () => {
    if (!id) return;

    const nextOrderProtected = nextDelivery?.order &&
      !["ordered", "cancelled"].includes(String(nextDelivery.order.deliveryStatus));
    const shouldAskRefundMethod = hasAnyRefundEligibleDeliveryOnCancel ||
      (!isMultiDayWeekly && Boolean(cutoff && !cutoff.isPastCutoff) && !nextOrderProtected);

    if (shouldAskRefundMethod) {
      setCancelOpen(false);
      setCancelRefundChoiceOpen(true);
      return;
    }

    await handleCancel("refund");
  };

  const handleRemoveItem = async () => {
    if (!removeProductId) return;
    setProductDraft((prev) =>
      prev.filter((item) => item.localId !== removeProductId),
    );
    setRemoveProductId(null);
  };

  const handleSaveProductChanges = async () => {
    if (!canModify) return;
    if (!id || !subscription || !hasUnsavedProductChanges) return;
    if (hasEmptyProductDraft) {
      setError("Keep at least one product on every delivery day, or cancel the subscription.");
      return;
    }

    if (isMultiDayWeekly) {
      const hasPaidDecrease = getChangedMultiDayIndexes(dayProductDraft, dayPlanBaseline).some(day => {
        const dayName = toDayName(day);
        const sum = (items: EditableSubscriptionItem[]) => items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
        const dayCutoff = cutoff ? getDeliveryDayCutoff(cutoff, day) : undefined;
        return needsItemRefundChoice(dayCutoff?.paymentState, cutoff ? isDayPastOwnCutoff(day, cutoff) : true,
          sum(dayProductDraft[dayName] || []) - sum(dayPlanBaseline[dayName] || []));
      });
      if (hasPaidDecrease) {
        setRefundChoiceOpen(true);
        return;
      }

      await performSaveProductChanges("credit");
      return;
    }

    const originalById = new Map(
      subscription.items.map((item) => [item._id, item]),
    );
    const draftExistingIds = new Set(
      productDraft
        .filter((item) => Boolean(item.existingItemId))
        .map((item) => item.existingItemId as string),
    );

    const itemsToRemove = subscription.items
      .filter((item) => !draftExistingIds.has(item._id))
      .map((item) => item._id);

    const itemsToUpdate = productDraft.filter((item) => {
      if (!item.existingItemId) return false;
      const original = originalById.get(item.existingItemId);
      if (!original) return false;
      return Number(original.quantity || 0) !== Number(item.quantity || 0);
    });

    // A reduction (removing items or lowering a quantity) before the cut-off
    // settles money back to the customer, so let them pick how they get it.
    const hasDecrease =
      itemsToRemove.length > 0 ||
      itemsToUpdate.some((item) => {
        const original = originalById.get(item.existingItemId as string);
        return (
          original &&
          Number(item.quantity || 0) < Number(original.quantity || 0)
        );
      });

    const itemDay = cutoff ? getDeliveryDayCutoff(cutoff, subscription.preferredDeliveryDay) : undefined;
    if (hasDecrease && cutoff && needsItemRefundChoice(itemDay?.paymentState, isProductDeliveryLocked, -1)) {
      setRefundChoiceOpen(true);
      return;
    }

    await performSaveProductChanges("credit");
  };

  const performSaveProductChanges = async (
    refundMethod: "credit" | "refund",
  ) => {
    if (!id || !subscription || !hasUnsavedProductChanges) return;

    if (isMultiDayWeekly) {
      try {
        const deliveryDayPlans = deliveryDays.map((dayName) => {
          const items = (dayProductDraft[dayName] || [])
            .filter((item) => Number(item.quantity || 0) > 0)
            .map((item) => ({
              variantId: item.variantId,
              quantity: Number(item.quantity || 0),
            }));

          if (items.length === 0) {
            throw new Error(
              `Please keep at least one product in ${dayName} delivery order.`,
            );
          }

          return { day: dayNameToIndex(dayName), items };
        });

        setSaving(true);
        setError(null); setNotice(null);
        setNotice(null);

        const changedDays = getChangedMultiDayIndexes(dayProductDraft, dayPlanBaseline);
        const openPaidDays = changedDays.filter(day => cutoff && !isDayPastOwnCutoff(day, cutoff) &&
          getDeliveryDayCutoff(cutoff, day)?.paymentState === "paid");
        const openUnpaidDays = changedDays.filter(day => cutoff && !isDayPastOwnCutoff(day, cutoff) &&
          getDeliveryDayCutoff(cutoff, day)?.paymentState === "unpaid");
        const splitSettlement = openPaidDays.length > 0 && openUnpaidDays.length > 0;
        const results = splitSettlement ? await saveDeliveryDayItemEdits({
          baseline: deliveryDays.map(dayName => ({ day: dayNameToIndex(dayName),
            items: (dayPlanBaseline[dayName] || []).map(item => ({ variantId: item.variantId, quantity: item.quantity })) })),
          requested: deliveryDayPlans,
          changedDays,
          groups: [changedDays.filter(day => !openPaidDays.includes(day)), openPaidDays],
          expectedVersion: subscription.customerVersion,
          send: payload => portalSubscriptionsApi.update(id, { ...payload, refundMethod }),
          onApplied: response => {
            if (response.data?.subscription) setSubscription(response.data.subscription);
          },
        }) : [await portalSubscriptionsApi.update(id, {
          deliveryDayPlans, changedDeliveryDays: changedDays, refundMethod, expectedVersion: subscription.customerVersion,
        })];

        await load();
        await refreshCustomer().catch(() => {});
        const message =
          results.map(response => response.message).filter(Boolean).join(" ") ||
          (cutoff?.isPastCutoff
            ? "Product changes were scheduled for deliveries after the upcoming one."
            : "Product changes saved.");
        setError(null); setNotice(message);

      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to save product changes.";
        setNotice(null); setError(message);

      } finally {
        setSaving(false);
      }
      return;
    }

    try {
      setSaving(true);
      setError(null); setNotice(null);
      setNotice(null);

      const replacementItems = productDraft.map((item) => {
        if (!item.existingItemId) {
          throw new Error(
            "Subscription products changed while you were editing. Please reload and try again.",
          );
        }
        return {
          itemId: item.existingItemId,
          quantity: Number(item.quantity || 0),
        };
      });

      if (replacementItems.length === 0) {
        throw new Error(
          "Please keep at least one product in your subscription.",
        );
      }

      const res = await portalSubscriptionsApi.replaceItems(id, {
        items: replacementItems,
        refundMethod,
        expectedVersion: subscription.customerVersion,
      });

      await load();
      await refreshCustomer().catch(() => {});
      const message =
        (res as any)?.message ||
        (cutoff?.isPastCutoff
          ? "Product changes were scheduled for deliveries after the upcoming one."
          : "Product changes saved.");
      setError(null); setNotice(message);

    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to save product changes.";
      setNotice(null); setError(message);

    } finally {
      setSaving(false);
    }
  };

  const hasAnyRefundEligibleDeliveryOnCancel = useMemo(() => {
    if (!cutoff || !Array.isArray(deliveries) || deliveries.length === 0) {
      return false;
    }

    return deliveries
      .filter(
        (delivery) =>
          ["scheduled", "generated"].includes(String(delivery.status)) &&
          (!delivery.order || ["ordered", "cancelled"].includes(String(delivery.order.deliveryStatus))) &&
          ((delivery.order && ["paid", "partially_refunded"].includes(String(delivery.order.status || ""))) ||
            getDeliveryAddOnTotal(delivery) > 0),
      )
      .some((delivery) => {
        const deliveryDate = new Date(delivery.scheduledDate);
        if (Number.isNaN(deliveryDate.getTime())) return false;

        return !isPastCutoffInstant(
          delivery.cutoffAt,
          delivery.isPastCutoff ?? true,
        );
      });
  }, [cutoff, deliveries]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-8 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading subscription details...
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-3xl mx-auto">
        <EmptyState
          title="Subscription not found"
          description={error || undefined}
        />
      </div>
    );
  }

  const fullAddress = [
    (
      subscription.pendingChanges?.deliveryAddress ||
      subscription.deliveryAddress
    )?.line1,
    (
      subscription.pendingChanges?.deliveryAddress ||
      subscription.deliveryAddress
    )?.line2,
    (
      subscription.pendingChanges?.deliveryAddress ||
      subscription.deliveryAddress
    )?.city,
    (
      subscription.pendingChanges?.deliveryAddress ||
      subscription.deliveryAddress
    )?.postcode,
    (
      subscription.pendingChanges?.deliveryAddress ||
      subscription.deliveryAddress
    )?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const displayNextDeliveryDate = getNextSubscriptionDeliveryDate(subscription);
  const selectedSavedAddress =
    addresses.find((address) => getAddressId(address) === selectedAddressId) ||
    null;

  const isSelectedAddressCurrent = addresses.some(
    (address) =>
      getAddressId(address) === selectedAddressId &&
      addressMatchesSubscription(
        address,
        subscription.pendingChanges?.deliveryAddress ||
          subscription.deliveryAddress,
      ),
  );

  const currentDayIndexes = normalizeDayIndexes(
    Array.isArray(subscription.preferredDeliveryDays) &&
      subscription.preferredDeliveryDays.length > 0
      ? subscription.preferredDeliveryDays
      : [Number(subscription.preferredDeliveryDay)],
  );

  const isDeliveryDayCurrent =
    selectedDayIndexes.length === currentDayIndexes.length &&
    selectedDayIndexes.every((day, index) => day === currentDayIndexes[index]);

  const canSaveDeliveryDetails =
    !saving &&
    !addressesLoading &&
    canModify &&
    Boolean(selectedAddressId) &&
    (!isSelectedAddressCurrent || !isDeliveryDayCurrent);

  const selectedAddressPreview = selectedSavedAddress
    ? [
        selectedSavedAddress.line1,
        selectedSavedAddress.line2,
        selectedSavedAddress.city,
        selectedSavedAddress.postcode,
        selectedSavedAddress.country,
      ]
        .filter(Boolean)
        .join(", ")
    : fullAddress;

  const cancellationEffectiveAt = subscription.cancellationEffectiveAfter
    ? new Date(subscription.cancellationEffectiveAfter)
    : null;
  const hasValidCancellationDate = Boolean(
    cancellationEffectiveAt &&
    !Number.isNaN(cancellationEffectiveAt.getTime()),
  );
  // The backend keeps a deferred cancellation scheduled for the full protected
  // delivery day and finalizes it only afterwards. Keep the customer-facing
  // notice visible for as long as the server says cancellation is scheduled.
  const showScheduledCancellationAlert = Boolean(
    subscription.isCancellationScheduled,
  );

  const savedDayNames = currentDayIndexes.map(toDayName);
  const availableDeliveryDays = cutoff?.deliveryDays?.length
    ? cutoff.deliveryDays.map(toDayName)
    : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const savedFrequencyLabel = subscription.frequency === "every_two_weeks" ? "Every 2 weeks" : subscription.frequency === "monthly" ? "Monthly" : "Weekly";
  const setDeliveryEditorVisible = (open: boolean) => {
    if (!open) {
      setFrequency(subscription.frequency);
      setDeliveryDays(savedDayNames);
      setDayProductDraft(buildEditableDayPlans(subscription, isProductDeliveryLocked, savedDayNames));
      setChangedMultiDayIndexes([]);
    }
    setDeliveryEditorOpen(open);
  };
  const savedPlanTotal = originalTotal + SUBSCRIPTION_DELIVERY_FEE * Math.max(1, savedDayNames.length);
  const renderProduct = (item: EditableSubscriptionItem, dayName?: string) => {
    const included = !dayName || item.quantity > 0;
    const liveItem = liveItemsByKey.get(getItemMatchKey(item));
    const scheduled = dayName ? getScheduledMultiDayItemChange(dayName, item) :
      isProductDeliveryLocked && subscription.pendingChanges?.items?.length &&
      (!liveItem || liveItem.quantity !== item.quantity || liveItem.unitPrice !== item.unitPrice)
        ? `Scheduled from ${subscription.pendingChanges.effectiveFrom ? formatDate(subscription.pendingChanges.effectiveFrom) : "a following delivery"}${liveItem ? ` · ${liveItem.quantity} → ${item.quantity}` : ""}` : null;
    return <div key={`${dayName || 'single'}:${item.localId}`} data-day-plan={Boolean(dayName)} className={cn(styles.productRow, !included && styles.excluded)}>
      {item.imageUrl ? <img src={item.imageUrl} alt="" className={styles.productImage}/> : <span className={styles.productImage}><Package size={20} aria-hidden="true"/></span>}
      <div className="min-w-0"><p className="text-sm font-medium text-foreground break-words">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{formatMoney(item.unitPrice)} each{item.sku ? ` · ${item.sku}` : ''}</p>{scheduled && <p className="mt-1 text-xs text-forest">{scheduled}</p>}</div>
      <div className={styles.productControls}>
        {dayName && <Button type="button" size="sm" variant={included ? "secondary" : "outline"} aria-pressed={included} aria-label={`Include ${item.name} in ${dayName} delivery`} disabled={saving || !canModify} onClick={()=>toggleDayItemIncluded(dayName,item.localId)}>{included ? "Included" : "Excluded"}</Button>}
        <div className={styles.quantity} role="group" aria-label={`Quantity for ${item.name}${dayName ? ` on ${dayName}` : ''}`}>
          <Button type="button" size="sm" variant="ghost" className="px-2" data-tour="subscription-quantity" aria-label={`Decrease ${item.name} quantity${dayName ? ` for ${dayName}` : ''}`} disabled={saving || !canModify || !included || (!dayName && item.quantity <= 1)} onClick={()=>dayName ? updateDayQty(dayName,item.localId,item.quantity-1) : updateQty(item.localId,item.quantity-1)}><Minus size={14}/></Button>
          <span className="min-w-6 text-center text-sm font-medium tabular-nums" aria-live="polite">{item.quantity}</span>
          <Button type="button" size="sm" variant="ghost" className="px-2" aria-label={`Increase ${item.name} quantity${dayName ? ` for ${dayName}` : ''}`} disabled={saving || !canModify || !included} onClick={()=>dayName ? updateDayQty(dayName,item.localId,item.quantity+1) : updateQty(item.localId,item.quantity+1)}><Plus size={14}/></Button>
        </div>
        {!dayName && <Button type="button" size="sm" variant="ghost" className="px-2 text-muted-foreground hover:text-destructive" aria-label={`Remove ${item.name}`} disabled={saving || !canModify} onClick={()=>setRemoveProductId(item.localId)}><Trash2 size={15}/></Button>}
      </div>
    </div>;
  };

  return (
    <div data-tour-page="subscription-detail" data-tour-ready={true} className={cn(styles.page, "mx-auto w-full max-w-4xl")}>
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><Link className="hover:text-foreground" to="/portal/subscriptions">My subscriptions</Link><ChevronRight size={14} aria-hidden="true"/><span aria-current="page" className="text-foreground">Subscription details</span></nav>
      <header className={styles.pageHeader}>
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h1 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">Your subscription</h1><SubscriptionStatusBadge className="[&>span:last-child]:text-sm" status={subscription.status} isCancellationScheduled={subscription.isCancellationScheduled}/></div><p className="mt-1 break-words text-sm text-muted-foreground">{subscription.subscriptionNumber || `Subscription ${subscription._id.slice(-6)}`}</p><p className="mt-1 text-xs text-muted-foreground">Started {formatDate(subscription.startDate)}</p></div>

      </header>

      {refundRecovery && <Alert variant="destructive" role="alert" data-testid="subscription-refund-recovery" className="mb-4">
        <Info size={17}/><AlertDescription>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 flex-1">A card refund for this subscription is still unresolved. {formatMoney(refundRecovery.refundedMinor / 100)} is confirmed returned; {formatMoney(refundRecovery.remainingMinor / 100)} still needs reconciliation. The subscription has not been paused.</p>
            {refundRecovery.retryAvailable
              ? <Button type="button" size="sm" variant="outline" disabled={saving} onClick={handleRetryPauseRefund}>Retry original card refund</Button>
              : <p>Please contact support with this subscription number before trying another change.</p>}
          </div>
        </AlertDescription>
      </Alert>}

      {(error || notice || showScheduledCancellationAlert) && <div data-testid="subscription-feedback" className="mb-4">
        <Alert variant={error ? "destructive" : "default"} role={error ? "alert" : "status"} className={cn("shadow-none", !error && notice && "border-forest/20 bg-forest/5")}>
          {error ? <Info size={17}/> : <CheckCircle2 size={17}/>}
          <AlertDescription><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1">{error || notice || <>Subscription scheduled for cancellation. Your protected delivery remains scheduled; future deliveries are stopped.{hasValidCancellationDate && <> Cancellation completes after {formatDate(cancellationEffectiveAt?.toISOString())}.</>}</>}</div>{(error || notice) && <Button type="button" size="sm" variant="ghost" className="h-auto px-1 py-0 text-current" onClick={()=>{setError(null);setNotice(null);}}>Dismiss message</Button>}</div></AlertDescription>
        </Alert>
      </div>}
      {subscription.status === "paused" && <div data-tour="subscription-state" className="mb-4 flex items-start gap-2 border-l-2 border-amber-400 bg-amber-500/5 px-4 py-3 text-sm text-foreground"><Pause size={16} className="mt-0.5 shrink-0 text-amber-600"/><p>Paused{subscription.pausedUntil ? ` until ${formatDate(subscription.pausedUntil)}` : ''}. Your plan cannot be edited while paused.{subscription.pausedUntil ? ' It resumes automatically when the pause ends, or you can resume it now.' : ''}</p></div>}
      {subscription.status === "cancelled" && <p data-tour="subscription-state" className="mb-4 border-l-2 border-muted-foreground/40 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">This subscription is cancelled and cannot be changed.</p>}

      <Card className={cn(styles.hero, "mb-4 shadow-none")}>
        <CardContent data-tour="subscription-summary" className={styles.heroContent}>
          <div><p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays size={16} className="text-forest"/>{subscription.status === "paused" ? 'Next scheduled delivery' : 'Next delivery'}</p><p className="font-body text-lg font-semibold text-foreground sm:text-xl">{displayNextDeliveryDate ? formatDate(displayNextDeliveryDate) : 'None scheduled'}</p><p className="mt-2 text-sm text-muted-foreground">{savedFrequencyLabel} · {savedDayNames.join(', ')}</p></div>
          <div className={styles.heroPrice}><p className="mb-2 text-sm text-muted-foreground">{nextDelivery ? 'Next delivery total' : 'Regular plan total'}</p><p className="text-lg font-semibold tabular-nums text-foreground sm:text-xl">{formatMoney(nextDelivery ? nextDeliveryTotal : savedPlanTotal)}</p><p className="mt-2 text-xs text-muted-foreground">{nextDelivery ? 'Includes delivery' : `${savedDayNames.length > 1 ? 'Per cycle' : 'Per delivery'} · includes delivery`}{nextDeliveryAddOnTotal > 0 ? ` and ${formatMoney(nextDeliveryAddOnTotal)} one-time extras` : ''}</p></div>
        </CardContent>
        {cutoff && canModify && !error && !notice && <Collapsible className={styles.cutoff}><CollapsibleTrigger asChild><Button size="sm" variant="ghost" className={styles.cutoffTrigger}><span className="flex min-w-0 items-center gap-2"><Clock3 size={14}/><span className="truncate">{isMultiDayWeekly ? 'Delivery cutoffs' : getDeliveryDayCutoff(cutoff, subscription.preferredDeliveryDay)?.lockedForFulfilment ? 'Upcoming delivery locked' : cutoff.isPastCutoff ? 'Upcoming delivery cutoff passed' : cutoff.cutoffAt ? `Edit until ${new Date(cutoff.cutoffAt).toLocaleString('en-GB',{timeZone:cutoff.timeZone || 'Europe/London',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}` : 'Delivery cutoff'}</span></span><ChevronDown size={14} className={styles.chevron}/></Button></CollapsibleTrigger><CollapsibleContent className={styles.collapse}><div data-tour="subscription-cutoff" className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground sm:px-5">          {isMultiDayWeekly ? (
            <>
              <div className="font-medium">
                Each delivery day has its own cut-off:
              </div>
              <div className="mt-2 space-y-1.5">
                {deliveryDays.map((dayName) => (
                  <div key={dayName} className="flex items-start gap-2">
                    <span className="font-semibold shrink-0">{dayName}</span>
                    <span className="text-muted-foreground">
                      {getDayCutoffLabel(
                        dayNameToIndex(dayName),
                        cutoff,
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                Changes are applied separately for each delivery day.
              </div>
            </>
          ) : getDeliveryDayCutoff(cutoff, subscription.preferredDeliveryDay)?.lockedForFulfilment ? (
            <>Your upcoming delivery is already being fulfilled. Product changes apply to the following delivery. No payment is taken for these changes now.</>
          ) : cutoff.isPastCutoff ? (
            <>
              The cut-off for your next delivery
              {displayNextDeliveryDate
                ? ` on ${formatDate(displayNextDeliveryDate)}`
                : ""}{" "}
              has passed. You can still make changes, but they'll apply from the
              delivery after that.
            </>
          ) : (
            <>
              You can edit this subscription until{" "}
              <span className="font-semibold">
                {cutoff.cutoffAt
                  ? formatCutoffDate(cutoff.cutoffAt, cutoff.timeZone)
                  : "the cut-off"}
              </span>
              {cutoff.cutoffTime ? ` at ${cutoff.cutoffTime}` : ""}. Changes
              apply to your next delivery. {recurringItemPaymentMessage(
                getDeliveryDayCutoff(cutoff, subscription.preferredDeliveryDay)?.paymentState,
                false,
              )}
            </>
          )}</div></CollapsibleContent></Collapsible>}
      </Card>
      <div className={styles.layout}>
          <Card data-tour="subscription-products" className="shadow-none">
            <CardHeader className={styles.sectionHeader}><div className="flex items-center justify-between gap-2"><CardTitle className={styles.sectionTitle}>Products</CardTitle>{canModify && <Button size="sm" variant="outline" asChild><Link data-tour="subscription-add" to={`/portal/subscriptions/${id}/add-products`}><Plus size={14}/>Add products</Link></Button>}</div><CardDescription>{hasUnsavedProductChanges ? 'Unsaved changes — review before saving.' : hasScheduledProductChanges ? 'Includes scheduled changes.' : 'Your regular selection.'}</CardDescription></CardHeader>
            <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
              {isMultiDayWeekly ? deliveryDays.map(dayName=><section key={dayName} className={styles.dayGroup}><div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-2"><h3 className="font-body text-sm font-semibold">{dayName} delivery</h3><span className="text-xs text-muted-foreground">{formatMoney(perDayPricingByDay.get(dayName)?.totalWithFee ?? 0)} incl. delivery</span></div>{(dayProductDraft[dayName] || []).map(item=>renderProduct(item,dayName))}{(scheduledRemovedDayItems[dayName] || []).map(item=><p key={getDayPlanItemKey(item)} className="border-t border-border/60 py-3 text-sm text-muted-foreground"><span className="line-through">{item.name}</span> · removal scheduled from {getDayScheduledFromLabel(dayNameToIndex(dayName),cutoff)}</p>)}</section>) : <div>{productDraft.map(item=>renderProduct(item))}{scheduledRemovedItems.map(item=><p key={item._id} className="border-t border-border/60 py-3 text-sm text-muted-foreground"><span className="line-through">{item.name}</span> · removal scheduled from {subscription.pendingChanges?.effectiveFrom ? formatDate(subscription.pendingChanges.effectiveFrom) : 'a following delivery'}</p>)}</div>}
                          {hasUnsavedProductChanges && (
              <div className="rounded-md bg-muted/40 p-4 text-sm text-foreground leading-relaxed">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    {isMultiDayWeekly ? "Current products per cycle" : "Current products per delivery"}
                  </span>
                  <span>{formatMoney(previewOriginalTotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    {isMultiDayWeekly ? "New products per cycle" : "New products per delivery"}
                  </span>
                  <span className="font-semibold">{formatMoney(total)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1 pt-1 border-t border-forest/20">
                  <span className="text-muted-foreground">
                    {previewDelta >= 0
                      ? isMultiDayWeekly ? "Extra products per cycle" : "Extra products per delivery"
                      : isMultiDayWeekly ? "Product saving per cycle" : "Product saving per delivery"}
                  </span>
                  <span
                    className={
                      previewDelta >= 0
                        ? "font-semibold text-forest"
                        : "font-semibold text-foreground"
                    }
                  >
                    {previewDelta >= 0 ? "+" : "−"}
                    {formatMoney(Math.abs(previewDelta))}
                  </span>
                </div>
                <p className="mt-2 text-muted-foreground">Delivery fees are shown separately below. Paid and unpaid delivery days are saved separately when needed.</p>
                <ul className="mt-2 space-y-2" aria-label="Product change preview">
                  {changedPreviewDays.map((dayName) => {
                    const dayIndex = dayNameToIndex(dayName);
                    const locked = cutoff ? isDayPastOwnCutoff(dayIndex, cutoff) : null;
                    const dayCutoff = cutoff ? getDeliveryDayCutoff(cutoff, dayIndex) : null;
                    const effectiveDate = cutoff
                      ? formatCutoffDate(locked ? dayCutoff?.effectiveFrom : dayCutoff?.deliveryDate, cutoff.timeZone)
                      : null;
                    const dayDelta = isMultiDayWeekly
                      ? (dayProductDraft[dayName] || []).reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0)
                        - (dayPlanBaseline[dayName] || []).reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0)
                      : previewDelta;
                    return (
                      <li key={dayName}>
                        <strong>{dayName}</strong>{effectiveDate ? ` — from ${effectiveDate}. ` : ": Effective delivery date will be confirmed when saved. "}
                        {locked === null
                          ? "Payment and cutoff eligibility will be checked when you save."
                          : locked
                            ? "The upcoming delivery is locked. This change is scheduled for a later delivery; no payment or refund is made now."
                            : dayDelta > 0
                               ? `For an eligible prepaid delivery, the extra ${formatMoney(dayDelta)} is charged when you save. For an unpaid delivery, its invoice amount is updated without an immediate charge.`
                              : dayDelta < 0
                                 ? `For an eligible prepaid delivery, ${formatMoney(Math.abs(dayDelta))} is returned to your card or store credit using your settlement choice. For an unpaid delivery, its invoice amount is reduced without issuing a refund or credit.`
                                : "No net product price change. Payment eligibility is checked when you save; increases and decreases may need separate saves."}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

              <div className={styles.productFooter}><div className={styles.productTotal}><p className="text-sm text-muted-foreground">{hasUnsavedProductChanges ? 'Draft total' : hasScheduledProductChanges ? 'Scheduled total' : isMultiDayWeekly ? 'Cycle total' : 'Per delivery'}</p><p className="text-base font-semibold tabular-nums">{formatMoney(totalWithDeliveryFee)}</p><small>Products {formatMoney(total)} + delivery {formatMoney(deliveryFeeTotal)}</small>{hasUnsavedProductChanges && hasEmptyProductDraft && <small role="alert" className="block text-destructive">Keep at least one product on every delivery day, or cancel the subscription.</small>}</div>{hasUnsavedProductChanges && <div className="ml-auto flex flex-wrap justify-end gap-2"><Button size="sm" variant="outline" disabled={saving || !canModify} onClick={()=>{if(isMultiDayWeekly){setDayProductDraft(dayPlanBaseline);setChangedMultiDayIndexes([]);}else setProductDraft(editableBaseline);}}>Discard</Button><Button size="sm" data-tour="subscription-save-products" disabled={saving || !canModify || hasEmptyProductDraft} onClick={()=>void handleSaveProductChanges()}>{saving ? 'Saving…' : 'Save product changes'}</Button></div>}</div>
            </CardContent>
          </Card>
          <Card data-tour="subscription-delivery-settings" className="shadow-none"><CardHeader className={styles.sectionHeader}><div className="flex items-center justify-between gap-3"><CardTitle className={styles.sectionTitle}>Delivery details</CardTitle>{canModify && <Button size="sm" variant="outline" aria-expanded={deliveryEditorOpen} aria-controls="subscription-delivery-editor" onClick={()=>setDeliveryEditorVisible(!deliveryEditorOpen)}><Settings2 size={14}/>{deliveryEditorOpen ? 'Close' : 'Edit'}</Button>}</div></CardHeader><CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">{!deliveryEditorOpen && <dl className={styles.deliveryFacts}><div><dt><MapPin size={15}/>Delivering to</dt><dd>{fullAddress || 'No delivery address configured.'}</dd></div><div><dt><CalendarDays size={15}/>Schedule</dt><dd>{savedDayNames.join(', ')} · {savedFrequencyLabel}</dd></div>{(subscription.pendingChanges?.deliveryAddress || subscription.deliveryAddress)?.deliveryInstructions && <div><dt>Delivery instructions</dt><dd>{(subscription.pendingChanges?.deliveryAddress || subscription.deliveryAddress).deliveryInstructions}</dd></div>}</dl>}{subscription.pendingChanges?.deliveryAddress && <p className="mt-3 text-xs text-forest">Address change scheduled{subscription.pendingChanges.effectiveFrom ? ` from ${formatDate(subscription.pendingChanges.effectiveFrom)}` : ''}.</p>}<Collapsible open={deliveryEditorOpen} onOpenChange={setDeliveryEditorVisible}><CollapsibleContent id="subscription-delivery-editor" className={styles.collapse}><div className="pt-1">            <div className="grid gap-6">
              <div>
                <h3 className="font-body font-medium text-foreground mb-2 flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-forest" />
                  Delivery Address
                </h3>
                {addresses.length > 0 ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        Saved addresses
                      </p>
                      <Select
                        value={selectedAddressId}
                        onValueChange={setSelectedAddressId}
                        disabled={!canModify}
                      >
                        <SelectTrigger className="h-9" data-tour="subscription-address">
                          <SelectValue placeholder="Select an address" />
                        </SelectTrigger>
                        <SelectContent>
                          {addresses.map((address) => {
                            const addressId = getAddressId(address);
                            const addressLabel = [
                              address.label || address.fullName,
                              address.line1,
                              address.city,
                              address.postcode,
                            ]
                              .filter(Boolean)
                              .join(" - ");

                            return (
                              <SelectItem key={addressId} value={addressId}>
                                {addressLabel}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Subscription delivery address
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {selectedAddressPreview ||
                          "No delivery address configured."}
                      </p>
                    </div>
                    {canModify ? (
                      <Button className="ml-auto flex w-fit" variant="outline" size="sm" asChild>
                      <Link to="/portal/addresses">Manage addresses</Link>
                    </Button>
                    ) : (
                      <Button className="ml-auto flex w-fit" variant="outline" size="sm" disabled>Manage addresses</Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-foreground leading-relaxed">
                      {fullAddress || "No delivery address configured."}
                    </p>
                    {canModify ? (
                      <Button className="ml-auto flex w-fit" variant="outline" size="sm" asChild>
                      <Link to="/portal/addresses">Add address</Link>
                    </Button>
                    ) : (
                      <Button className="ml-auto flex w-fit" variant="outline" size="sm" disabled>Add address</Button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-body font-medium text-foreground mb-2 flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-forest" />
                  Delivery Schedule
                </h3>
                <fieldset className={styles.dayFieldset} disabled={!canModify || saving}>
                  <legend className="text-xs font-medium text-muted-foreground">
                    {frequency === "weekly" ? "Delivery days" : "Delivery day"}
                  </legend>
                  <p id="delivery-days-help" className="mb-3 mt-1 text-sm text-muted-foreground">
                    {frequency === "weekly" ? "Select one or more days for your deliveries." : "Select a day for your deliveries."}
                  </p>
                  {frequency === "weekly" ? (
                    <div data-tour="subscription-days" className={styles.dayOptions} aria-describedby="delivery-days-help">
                      {availableDeliveryDays.map(day => (
                        <label key={day} htmlFor={`delivery-day-${day}`} className={styles.dayOption} data-selected={deliveryDays.includes(day)} data-disabled={!canModify || saving}>
                          <Checkbox
                            id={`delivery-day-${day}`}
                            checked={deliveryDays.includes(day)}
                            disabled={!canModify || saving}
                            onCheckedChange={checked => setDeliveryDays(prev => checked === true
                              ? prev.includes(day) ? prev : [...prev, day]
                              : prev.length > 1 ? prev.filter(selected => selected !== day) : prev)}
                          />
                          <span>{day}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <RadioGroup data-tour="subscription-days" className={styles.dayOptions} value={deliveryDays[0]} onValueChange={day => setDeliveryDays([day])} disabled={!canModify || saving} aria-label="Delivery day" aria-describedby="delivery-days-help">
                      {availableDeliveryDays.map(day => (
                        <label key={day} htmlFor={`delivery-day-${day}`} className={styles.dayOption} data-selected={deliveryDays.includes(day)} data-disabled={!canModify || saving}>
                          <RadioGroupItem id={`delivery-day-${day}`} value={day} />
                          <span>{day}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  )}
                </fieldset>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center justify-end gap-2">
              <Button
                size="sm"
                data-tour="subscription-save-delivery" onClick={() => void handleSaveDeliveryDetails()}
                disabled={!canSaveDeliveryDetails}
              >
                {saving ? "Saving..." : "Save delivery details"}
              </Button>
            </div></div></CollapsibleContent></Collapsible></CardContent></Card>
          <Card data-tour="subscription-upcoming" className="shadow-none">
            <CardHeader className={styles.sectionHeader}><div className="flex items-center justify-between gap-2"><CardTitle className={styles.sectionTitle}>Deliveries</CardTitle>{canModify && deliveries.length>0 && <Button size="sm" variant="outline" asChild><Link data-tour="subscription-add-on" to={`/portal/subscriptions/${id}/next-delivery/add-ons`}><ShoppingBag size={14}/>Add extras</Link></Button>}</div><CardDescription>Expand a delivery for its details and actions.</CardDescription></CardHeader>
            <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
              {deliveries.some(delivery=>delivery.status==='generated' && delivery.oneTimeChanges?.length && !isPastCutoffInstant(delivery.cutoffAt,delivery.isPastCutoff ?? true)) && <p className="mb-3 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">A delivery has a one-time reduction. Further reductions can be made below; recurring changes may need to wait until its cutoff.</p>}
              {deliveryPageLoading && <p role="status" className="mb-3 text-sm text-muted-foreground">Loading deliveries…</p>}
              {deliveries.length===0 ? <p className="py-4 text-sm text-muted-foreground">No upcoming deliveries.</p> : <div className={styles.deliveries}>{deliveries.map((delivery,index)=>{
                const deliveryId=delivery._id || `delivery-${index}`;
                const isExpanded=expandedDeliveryId===deliveryId;
                const recurringItems=getRecurringItemsForDelivery(delivery,subscription);
                const recurringSubtotal=getRecurringSubtotalForDelivery(delivery,subscription);
                const addOnTotal=getDeliveryAddOnTotal(delivery);
                const addOnQuantity=getDeliveryAddOnQuantity(delivery);
                const deliveryTotal=getTotalForDelivery(delivery,subscription);
                return <Collapsible key={deliveryId} open={isExpanded} onOpenChange={open=>setExpandedDeliveryId(open ? deliveryId : null)} className={styles.delivery}>
                  <CollapsibleTrigger asChild><Button size="sm" variant="ghost" id={`delivery-toggle-${deliveryId}`} data-tour="delivery-expand" aria-label={`${isExpanded ? 'Hide' : 'View'} details for ${formatDate(delivery.scheduledDate)}`} className={styles.deliveryTrigger}><span className="min-w-0 text-left"><span className="block text-sm font-medium">{formatDate(delivery.scheduledDate)}</span><span className={styles.deliverySubline}><DeliveryStatusBadge status={delivery.status}/>{addOnQuantity>0 && <span className="text-xs">{addOnQuantity} extra{addOnQuantity===1 ? '' : 's'}</span>}{Boolean(delivery.oneTimeChanges?.length) && <span className="text-xs">Adjusted</span>}</span></span><span className={styles.deliveryMeta}><span className="text-sm font-medium tabular-nums">{formatMoney(deliveryTotal)}</span><ChevronDown size={14} className={styles.chevron}/></span></Button></CollapsibleTrigger>
                  <CollapsibleContent className={styles.collapse}><div className={styles.deliveryContent} role="region" aria-label={`Delivery details for ${formatDate(delivery.scheduledDate)}`}>
                    {delivery.stockAvailability && delivery.stockAvailability.deferred.length>0 && <p className="mb-3 rounded-md bg-muted/50 p-3 text-sm">Unavailable: {delivery.stockAvailability.deferred.map(item=>`${item.name} × ${item.quantity}`).join(', ')}. {formatMoney(delivery.stockAvailability.notChargedMinor/100)} not charged. Items remain on your recurring plan without catch-up quantities.</p>}
                                              <p className="mb-2 text-xs font-medium text-muted-foreground">
                            Subscription items
                          </p>
                          <div className="space-y-1.5 text-sm">
                            {recurringItems.length === 0 && <p className="text-muted-foreground">No recurring items remain for this delivery.</p>}
                            {recurringItems.map((item) => (
                              <div
                                key={`${deliveryId}-${item._id || item.sku}`}
                                className="flex items-start justify-between gap-3 px-2 py-2"
                              >
                                <span className="text-foreground">
                                  {item.name} × {item.quantity}
                                </span>
                                <span className="shrink-0 text-muted-foreground">
                                  {formatMoney(
                                    Number(item.unitPrice || 0) *
                                      Number(item.quantity || 0),
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>

                          {(delivery.addOns || []).length > 0 && (
                            <div className="mt-3 border-t border-border/70 pt-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-forest">
                                One-time add-ons
                              </p>
                              <div className="space-y-1.5 text-sm">
                                {(delivery.addOns || []).flatMap((addOn) =>
                                  addOn.items.map((item, itemIndex) => (
                                    <div
                                      key={`${addOn.operationId}-${item.variant}-${itemIndex}`}
                                      className="flex items-start justify-between gap-3 px-2 py-2"
                                    >
                                      <span className="text-foreground">
                                        {item.name} × {item.quantity}
                                      </span>
                                      <span className="shrink-0 text-muted-foreground">
                                        {formatMoney(Number(item.subtotal || 0))}
                                      </span>
                                    </div>
                                  )),
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mt-3 space-y-1.5 border-t border-border/70 pt-3 text-sm">
                            <div className="flex items-center justify-between gap-3 text-muted-foreground">
                              <span>Subscription items</span>
                              <span>{formatMoney(recurringSubtotal)}</span>
                            </div>
                            {addOnTotal > 0 && (
                              <div className="flex items-center justify-between gap-3 text-forest">
                                <span>One-time add-ons</span>
                                <span>{formatMoney(addOnTotal)}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-3 text-muted-foreground">
                              <span>Delivery fee</span>
                              <span>{formatMoney(delivery.order?.deliveryFee ?? SUBSCRIPTION_DELIVERY_FEE)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-2 font-semibold text-foreground">
                              <span>Delivery total</span>
                              <span>{formatMoney(deliveryTotal)}</span>
                            </div>
                          </div>

                          <DeliveryReductionHistory changes={delivery.oneTimeChanges} />

                    <div className={styles.deliveryActions}>{delivery.order?._id && <Button size="sm" variant="outline" asChild><Link aria-label={`View order ${delivery.order.orderId || 'details'}`} to={`/portal/orders/${delivery.order._id}`}>View order</Link></Button>}<DeliveryReduction key={`${customer?._id}:${deliveryId}`} customerId={customer?._id || ''} subscriptionId={id!} delivery={delivery} onChanged={async result=>{setNotice(`Delivery changed. ${formatMoney(result.creditedMinor/100)} added as store credit. Your regular subscription stays the same.`);await Promise.all([load(true),refreshCustomer()]);}}/></div>
                  </div></CollapsibleContent>
                </Collapsible>;
              })}</div>}
              {deliveryPages.totalPages>1 && <nav aria-label="Delivery history pages" className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm"><Button size="sm" variant="outline" disabled={deliveryPageLoading || deliveryPages.page<=1} onClick={()=>{void load(true,deliveryPages.page-1).catch(()=>{});}}>Older deliveries</Button><span className="text-xs text-muted-foreground">Page {deliveryPages.page} of {deliveryPages.totalPages}</span><Button size="sm" variant="outline" disabled={deliveryPageLoading || deliveryPages.page>=deliveryPages.totalPages} onClick={()=>{void load(true,deliveryPages.page+1).catch(()=>{});}}>Newer deliveries</Button></nav>}
              <div className="mt-4"><DeliveryReductionGuide/></div>
            </CardContent>
          </Card>
          {(subscription.stockDeferralAvailable || subscription.introOffer || subscription.recurringPriceChange) && <Card className="shadow-none"><CardHeader className={styles.sectionHeader}><CardTitle className={styles.sectionTitle}>Plan preferences</CardTitle></CardHeader><CardContent className="px-4 pb-4 text-sm sm:px-5 sm:pb-5">
            {subscription.status!=='cancelled' && <RecurringPriceNotice change={subscription.recurringPriceChange}/>}
            {subscription.introOffer && <p className="mb-3 text-sm text-muted-foreground">First payment {formatMoney(subscription.introOffer.firstChargeMinor/100)}, including {formatMoney(subscription.introOffer.discountMinor/100)} introductory savings. Renewals use normal recurring prices.</p>}
            {subscription.stockDeferralAvailable && <Collapsible><CollapsibleTrigger asChild><Button size="sm" variant="ghost" className={styles.preferenceTrigger}><span>Unavailable products<span className="mt-1 block text-xs font-normal text-muted-foreground">{subscription.stockDeferralEnabled ? 'Available-products-only policy enabled' : 'Choose how future deliveries handle availability'}</span></span><ChevronDown size={15} className={styles.chevron}/></Button></CollapsibleTrigger><CollapsibleContent className={styles.collapse}><div className="space-y-3 px-3 pt-3 text-sm text-muted-foreground"><p>You pay for available products only. Unavailable products stay on your recurring plan without catch-up quantities. Already funded deliveries keep their confirmed selection.</p>{!subscription.stockDeferralEnabled && <><label className="flex items-start gap-2" htmlFor="availability-consent"><Checkbox id="availability-consent" className="mt-0.5" checked={stockConsent} onCheckedChange={checked=>setStockConsent(checked===true)} disabled={saving || subscription.status!=='active'}/>I agree to this policy for future unbilled deliveries.</label><Button size="sm" variant="outline" className="ml-auto flex w-fit" disabled={!stockConsent || saving || subscription.status!=='active'} onClick={async()=>{setSaving(true);try{setError(null);setNotice(null);await portalSubscriptionsApi.enableStockDeferral(subscription._id);await load(true);setNotice('Availability policy saved for future unbilled deliveries.');}catch(error){setNotice(null);setError(error instanceof Error ? error.message : 'Could not save availability policy');}finally{setSaving(false);}}}>Enable availability policy</Button></>}</div></CollapsibleContent></Collapsible>}
          </CardContent></Card>}

        {subscription.status !== "cancelled" && <Card className="shadow-none" data-tour="subscription-management">
          <CardContent className={styles.managementContent}>
            <div><h2 className={styles.sectionTitle}>Manage subscription</h2><p className="mt-2 text-sm text-muted-foreground">{subscription.isCancellationScheduled ? "Cancellation is scheduled. Your protected delivery remains in place." : subscription.status === "paused" ? "Resume deliveries when you are ready, or cancel this plan." : "Pause deliveries temporarily, or cancel your subscription."}</p></div>
        <div className={styles.managementActions}>
          {subscription.status === "active" ? <Button size="sm" variant="outline" data-tour="subscription-pause" onClick={()=>setPauseOpen(true)} disabled={saving || !canModify || Boolean(refundRecovery)}><Pause size={15}/>Pause</Button> : subscription.status === "paused" ? <Button size="sm" data-tour="subscription-resume" onClick={()=>setResumeOpen(true)} disabled={saving || subscription.isCancellationScheduled}><Play size={15}/>Resume subscription</Button> : null}
          <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/5 hover:text-destructive" data-tour="subscription-cancel" onClick={()=>setCancelOpen(true)} disabled={saving || subscription.isCancellationScheduled}>Cancel subscription</Button>
        </div>
          </CardContent>
        </Card>}
      </div>

      <Dialog
        open={pauseOpen}
        onOpenChange={(open) => {
          setPauseOpen(open);
          if (!open) {
            setPauseError(null);
            setPauseRefundMethod("refund");
          }
        }}
      >
        <DialogContent data-tour-page="pause-form" data-tour-ready={!saving} className="max-w-md max-h-[calc(100dvh_-_2rem)] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle>Pause Subscription?</DialogTitle>
            <DialogDescription data-tour="pause-policy">
              Skip eligible deliveries until your resume date (up to 28 days).
              Deliveries already on their way or past cutoff remain in place. Editing is unavailable while paused.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="pause-resume-date" className="text-sm font-medium text-foreground">
                Resume on
              </label>
              <Input
                id="pause-resume-date"
                data-tour="pause-date"
                type="date"
                min={pauseMinDate}
                max={pauseMaxDate}
                value={pauseResumeOn}
                onChange={(event) => { setPauseResumeOn(event.target.value); setPauseError(null); }}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                {formatDate(pauseMinDate)} –{" "}
                {formatDate(pauseMaxDate)}.
              </p>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Return eligible prepayments to
                </label>
                <Select
                  value={pauseRefundMethod}
                  onValueChange={(value) =>
                    setPauseRefundMethod(value as SubscriptionRefundMethod)
                  }
                >
                  <SelectTrigger data-tour="pause-settlement" aria-label="Return eligible prepayments to">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refund">Refund to payment card</SelectItem>
                    <SelectItem value="credit">Store credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {pauseError && (
                <p className="text-xs text-destructive">{pauseError}</p>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button size="sm"
                variant="outline"
                onClick={() => setPauseOpen(false)}
                disabled={saving}
              >
                Keep active
              </Button>
              <Button size="sm" data-tour="pause-confirm" onClick={() => void handlePause()} disabled={saving || !pauseResumeOn || pauseResumeOn < pauseMinDate || pauseResumeOn > pauseMaxDate}>
                {saving ? "Pausing..." : "Pause subscription"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmationModal
        buttonSize="sm"
        tourId="resume-confirmation"
        open={resumeOpen}
        onOpenChange={setResumeOpen}
        title="Resume Subscription?"
        description="Restart from the next eligible delivery. Your card may be charged to restore refunded or credited payments. Existing store credit is kept."
        confirmLabel="Resume"
        onConfirm={handleResume}
      />
      <ConfirmationModal
        buttonSize="sm"
        tourId="cancel-confirmation"
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Subscription?"
        description="Stop future deliveries. Deliveries already on their way or past cutoff remain in place. Only eligible unused payments can be refunded or credited."
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Subscription"
        variant="destructive"
        onConfirm={handleCancelAttempt}
      />
      <ConfirmationModal
        buttonSize="sm"
        open={Boolean(removeProductId)}
        onOpenChange={(open) => {
          if (!open) setRemoveProductId(null);
        }}
        title="Remove Product?"
        description="Remove from your draft. Save product changes to apply."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleRemoveItem}
      />

      <Dialog
        open={refundChoiceOpen}
        onOpenChange={(open) => {
          setRefundChoiceOpen(open);
          if (!open) {
            setPendingDeliveryDetailsSave(null);
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[calc(100dvh_-_2rem)] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle>Return prepaid funds</DialogTitle>
            <DialogDescription>
              {pendingDeliveryDetailsSave ? (
                "Choose where to return your prepaid delivery amount."
              ) : (
                <>
                  Choose where to return the{" "}
                  <strong>
                    {formatMoney(Math.max(0, previewOriginalTotal - total))}
                  </strong>
                  {" "}difference.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button size="sm"
              variant="outline"
              className="h-auto whitespace-normal py-3 justify-start text-left"
              disabled={saving}
              onClick={() => {
                setRefundChoiceOpen(false);
                if (pendingDeliveryDetailsSave) {
                  void handleSaveDeliveryDetailsWithRefundMethod("credit");
                  return;
                }
                void performSaveProductChanges("credit");
              }}
            >
              <div>
                <div className="font-medium">Store credit</div>
                <div className="text-xs text-muted-foreground">
                  For future orders.
                </div>
              </div>
            </Button>
            <Button size="sm"
              variant="outline"
              className="h-auto whitespace-normal py-3 justify-start text-left"
              disabled={saving}
              onClick={() => {
                setRefundChoiceOpen(false);
                if (pendingDeliveryDetailsSave) {
                  void handleSaveDeliveryDetailsWithRefundMethod("refund");
                  return;
                }
                void performSaveProductChanges("refund");
              }}
            >
              <div>
                <div className="font-medium">Refund to my card</div>
                <div className="text-xs text-muted-foreground">
                  To your original payment method, where possible.
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cancelRefundChoiceOpen}
        onOpenChange={setCancelRefundChoiceOpen}
      >
        <DialogContent className="max-w-md max-h-[calc(100dvh_-_2rem)] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle>Return prepaid funds</DialogTitle>
            <DialogDescription>
              Choose store credit or a refund to your card.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button size="sm"
              variant="outline"
              className="h-auto whitespace-normal py-3 justify-start text-left"
              disabled={saving}
              onClick={() => {
                void handleCancel("credit");
              }}
            >
              <div>
                <div className="font-medium">Store credit</div>
                <div className="text-xs text-muted-foreground">
                  For future orders.
                </div>
              </div>
            </Button>
            <Button size="sm"
              variant="outline"
              className="h-auto whitespace-normal py-3 justify-start text-left"
              disabled={saving}
              onClick={() => {
                void handleCancel("refund");
              }}
            >
              <div>
                <div className="font-medium">Refund to my card</div>
                <div className="text-xs text-muted-foreground">
                  To your original payment method, where possible.
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionDetailPage;





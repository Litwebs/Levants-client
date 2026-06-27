import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  CalendarDays,
  MapPin,
  Pause,
  Play,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import {
  SubscriptionStatusBadge,
  DeliveryStatusBadge,
} from "@/portal/components/StatusBadges";
import { ConfirmationModal, EmptyState } from "@/portal/components/PortalUI";
import { ApiError } from "@/api/client";
import { usePortalCustomer } from "@/portal/context/CustomerContext";
import {
  portalSubscriptionsApi,
  type PortalSubscription,
  type PortalSubscriptionItem,
  type PortalSubscriptionDelivery,
  type PortalSubscriptionCutoff,
} from "@/api/portalSubscriptions";

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

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount || 0);

const SubscriptionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { refreshCustomer } = usePortalCustomer();
  const [subscription, setSubscription] = useState<PortalSubscription | null>(
    null,
  );
  const [deliveries, setDeliveries] = useState<PortalSubscriptionDelivery[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [pauseOpen, setPauseOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [removeProductId, setRemoveProductId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState("weekly");
  const [deliveryDay, setDeliveryDay] = useState("Tuesday");
  const [cutoff, setCutoff] = useState<PortalSubscriptionCutoff | null>(null);
  const [refundChoiceOpen, setRefundChoiceOpen] = useState(false);
  const [productDraft, setProductDraft] = useState<EditableSubscriptionItem[]>(
    [],
  );

  const load = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const [subRes, delRes] = await Promise.all([
        portalSubscriptionsApi.get(id),
        portalSubscriptionsApi.listDeliveries(id, { page: 1, pageSize: 10 }),
      ]);

      const sub = (subRes as any)?.data?.subscription as PortalSubscription;
      const nextCutoff =
        ((subRes as any)?.data?.cutoff as PortalSubscriptionCutoff) || null;
      const nextDeliveries =
        ((delRes as any)?.data?.deliveries as PortalSubscriptionDelivery[]) ||
        [];

      setSubscription(sub || null);
      setCutoff(nextCutoff);
      setDeliveries(nextDeliveries);

      if (sub) {
        setFrequency(sub.frequency);
        setDeliveryDay(toDayName(sub.preferredDeliveryDay));
        setProductDraft(sub.items.map(toEditableItem));
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to load subscription details.",
      );
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const updateQty = (localId: string, quantity: number) => {
    setProductDraft((prev) =>
      prev.map((item) =>
        item.localId === localId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item,
      ),
    );
  };

  const total = useMemo(() => {
    if (!productDraft.length) return 0;
    return productDraft.reduce(
      (sum, item) =>
        sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
      0,
    );
  }, [productDraft]);

  const originalTotal = useMemo(() => {
    if (!subscription) return 0;
    return subscription.items.reduce(
      (sum, item) =>
        sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
      0,
    );
  }, [subscription]);

  const hasUnsavedProductChanges = useMemo(() => {
    if (!subscription) return false;
    if (productDraft.length !== subscription.items.length) return true;

    const byId = new Map(subscription.items.map((item) => [item._id, item]));
    for (const draftItem of productDraft) {
      if (!draftItem.existingItemId) return true;
      const original = byId.get(draftItem.existingItemId);
      if (!original) return true;
      if (Number(original.quantity || 0) !== Number(draftItem.quantity || 0)) {
        return true;
      }
    }
    return false;
  }, [productDraft, subscription]);

  const handleSaveSchedule = async () => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      await portalSubscriptionsApi.update(id, {
        frequency: frequency as "weekly" | "every_two_weeks" | "monthly",
        preferredDeliveryDay: dayNameToIndex(deliveryDay),
      });
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to save schedule.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePause = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await portalSubscriptionsApi.pause(id);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleResume = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await portalSubscriptionsApi.resume(id);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await portalSubscriptionsApi.cancel(id);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveItem = async () => {
    if (!removeProductId) return;
    setProductDraft((prev) =>
      prev.filter((item) => item.localId !== removeProductId),
    );
    setRemoveProductId(null);
  };

  const handleSaveProductChanges = async () => {
    if (!id || !subscription || !hasUnsavedProductChanges) return;

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

    if (hasDecrease && cutoff && !cutoff.isPastCutoff) {
      setRefundChoiceOpen(true);
      return;
    }

    await performSaveProductChanges("credit");
  };

  const performSaveProductChanges = async (
    refundMethod: "credit" | "refund",
  ) => {
    if (!id || !subscription || !hasUnsavedProductChanges) return;

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

    try {
      setSaving(true);
      setError(null);
      setNotice(null);

      let lastMessage: string | null = null;
      for (const itemId of itemsToRemove) {
        const res = await portalSubscriptionsApi.removeItem(id, itemId, {
          refundMethod,
        });
        lastMessage = (res as any)?.message || lastMessage;
      }
      for (const item of itemsToUpdate) {
        const res = await portalSubscriptionsApi.updateItem(
          id,
          item.existingItemId as string,
          {
            quantity: item.quantity,
            refundMethod,
          },
        );
        lastMessage = (res as any)?.message || lastMessage;
      }

      await load();
      await refreshCustomer().catch(() => {});
      if (lastMessage) setNotice(lastMessage);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to save product changes.",
      );
    } finally {
      setSaving(false);
    }
  };

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
    subscription.deliveryAddress?.line1,
    subscription.deliveryAddress?.line2,
    subscription.deliveryAddress?.city,
    subscription.deliveryAddress?.postcode,
    subscription.deliveryAddress?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-2 min-w-0">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 mt-0.5"
          >
            <Link to="/portal/subscriptions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground truncate">
              {subscription.subscriptionNumber ||
                `Subscription ${subscription._id.slice(-6)}`}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Started {formatDate(subscription.startDate)}
            </p>
          </div>
        </div>
        <SubscriptionStatusBadge status={subscription.status} />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-xl text-sm">
          {error}
        </div>
      )}

      {notice && (
        <div className="mb-4 p-3 bg-forest/10 text-forest rounded-xl text-sm">
          {notice}
        </div>
      )}

      {cutoff && subscription.status === "active" && (
        <div
          className={`mb-4 rounded-xl border p-3 text-xs sm:text-sm leading-relaxed ${
            cutoff.isPastCutoff
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-forest/20 bg-forest/5 text-foreground"
          }`}
        >
          {cutoff.isPastCutoff ? (
            <>
              The cut-off for your next delivery
              {subscription.nextDeliveryDate
                ? ` on ${formatDate(subscription.nextDeliveryDate)}`
                : ""}{" "}
              has passed. You can still make changes, but they'll apply from the
              delivery after that.
            </>
          ) : (
            <>
              You can edit this subscription until{" "}
              <span className="font-semibold">
                {cutoff.cutoffAt ? formatDate(cutoff.cutoffAt) : "the cut-off"}
              </span>
              {cutoff.cutoffTime ? ` at ${cutoff.cutoffTime}` : ""}. Changes
              apply to your next delivery; adding items charges the difference
              now.
            </>
          )}
        </div>
      )}

      {subscription.pendingChanges?.items &&
        subscription.pendingChanges.items.length > 0 && (
          <div className="mb-4 rounded-xl border border-blue-300 bg-blue-50 text-blue-900 p-3 text-xs sm:text-sm leading-relaxed">
            <p className="font-semibold mb-1">Scheduled change</p>
            <p>
              A change you made after the cut-off will take effect from{" "}
              <span className="font-semibold">
                {subscription.pendingChanges.effectiveFrom
                  ? formatDate(subscription.pendingChanges.effectiveFrom)
                  : "your next delivery"}
              </span>
              . Your upcoming delivery stays as listed below until then.
            </p>
            <ul className="mt-2 space-y-1">
              {subscription.pendingChanges.items.map((it, idx) => (
                <li key={idx} className="flex justify-between gap-3">
                  <span>
                    {it.name} × {it.quantity}
                  </span>
                  <span className="font-medium">
                    {formatMoney(
                      Number(it.unitPrice || 0) * Number(it.quantity || 0),
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

      <div className="rounded-2xl border border-border bg-gradient-to-r from-card via-card to-muted/30 p-4 sm:p-5 mb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              Next delivery
            </p>
            <p className="text-sm sm:text-base font-semibold text-foreground mt-1">
              {formatDate(subscription.nextDeliveryDate)}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              Frequency
            </p>
            <p className="text-sm sm:text-base font-semibold text-foreground mt-1">
              {frequency === "every_two_weeks"
                ? "Every 2 weeks"
                : frequency.charAt(0).toUpperCase() + frequency.slice(1)}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              Delivery day
            </p>
            <p className="text-sm sm:text-base font-semibold text-foreground mt-1">
              {deliveryDay}
            </p>
          </div>
          <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              Per delivery
            </p>
            <p className="text-sm sm:text-base font-semibold text-foreground mt-1">
              {formatMoney(total)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
        <div className="xl:col-span-8 space-y-4">
          <section className="bg-card border border-border rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-semibold text-foreground text-base sm:text-lg">
                Products in Subscription
              </h3>
              <Button variant="outline" size="sm" className="h-8" asChild>
                <Link to={`/portal/subscriptions/${id}/add-products`}>
                  <Plus className="h-3.5 w-3.5" />
                  Add product
                </Link>
              </Button>
            </div>

            <div className="space-y-2.5">
              {productDraft.map((item, idx) => (
                <div
                  key={item.localId || idx}
                  className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 flex items-center gap-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm sm:text-base truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.sku} · {formatMoney(item.unitPrice)} each
                    </p>
                  </div>
                  <button
                    onClick={() => updateQty(item.localId, item.quantity - 1)}
                    disabled={saving}
                    className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(item.localId, item.quantity + 1)}
                    disabled={saving}
                    className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => setRemoveProductId(item.localId)}
                    disabled={saving}
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <Separator className="my-3" />
            {hasUnsavedProductChanges && (
              <div className="mb-3 rounded-xl border border-forest/20 bg-forest/5 p-3 text-xs sm:text-sm text-foreground leading-relaxed">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    Current per delivery
                  </span>
                  <span>{formatMoney(originalTotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    New per delivery
                  </span>
                  <span className="font-semibold">{formatMoney(total)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1 pt-1 border-t border-forest/20">
                  <span className="text-muted-foreground">
                    {total - originalTotal >= 0
                      ? "Extra per delivery"
                      : "Saving per delivery"}
                  </span>
                  <span
                    className={
                      total - originalTotal >= 0
                        ? "font-semibold text-forest"
                        : "font-semibold text-foreground"
                    }
                  >
                    {total - originalTotal >= 0 ? "+" : "−"}
                    {formatMoney(Math.abs(total - originalTotal))}
                  </span>
                </div>
                <p className="mt-2 text-muted-foreground">
                  {cutoff?.isPastCutoff
                    ? subscription.nextDeliveryDate
                      ? `The cut-off for your next delivery on ${formatDate(
                          subscription.nextDeliveryDate,
                        )} has passed, so this change applies from the delivery after that. You won't be charged now — the new amount is taken on each delivery going forward.`
                      : `The cut-off for your next delivery has passed, so this change applies from the following delivery. You won't be charged now.`
                    : total - originalTotal > 0
                      ? subscription.nextDeliveryDate
                        ? `Applies to your next delivery on ${formatDate(
                            subscription.nextDeliveryDate,
                          )}. The extra ${formatMoney(
                            total - originalTotal,
                          )} is charged to your card now; future deliveries are billed at the new amount.`
                        : `Applies to your next delivery. The extra ${formatMoney(
                            total - originalTotal,
                          )} is charged to your card now; future deliveries are billed at the new amount.`
                      : subscription.nextDeliveryDate
                        ? `Applied from your next delivery on ${formatDate(
                            subscription.nextDeliveryDate,
                          )}. You won't be charged now — the new amount is taken on each delivery going forward.`
                        : `Applied from your next scheduled delivery. You won't be charged now — the new amount is taken on each delivery going forward.`}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <span className="text-sm font-semibold text-muted-foreground">
                  Per delivery total
                </span>
                <div className="text-lg font-bold text-foreground">
                  {formatMoney(total)}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setProductDraft(subscription.items.map(toEditableItem))
                  }
                  disabled={!hasUnsavedProductChanges || saving}
                >
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={() => void handleSaveProductChanges()}
                  disabled={!hasUnsavedProductChanges || saving}
                >
                  {saving ? "Saving..." : "Save product changes"}
                </Button>
              </div>
            </div>
          </section>

          <section className="grid sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-base sm:text-lg">
                <CalendarDays className="h-4 w-4 text-forest" />
                Delivery Schedule
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Frequency
                  </p>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="every_two_weeks">
                        Every 2 weeks
                      </SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Preferred Day
                  </p>
                  <Select value={deliveryDay} onValueChange={setDeliveryDay}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(cutoff?.deliveryDays?.length
                        ? cutoff.deliveryDays.map((d) => toDayName(d))
                        : [
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                          ]
                      ).map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => void handleSaveSchedule()}
                  disabled={saving}
                >
                  Save Schedule
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-base sm:text-lg">
                <MapPin className="h-4 w-4 text-forest" />
                Delivery Address
              </h3>
              <p className="text-sm text-foreground leading-relaxed">
                {fullAddress || "No delivery address configured."}
              </p>
              <Button variant="outline" size="sm" asChild className="mt-4">
                <Link to="/portal/addresses">Change address</Link>
              </Button>
            </div>
          </section>

          <section className="bg-card border border-border rounded-2xl p-4 sm:p-5">
            <h3 className="font-semibold text-foreground mb-3 text-base sm:text-lg">
              Upcoming Deliveries
            </h3>
            {deliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming deliveries.
              </p>
            ) : (
              <div className="space-y-2">
                {deliveries.map((d, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border/70 bg-muted/10 px-3 py-2.5 flex items-center justify-between gap-2"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {formatDate(d.scheduledDate)}
                    </span>
                    <DeliveryStatusBadge status={d.status as any} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="xl:col-span-4">
          <div className="space-y-4 xl:sticky xl:top-4">
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
              <h3 className="font-semibold text-foreground mb-3 text-base sm:text-lg">
                Subscription Actions
              </h3>
              <div className="space-y-2">
                {subscription.status === "active" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setPauseOpen(true)}
                    disabled={saving}
                  >
                    <Pause className="h-3.5 w-3.5" />
                    Pause Subscription
                  </Button>
                ) : subscription.status === "paused" ? (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setResumeOpen(true)}
                    disabled={saving}
                  >
                    <Play className="h-3.5 w-3.5" />
                    Resume Subscription
                  </Button>
                ) : null}
                {subscription.status !== "cancelled" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-destructive hover:bg-destructive/10"
                    onClick={() => setCancelOpen(true)}
                    disabled={saving}
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
              <h4 className="text-sm font-semibold text-foreground mb-2">
                Snapshot
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium text-foreground">
                    {productDraft.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-foreground capitalize">
                    {subscription.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Per delivery</span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <ConfirmationModal
        open={pauseOpen}
        onOpenChange={setPauseOpen}
        title="Pause Subscription?"
        description="Deliveries will be paused from the next scheduled date. You can resume anytime."
        confirmLabel="Pause"
        onConfirm={handlePause}
      />
      <ConfirmationModal
        open={resumeOpen}
        onOpenChange={setResumeOpen}
        title="Resume Subscription?"
        description="Your subscription will resume from the next available delivery date."
        confirmLabel="Resume"
        onConfirm={handleResume}
      />
      <ConfirmationModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Subscription?"
        description="This will permanently cancel your subscription and stop all future deliveries."
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Subscription"
        variant="destructive"
        onConfirm={handleCancel}
      />
      <ConfirmationModal
        open={Boolean(removeProductId)}
        onOpenChange={(open) => {
          if (!open) setRemoveProductId(null);
        }}
        title="Remove Product?"
        description="This removes the product from your draft changes. Click Save product changes to apply it."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleRemoveItem}
      />

      <Dialog open={refundChoiceOpen} onOpenChange={setRefundChoiceOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle>How would you like your refund?</DialogTitle>
            <DialogDescription>
              You're reducing this subscription by{" "}
              <strong>{formatMoney(Math.max(0, originalTotal - total))}</strong>
              . Choose how you'd like to receive the difference.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="outline"
              className="h-auto py-3 justify-start text-left"
              disabled={saving}
              onClick={() => {
                setRefundChoiceOpen(false);
                void performSaveProductChanges("credit");
              }}
            >
              <div>
                <div className="font-medium">Store credit</div>
                <div className="text-xs text-muted-foreground">
                  Added to your account instantly to spend on future orders.
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-3 justify-start text-left"
              disabled={saving}
              onClick={() => {
                setRefundChoiceOpen(false);
                void performSaveProductChanges("refund");
              }}
            >
              <div>
                <div className="font-medium">Refund to my card</div>
                <div className="text-xs text-muted-foreground">
                  Sent back to your original payment method where possible.
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

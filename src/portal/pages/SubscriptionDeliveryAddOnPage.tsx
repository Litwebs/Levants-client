import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ShopPage from "@/pages/ShopPage";
import { ApiError } from "@/api/client";
import {
  portalSubscriptionsApi,
  type PortalSubscription,
  type PortalSubscriptionCutoff,
  type PortalSubscriptionDelivery,
} from "@/api/portalSubscriptions";
import { toast } from "sonner";

type SelectedAddOn = {
  variantId: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(Number(amount || 0));

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "your next delivery";

const getDeliveryCutoff = (
  deliveryDate: string,
  cutoff: PortalSubscriptionCutoff | null,
) => {
  if (!cutoff) return null;
  const date = new Date(deliveryDate);
  date.setDate(date.getDate() - Number(cutoff.cutoffDaysBefore || 0));
  const [hours, minutes] = String(cutoff.cutoffTime || "22:00")
    .split(":")
    .map(Number);
  date.setHours(
    Number.isFinite(hours) ? hours : 0,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0,
  );
  return date;
};

const SubscriptionDeliveryAddOnPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const operationIdRef = useRef<string | null>(null);
  const [subscription, setSubscription] = useState<PortalSubscription | null>(
    null,
  );
  const [delivery, setDelivery] =
    useState<PortalSubscriptionDelivery | null>(null);
  const [cutoff, setCutoff] = useState<PortalSubscriptionCutoff | null>(null);
  const [selected, setSelected] = useState<Record<string, SelectedAddOn>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retryLocked, setRetryLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteHeaderHeight, setSiteHeaderHeight] = useState(0);

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const update = () =>
      setSiteHeaderHeight(header.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  const stickyTopOffset = siteHeaderHeight + 16;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [subscriptionResponse, deliveriesResponse] = await Promise.all([
          portalSubscriptionsApi.get(id),
          portalSubscriptionsApi.listDeliveries(id, { page: 1, pageSize: 20 }),
        ]);
        if (cancelled) return;
        const nextSubscription = subscriptionResponse.data?.subscription;
        const nextCutoff = subscriptionResponse.data?.cutoff || null;
        const deliveries = (deliveriesResponse.data?.deliveries || []).filter(
          (candidate) => {
          const date = new Date(candidate.scheduledDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return (
            (candidate.status === "scheduled" ||
              (candidate.status === "generated" &&
                candidate.order?.deliveryStatus === "ordered")) &&
            date.getTime() >= today.getTime()
          );
          },
        );
        deliveries.sort(
          (left, right) =>
            new Date(left.scheduledDate).getTime() -
            new Date(right.scheduledDate).getTime(),
        );
        setSubscription(nextSubscription || null);
        setDelivery(deliveries[0] || null);
        setCutoff(nextCutoff);
      } catch (loadError) {
        if (cancelled) return;
        const message =
          loadError instanceof ApiError
            ? loadError.message
            : "Failed to load the next delivery.";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const selectedItems = useMemo(() => Object.values(selected), [selected]);
  const newAddOnTotal = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      ),
    [selectedItems],
  );
  const existingAddOnTotal = useMemo(
    () =>
      (delivery?.addOns || []).reduce(
        (sum, addOn) => sum + Number(addOn.amountMinor || 0) / 100,
        0,
      ),
    [delivery],
  );
  const deliveryCutoff = delivery
    ? getDeliveryCutoff(delivery.scheduledDate, cutoff)
    : null;
  const isPastCutoff = Boolean(
    deliveryCutoff && Date.now() >= deliveryCutoff.getTime(),
  );
  const canPurchase = Boolean(
    subscription?.status === "active" && delivery && !isPastCutoff,
  );

  const resetOperationForEdit = () => {
    if (!retryLocked) operationIdRef.current = null;
  };

  const toggleProduct = (
    variantId: string,
    productName: string,
    variantName: string,
    unitPrice: number,
  ) => {
    if (retryLocked) return;
    resetOperationForEdit();
    setSelected((current) => {
      if (current[variantId]) {
        const next = { ...current };
        delete next[variantId];
        return next;
      }
      return {
        ...current,
        [variantId]: {
          variantId,
          productName,
          variantName,
          unitPrice,
          quantity: 1,
        },
      };
    });
  };

  const updateQuantity = (variantId: string, delta: number) => {
    if (retryLocked) return;
    resetOperationForEdit();
    setSelected((current) => {
      const item = current[variantId];
      if (!item) return current;
      return {
        ...current,
        [variantId]: {
          ...item,
          quantity: Math.min(20, Math.max(1, item.quantity + delta)),
        },
      };
    });
  };

  const removeItem = (variantId: string) => {
    if (retryLocked) return;
    resetOperationForEdit();
    setSelected((current) => {
      const next = { ...current };
      delete next[variantId];
      return next;
    });
  };

  const submit = async () => {
    if (!id || !canPurchase || selectedItems.length === 0) return;
    operationIdRef.current ||= crypto.randomUUID();
    try {
      setSaving(true);
      setError(null);
      const response = await portalSubscriptionsApi.addNextDeliveryAddOn(id, {
        operationId: operationIdRef.current,
        items: selectedItems.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      });
      const message = response.message || "Your one-time add-on is confirmed.";
      toast.success(message, {
        description: "Your recurring subscription has not changed.",
      });
      navigate(`/portal/subscriptions/${id}`);
    } catch (submitError) {
      const message =
        submitError instanceof ApiError
          ? submitError.message
          : "Failed to add these products to the next delivery.";
      if (!(submitError instanceof ApiError) || submitError.status >= 500) {
        setRetryLocked(true);
      } else {
        operationIdRef.current = null;
      }
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your next delivery...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link to={`/portal/subscriptions/${id}`}>
          <ArrowLeft className="h-4 w-4" />
          Back to subscription
        </Link>
      </Button>

      <div className="mb-5">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Add to your next delivery
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose one-time products for {formatDate(delivery?.scheduledDate)}.
          Your weekly subscription will stay exactly the same.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-5 rounded-xl border border-forest/20 bg-forest/5 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-forest" />
          <div>
            <p className="font-semibold text-foreground">
              {delivery
                ? formatDate(delivery.scheduledDate)
                : "No upcoming delivery"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {deliveryCutoff
                ? `${isPastCutoff ? "The cut-off passed" : "Order before"} ${formatDate(deliveryCutoff.toISOString())} at ${cutoff?.cutoffTime}.`
                : "Add-ons are available only before the delivery cut-off."}
            </p>
            {existingAddOnTotal > 0 && (
              <p className="mt-1 text-xs font-medium text-forest">
                One-time add-ons already confirmed: {formatMoney(existingAddOnTotal)}
              </p>
            )}
          </div>
        </div>
      </div>

      {!canPurchase ? (
        <Alert>
          <AlertDescription>
            {!delivery
              ? "There is no upcoming delivery available for an add-on."
              : isPastCutoff
                ? "The cut-off for this delivery has passed, so it can no longer accept add-ons."
                : "One-time add-ons are available only while the subscription is active."}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ShopPage
              embedded
              hideCardQuantityStepper
              contentGapClassName="flex flex-col lg:flex-row gap-4"
              productGridClassName="grid grid-cols-1 sm:grid-cols-2 gap-6"
              sidebarStickyTopOffset={stickyTopOffset}
              cardActionLabel={({ lockedVariantId }) =>
                lockedVariantId && selected[lockedVariantId]
                  ? "Remove one-time item"
                  : "Add once"
              }
              cardActionClassName={({ lockedVariantId }) =>
                lockedVariantId && selected[lockedVariantId]
                  ? "!bg-destructive/10 !text-destructive hover:!bg-destructive/20"
                  : undefined
              }
              onCardAction={({ product, variant, lockedVariantId }) => {
                const variantId = variant?.id || lockedVariantId;
                if (!variantId) return;
                toggleProduct(
                  variantId,
                  product.name,
                  variant?.name || "",
                  Number(variant?.price || 0),
                );
              }}
            />
          </div>

          <aside className="sticky bottom-0 z-40 lg:static lg:z-auto lg:col-span-4">
            <section
              className="max-h-[65vh] overflow-y-auto rounded-t-xl border border-border bg-card p-4 shadow-2xl lg:sticky lg:max-h-[calc(100vh-var(--sticky-top)-16px)] lg:rounded-xl lg:shadow-none"
              style={
                {
                  ["--sticky-top" as string]: `${stickyTopOffset}px`,
                  top: stickyTopOffset,
                } as React.CSSProperties
              }
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-forest" />
                <h2 className="font-semibold text-foreground">
                  One-time add-on
                </h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Charged now and delivered once. Future deliveries are unchanged.
              </p>

              {selectedItems.length === 0 ? (
                <p className="mt-4 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                  Select a product to add it to this delivery.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {selectedItems.map((item) => (
                    <div
                      key={item.variantId}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {item.productName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.variantName} · {formatMoney(item.unitPrice)} each
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${item.productName}`}
                          disabled={retryLocked}
                          onClick={() => removeItem(item.variantId)}
                          className="rounded-md p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex h-8 items-center rounded-md border border-border">
                          <button
                            type="button"
                            aria-label={`Decrease ${item.productName} quantity`}
                            disabled={retryLocked || item.quantity <= 1}
                            onClick={() => updateQuantity(item.variantId, -1)}
                            className="flex h-8 w-8 items-center justify-center hover:bg-muted disabled:opacity-40"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase ${item.productName} quantity`}
                            disabled={retryLocked || item.quantity >= 20}
                            onClick={() => updateQuantity(item.variantId, 1)}
                            className="flex h-8 w-8 items-center justify-center hover:bg-muted disabled:opacity-40"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {formatMoney(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="font-medium text-foreground">Charge now</span>
                <span className="text-lg font-bold text-foreground">
                  {formatMoney(newAddOnTotal)}
                </span>
              </div>

              {retryLocked && (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
                  Payment confirmation was interrupted. Your selection is locked
                  so you can safely retry without being charged twice.
                </p>
              )}

              <Button
                className="mt-4 w-full"
                disabled={saving || selectedItems.length === 0}
                onClick={() => void submit()}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirming payment...
                  </>
                ) : retryLocked ? (
                  "Retry confirmation"
                ) : (
                  `Pay ${formatMoney(newAddOnTotal)} and add once`
                )}
              </Button>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDeliveryAddOnPage;

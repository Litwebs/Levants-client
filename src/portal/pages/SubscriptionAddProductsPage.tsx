import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ShopPage from "@/pages/ShopPage";
import { ApiError } from "@/api/client";
import {
  portalSubscriptionsApi,
  type PortalSubscriptionCutoff,
  type PortalSubscription,
} from "@/api/portalSubscriptions";
import { toast } from "sonner";

type SelectedAddItem = {
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount || 0);

const formatDeliveryDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : null;

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

const formatDayList = (days: string[]) => {
  if (days.length <= 1) return days[0] || "the selected day";
  if (days.length === 2) return `${days[0]} and ${days[1]}`;
  return `${days.slice(0, -1).join(", ")}, and ${days[days.length - 1]}`;
};

const formatDateOnly = (value: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);

const getNextWeekdayDate = (dayIndex: number, referenceDate = new Date()) => {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);
  const currentDay = date.getDay();
  let daysUntil = (dayIndex - currentDay + 7) % 7;
  if (daysUntil === 0) daysUntil = 7;
  date.setDate(date.getDate() + daysUntil);
  return date;
};

const getDayCutoffLabel = (
  dayName: string,
  dayIndex: number,
  cutoff: PortalSubscriptionCutoff,
) => {
  const deliveryDate = getNextWeekdayDate(dayIndex);
  const cutoffDate = new Date(deliveryDate);
  cutoffDate.setDate(
    cutoffDate.getDate() - (Number(cutoff.cutoffDaysBefore) || 0),
  );

  const [hours, minutes] = String(cutoff.cutoffTime || "00:00")
    .split(":")
    .map((part) => Number(part));
  cutoffDate.setHours(
    Number.isFinite(hours) ? hours : 0,
    Number.isFinite(minutes) ? minutes : 0,
    0,
    0,
  );

  const isPastCutoff = Date.now() >= cutoffDate.getTime();

  return `${dayName}: ${isPastCutoff ? "Locked after" : "Editable until"} ${formatDateOnly(cutoffDate)} at ${cutoff.cutoffTime}`;
};

const formatDeliveryDayCount = (days: string[]) =>
  days.length === 1 ? "1 delivery day" : `${days.length} delivery days`;

const SubscriptionAddProductsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [subscriptionLabel, setSubscriptionLabel] = useState("");
  const [subscriptionSnapshot, setSubscriptionSnapshot] =
    useState<PortalSubscription | null>(null);
  const [deliveryDays, setDeliveryDays] = useState<string[]>(["Tuesday"]);
  const [nextDeliveryDate, setNextDeliveryDate] = useState<string | null>(null);
  const [currentPerDelivery, setCurrentPerDelivery] = useState(0);
  const [cutoff, setCutoff] = useState<PortalSubscriptionCutoff | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAdds, setSelectedAdds] = useState<
    Record<string, SelectedAddItem>
  >({});
  const [selectedAddDays, setSelectedAddDays] = useState<
    Record<string, string[]>
  >({});

  // Measure the sticky site header so the sidebar can sit right below it
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

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const subRes = await portalSubscriptionsApi.get(id);

        if (cancelled) return;

        const subscription = (subRes as any)?.data?.subscription as
          | PortalSubscription
          | undefined;
        const label =
          subscription?.subscriptionNumber ||
          `Subscription ${String(subscription?._id || id)
            .slice(-6)
            .toUpperCase()}`;
        setSubscriptionSnapshot(subscription || null);
        setSubscriptionLabel(label);
        setNextDeliveryDate(
          subscription?.upcomingDeliveryDate ??
            subscription?.nextDeliveryDate ??
            null,
        );
        const subscriptionDays = normalizeDayIndexes(
          Array.isArray(subscription?.preferredDeliveryDays) &&
            subscription.preferredDeliveryDays.length > 0
            ? subscription.preferredDeliveryDays
            : [Number(subscription?.preferredDeliveryDay ?? 2)],
        );
        setDeliveryDays(subscriptionDays.map((day) => toDayName(day)));
        setCutoff(
          ((subRes as any)?.data?.cutoff as PortalSubscriptionCutoff) || null,
        );
        const currentItems = Array.isArray(subscription?.items)
          ? subscription.items
          : [];
        setCurrentPerDelivery(
          currentItems.reduce(
            (sum: number, it: any) =>
              sum + Number(it?.unitPrice || 0) * Number(it?.quantity || 0),
            0,
          ),
        );
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiError ? err.message : "Failed to load products.";
        setError(message);
        toast.error(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleVariantSelection = (
    variantId: string,
    productName: string,
    variantName: string,
    unitPrice: number,
  ) => {
    setSelectedAdds((prev) => {
      if (prev[variantId]) {
        const next = { ...prev };
        delete next[variantId];
        setSelectedAddDays((prevDays) => {
          const nextDays = { ...prevDays };
          delete nextDays[variantId];
          return nextDays;
        });
        return next;
      }

      return {
        ...prev,
        [variantId]: {
          variantId,
          productName,
          variantName,
          quantity: 1,
          unitPrice,
        },
      };
    });
  };

  useEffect(() => {
    if (!deliveryDays.length) return;

    setSelectedAddDays((prev) => {
      const next: Record<string, string[]> = {};
      for (const variantId of Object.keys(selectedAdds)) {
        const current = Array.isArray(prev[variantId]) ? prev[variantId] : [];
        next[variantId] = current.filter((day) => deliveryDays.includes(day));
      }
      return next;
    });
  }, [deliveryDays, selectedAdds]);

  const updateSelectedQty = (variantId: string, delta: number) => {
    setSelectedAdds((prev) => {
      const existing = prev[variantId];
      if (!existing) return prev;
      const quantity = Math.max(1, existing.quantity + delta);
      return { ...prev, [variantId]: { ...existing, quantity } };
    });
  };

  const selectedList = useMemo(
    () => Object.values(selectedAdds),
    [selectedAdds],
  );

  const selectedDayIndexes = useMemo(
    () => normalizeDayIndexes(deliveryDays.map(dayNameToIndex)),
    [deliveryDays],
  );
  const isMultiDayWeekly =
    subscriptionSnapshot?.frequency === "weekly" &&
    selectedDayIndexes.length > 1;
  const hasUnassignedDay =
    isMultiDayWeekly &&
    selectedList.some(
      (item) =>
        !Array.isArray(selectedAddDays[item.variantId]) ||
        selectedAddDays[item.variantId].length === 0,
    );

  const getAssignedDayCount = (variantId: string) =>
    Array.isArray(selectedAddDays[variantId])
      ? selectedAddDays[variantId].length
      : 0;

  const getItemAssignedTotal = (item: SelectedAddItem) => {
    const assignedDayCount = isMultiDayWeekly
      ? getAssignedDayCount(item.variantId)
      : 1;
    return (
      Number(item.unitPrice || 0) *
      Number(item.quantity || 0) *
      assignedDayCount
    );
  };

  const getItemPerDeliveryTotal = (item: SelectedAddItem) =>
    Number(item.unitPrice || 0) * Number(item.quantity || 0);

  const selectedPerDeliveryTotal = useMemo(
    () =>
      selectedList.reduce(
        (sum, item) => sum + getItemPerDeliveryTotal(item),
        0,
      ),
    [selectedList],
  );

  const selectedChargeTotal = useMemo(
    () =>
      selectedList.reduce((sum, item) => sum + getItemAssignedTotal(item), 0),
    [selectedList, selectedAddDays, isMultiDayWeekly],
  );

  const renderDayAssignment = (variantId?: string) => {
    if (!isMultiDayWeekly || !variantId) return null;

    const assignedDays = Array.isArray(selectedAddDays[variantId])
      ? selectedAddDays[variantId]
      : [];
    const isAssigned = assignedDays.length > 0;

    return (
      <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
            Assign to delivery days
          </p>
          <span className="text-[11px] text-muted-foreground">
            {isAssigned
              ? formatDeliveryDayCount(assignedDays)
              : "Choose day(s)"}
          </span>
        </div>

        {isAssigned ? (
          <div className="flex flex-wrap gap-1.5">
            {deliveryDays.map((day) => {
              const active = assignedDays.includes(day);
              return (
                <button
                  key={`${variantId}:${day}`}
                  type="button"
                  onClick={() => {
                    setSelectedAddDays((prev) => {
                      const current = Array.isArray(prev[variantId])
                        ? prev[variantId]
                        : [];
                      const hasDay = current.includes(day);
                      return {
                        ...prev,
                        [variantId]: hasDay
                          ? current.filter((d) => d !== day)
                          : [...current, day],
                      };
                    });
                  }}
                  className={`px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
                    active
                      ? "border-forest bg-forest text-primary-foreground"
                      : "border-border hover:border-forest/40 text-foreground"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed">
            Add this product, then choose which delivery day(s) it should be on.
          </p>
        )}
      </div>
    );
  };

  const handleSaveSelectedProducts = async () => {
    if (!id || selectedList.length === 0) return;

    try {
      setSaving(true);
      setError(null);

      if (isMultiDayWeekly && subscriptionSnapshot) {
        const sourcePlans =
          cutoff?.isPastCutoff &&
          subscriptionSnapshot.pendingChanges?.deliveryDayPlans?.length
            ? subscriptionSnapshot.pendingChanges.deliveryDayPlans
            : subscriptionSnapshot.deliveryDayPlans;

        const planByDay = new Map<number, Map<string, number>>();

        if (Array.isArray(sourcePlans) && sourcePlans.length > 0) {
          for (const plan of sourcePlans) {
            const perVariant = new Map<string, number>();
            for (const existingItem of plan.items || []) {
              perVariant.set(
                String(existingItem.variant),
                Number(existingItem.quantity || 0),
              );
            }
            planByDay.set(Number(plan.day), perVariant);
          }
        } else {
          const fallbackItems =
            cutoff?.isPastCutoff && subscriptionSnapshot.pendingChanges?.items
              ? subscriptionSnapshot.pendingChanges.items
              : subscriptionSnapshot.items;
          for (const dayIndex of selectedDayIndexes) {
            const perVariant = new Map<string, number>();
            for (const existingItem of fallbackItems || []) {
              const variantId = String(existingItem.variant || "");
              if (!variantId) continue;
              perVariant.set(variantId, Number(existingItem.quantity || 0));
            }
            planByDay.set(dayIndex, perVariant);
          }
        }

        for (const addItem of selectedList) {
          const dayNames = Array.isArray(selectedAddDays[addItem.variantId])
            ? selectedAddDays[addItem.variantId]
            : [];
          if (!dayNames.length) {
            throw new Error(
              `Please choose at least one delivery day for ${addItem.variantName}.`,
            );
          }

          for (const dayName of dayNames) {
            const dayIndex = dayNameToIndex(dayName);
            if (!selectedDayIndexes.includes(dayIndex)) {
              throw new Error(
                `Please choose a valid delivery day for ${addItem.variantName}.`,
              );
            }

            const perVariant =
              planByDay.get(dayIndex) || new Map<string, number>();
            perVariant.set(
              addItem.variantId,
              (perVariant.get(addItem.variantId) || 0) +
                Number(addItem.quantity || 0),
            );
            planByDay.set(dayIndex, perVariant);
          }
        }

        const deliveryDayPlans = selectedDayIndexes.map((dayIndex) => {
          const perVariant =
            planByDay.get(dayIndex) || new Map<string, number>();
          const items = Array.from(perVariant.entries())
            .map(([variantId, quantity]) => ({ variantId, quantity }))
            .filter((item) => item.quantity > 0);

          if (items.length === 0) {
            throw new Error(
              `Please keep at least one product in ${toDayName(dayIndex)} delivery order.`,
            );
          }

          return { day: dayIndex, items };
        });

        const changedDeliveryDays = Array.from(
          new Set(
            selectedList.flatMap((addItem) =>
              Array.isArray(selectedAddDays[addItem.variantId])
                ? selectedAddDays[addItem.variantId].map(dayNameToIndex)
                : [],
            ),
          ),
        );

        await portalSubscriptionsApi.update(id, {
          preferredDeliveryDay: selectedDayIndexes[0],
          preferredDeliveryDays: selectedDayIndexes,
          changedDeliveryDays,
          deliveryDayPlans,
        });
      } else {
        for (const item of selectedList) {
          await portalSubscriptionsApi.addItem(id, {
            variantId: item.variantId,
            quantity: item.quantity,
          });
        }
      }

      navigate(`/portal/subscriptions/${id}`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to add selected products.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto bg-card border border-border rounded-2xl p-8 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading products...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link to={`/portal/subscriptions/${id}`}>
              <ArrowLeft className="h-4 w-4" />
              Back to subscription
            </Link>
          </Button>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Select Products
          </h1>
          <p className="text-sm text-muted-foreground">
            Add products to {subscriptionLabel || "this subscription"}.
          </p>
        </div>
      </div>

      {error && (
        <div
          className="sticky top-[var(--sticky-top)] z-30 mb-4"
          style={{ ["--sticky-top" as string]: `${stickyTopOffset}px` }}
        >
          <Alert
            variant="destructive"
            className="border-destructive/20 bg-background/95 backdrop-blur-sm shadow-sm"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ShopPage
            embedded
            hideCardQuantityStepper
            contentGapClassName="flex flex-col lg:flex-row gap-4"
            productGridClassName="grid grid-cols-1 sm:grid-cols-2 gap-6"
            sidebarStickyTopOffset={stickyTopOffset}
            cardActionLabel={({ lockedVariantId }) =>
              lockedVariantId && selectedAdds[lockedVariantId]
                ? "Remove from subscription"
                : "Add to subscription"
            }
            cardActionClassName={({ lockedVariantId }) =>
              lockedVariantId && selectedAdds[lockedVariantId]
                ? "!bg-destructive/10 !text-destructive hover:!bg-destructive/20"
                : undefined
            }
            cardAfterActionContent={({ variant }) =>
              renderDayAssignment(variant?.id)
            }
            onCardAction={({ product, variant, lockedVariantId }) => {
              const variantId = variant?.id ?? lockedVariantId;
              if (!variantId) return;
              toggleVariantSelection(
                variantId,
                product.name,
                variant?.name ?? "",
                Number(variant?.price ?? 0),
              );
            }}
          />
        </div>

        <aside className="sticky bottom-0 z-40 lg:static lg:z-auto lg:col-span-4">
          <div
            className="max-h-[60vh] overflow-y-auto rounded-t-xl shadow-2xl lg:max-h-[calc(100vh-var(--sticky-top)-16px)] lg:overflow-y-auto lg:rounded-none lg:shadow-none lg:sticky lg:top-[var(--sticky-top)]"
            style={
              {
                ["--sticky-top" as string]: `${stickyTopOffset}px`,
              } as React.CSSProperties
            }
          >
            <section className="bg-card border border-border rounded-xl p-4">
              <h2 className="text-base font-semibold text-foreground">
                Selected Products
              </h2>

              {selectedList.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-2">
                  No products selected yet.
                </p>
              ) : (
                <div className="space-y-2 mt-3">
                  {selectedList.map((item) => (
                    <div
                      key={item.variantId}
                      className="border border-border rounded-lg p-2.5 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {item.productName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.variantName}
                          </p>
                          {isMultiDayWeekly && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {getAssignedDayCount(item.variantId)} delivery day
                              {getAssignedDayCount(item.variantId) === 1
                                ? ""
                                : "s"}{" "}
                              selected
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-semibold text-foreground shrink-0">
                          {formatMoney(getItemAssignedTotal(item))}
                        </span>
                      </div>
                      {isMultiDayWeekly && (
                        <div className="text-xs text-muted-foreground">
                          {formatMoney(getItemPerDeliveryTotal(item))} per
                          delivery
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center border border-border rounded-md h-8">
                          <button
                            type="button"
                            className="h-8 w-8 flex items-center justify-center hover:bg-muted"
                            onClick={() =>
                              updateSelectedQty(item.variantId, -1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="h-8 w-8 flex items-center justify-center hover:bg-muted"
                            onClick={() => updateSelectedQty(item.variantId, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            setSelectedAdds((prev) => {
                              const next = { ...prev };
                              delete next[item.variantId];
                              setSelectedAddDays((prevDays) => {
                                const nextDays = { ...prevDays };
                                delete nextDays[item.variantId];
                                return nextDays;
                              });
                              return next;
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {isMultiDayWeekly && (
                        <div className="pt-1 border-t border-border/70 space-y-1.5">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                            Delivery days for this product
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {deliveryDays.map((day) => (
                              <button
                                key={`${item.variantId}:${day}`}
                                type="button"
                                onClick={() => {
                                  setSelectedAddDays((prev) => {
                                    const current = Array.isArray(
                                      prev[item.variantId],
                                    )
                                      ? prev[item.variantId]
                                      : [];
                                    const hasDay = current.includes(day);

                                    return {
                                      ...prev,
                                      [item.variantId]: hasDay
                                        ? current.filter((d) => d !== day)
                                        : [...current, day],
                                    };
                                  });
                                }}
                                className={`px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
                                  (
                                    selectedAddDays[item.variantId] || []
                                  ).includes(day)
                                    ? "border-forest bg-forest text-primary-foreground"
                                    : "border-border hover:border-forest/40 text-foreground"
                                }`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-border space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Current per delivery
                  </span>
                  <span className="text-foreground">
                    {formatMoney(currentPerDelivery)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Add-on</span>
                  <span className="text-forest font-medium">
                    +{formatMoney(selectedChargeTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-border">
                  <span className="text-sm font-medium text-foreground">
                    New per delivery
                  </span>
                  <span className="text-lg font-semibold text-foreground">
                    {formatMoney(currentPerDelivery + selectedPerDeliveryTotal)}
                  </span>
                </div>
              </div>

              {selectedList.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 leading-relaxed">
                  {isMultiDayWeekly && (
                    <>
                      <span className="block font-medium text-foreground">
                        Assign each product to the day(s) it should appear on.
                      </span>
                      <span className="mt-1 block">
                        Each day has its own cut-off:
                      </span>
                      <span className="mt-2 block space-y-1.5">
                        {deliveryDays.map((dayName) => (
                          <span key={dayName} className="block">
                            <span className="font-semibold text-foreground">
                              {dayName}
                            </span>{" "}
                            <span>
                              {getDayCutoffLabel(
                                dayName,
                                dayNameToIndex(dayName),
                                cutoff!,
                              )}
                            </span>
                          </span>
                        ))}
                      </span>
                    </>
                  )}
                  {cutoff?.isPastCutoff
                    ? isMultiDayWeekly
                      ? `The cut-off for your next deliveries on ${formatDayList(
                          deliveryDays,
                        )} has passed, so these products are added from the delivery after that. You won't be charged now — the new amount of ${formatMoney(
                          currentPerDelivery + selectedPerDeliveryTotal,
                        )} is taken on each delivery going forward.`
                      : formatDeliveryDate(nextDeliveryDate)
                        ? `The cut-off for your next delivery on ${formatDeliveryDate(
                            nextDeliveryDate,
                          )} has passed, so these products are added from the delivery after that. You won't be charged now — the new amount of ${formatMoney(
                            currentPerDelivery + selectedPerDeliveryTotal,
                          )} is taken on each delivery going forward.`
                        : `The cut-off for your next delivery has passed, so these products apply from the following delivery. You won't be charged now.`
                    : isMultiDayWeekly
                      ? `These products are added to your next deliveries on ${formatDayList(
                          deliveryDays,
                        )}. The extra ${formatMoney(
                          selectedChargeTotal,
                        )} is charged to your card now, and ${formatMoney(
                          currentPerDelivery + selectedPerDeliveryTotal,
                        )} is taken on each delivery going forward.`
                      : formatDeliveryDate(nextDeliveryDate)
                        ? `These products are added to your next delivery on ${formatDeliveryDate(
                            nextDeliveryDate,
                          )}. The extra ${formatMoney(
                            selectedChargeTotal,
                          )} is charged to your card now, and ${formatMoney(
                            currentPerDelivery + selectedPerDeliveryTotal,
                          )} is taken on each delivery going forward.`
                        : `These products are added to your next delivery. The extra ${formatMoney(
                            selectedChargeTotal,
                          )} is charged to your card now, and ${formatMoney(
                            currentPerDelivery + selectedPerDeliveryTotal,
                          )} is taken on each delivery going forward.`}
                </p>
              )}

              {hasUnassignedDay && (
                <p className="mt-3 text-xs text-destructive">
                  Choose at least one delivery day for each selected product to
                  continue.
                </p>
              )}

              <Button
                className="w-full mt-3"
                disabled={
                  selectedList.length === 0 || saving || hasUnassignedDay
                }
                onClick={() => void handleSaveSelectedProducts()}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save selected products"
                )}
              </Button>

              <Button asChild variant="outline" className="w-full mt-2">
                <Link to="/portal/payments">Update payment</Link>
              </Button>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SubscriptionAddProductsPage;

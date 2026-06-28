import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";import { ArrowLeft, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShopPage from "@/pages/ShopPage";
import { ApiError } from "@/api/client";
import {
  portalSubscriptionsApi,
  type PortalSubscriptionCutoff,
} from "@/api/portalSubscriptions";

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

const SubscriptionAddProductsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [subscriptionLabel, setSubscriptionLabel] = useState("");
  const [nextDeliveryDate, setNextDeliveryDate] = useState<string | null>(null);
  const [currentPerDelivery, setCurrentPerDelivery] = useState(0);
  const [cutoff, setCutoff] = useState<PortalSubscriptionCutoff | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAdds, setSelectedAdds] = useState<
    Record<string, SelectedAddItem>
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

        const subscription = (subRes as any)?.data?.subscription;
        const label =
          subscription?.subscriptionNumber ||
          `Subscription ${String(subscription?._id || id)
            .slice(-6)
            .toUpperCase()}`;
        setSubscriptionLabel(label);
        setNextDeliveryDate(subscription?.nextDeliveryDate ?? null);
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
        setError(
          err instanceof ApiError ? err.message : "Failed to load products.",
        );
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

  const selectedTotal = useMemo(
    () =>
      selectedList.reduce(
        (sum, item) =>
          sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0,
      ),
    [selectedList],
  );

  const handleSaveSelectedProducts = async () => {
    if (!id || selectedList.length === 0) return;

    try {
      setSaving(true);
      setError(null);

      for (const item of selectedList) {
        await portalSubscriptionsApi.addItem(id, {
          variantId: item.variantId,
          quantity: item.quantity,
        });
      }

      navigate(`/portal/subscriptions/${id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to add selected products.",
      );
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
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
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
            style={{ ["--sticky-top" as string]: `${stickyTopOffset}px` } as React.CSSProperties}
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
                        </div>
                        <span className="text-sm font-semibold text-foreground shrink-0">
                          {formatMoney(item.quantity * item.unitPrice)}
                        </span>
                      </div>
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
                              return next;
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
                    +{formatMoney(selectedTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-border">
                  <span className="text-sm font-medium text-foreground">
                    New per delivery
                  </span>
                  <span className="text-lg font-semibold text-foreground">
                    {formatMoney(currentPerDelivery + selectedTotal)}
                  </span>
                </div>
              </div>

              {selectedList.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 leading-relaxed">
                  {cutoff?.isPastCutoff
                    ? formatDeliveryDate(nextDeliveryDate)
                      ? `The cut-off for your next delivery on ${formatDeliveryDate(
                          nextDeliveryDate,
                        )} has passed, so these products are added from the delivery after that. You won't be charged now — the new amount of ${formatMoney(
                          currentPerDelivery + selectedTotal,
                        )} is taken on each delivery going forward.`
                      : `The cut-off for your next delivery has passed, so these products apply from the following delivery. You won't be charged now.`
                    : formatDeliveryDate(nextDeliveryDate)
                      ? `These products are added to your next delivery on ${formatDeliveryDate(
                          nextDeliveryDate,
                        )}. The extra ${formatMoney(
                          selectedTotal,
                        )} is charged to your card now, and ${formatMoney(
                          currentPerDelivery + selectedTotal,
                        )} is taken on each delivery going forward.`
                      : `These products are added to your next delivery. The extra ${formatMoney(
                          selectedTotal,
                        )} is charged to your card now, and ${formatMoney(
                          currentPerDelivery + selectedTotal,
                        )} is taken on each delivery going forward.`}
                </p>
              )}

              <Button
                className="w-full mt-3"
                disabled={selectedList.length === 0 || saving}
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
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SubscriptionAddProductsPage;

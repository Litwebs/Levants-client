import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api, { ApiError } from "@/api/client";
import {
  portalSubscriptionsApi,
  type PortalSubscriptionCutoff,
} from "@/api/portalSubscriptions";

type ApiVariant = {
  id: string;
  name: string;
  price: number;
  thumbnailImage?: { url: string } | null;
};

type ApiProduct = {
  id: string;
  name: string;
  category?: string;
  thumbnailImage?: { url: string } | null;
  variants: ApiVariant[];
};

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
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [pickerState, setPickerState] = useState<
    Record<string, { variantId: string; qty: number }>
  >({});
  const [selectedAdds, setSelectedAdds] = useState<
    Record<string, SelectedAddItem>
  >({});

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [subRes, productsRes] = await Promise.all([
          portalSubscriptionsApi.get(id),
          api.get<{ data?: { items?: ApiProduct[] } }>("/products", {
            page: 1,
            pageSize: 50,
          }),
        ]);

        if (cancelled) return;

        const subscription = (subRes as any)?.data?.subscription;
        const label =
          subscription?.subscriptionNumber ||
          `Subscription ${String(subscription?._id || id)
            .slice(-6)
            .toUpperCase()}`;
        setSubscriptionLabel(label);
        setNextDeliveryDate(subscription?.nextDeliveryDate ?? null);
        setCutoff(((subRes as any)?.data?.cutoff as PortalSubscriptionCutoff) || null);
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
        setProducts(productsRes?.data?.items ?? []);
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

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          products
            .map((p) => p.category)
            .filter((c): c is string => Boolean(c)),
        ),
      ).sort(),
    ],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products
      .filter((p) => (p.variants?.length ?? 0) > 0)
      .filter((p) => category === "All" || p.category === category)
      .filter((p) => {
        if (!query) return true;
        const haystack = `${p.name} ${p.category ?? ""} ${p.variants
          .map((v) => v.name)
          .join(" ")}`.toLowerCase();
        return haystack.includes(query);
      });
  }, [products, category, search]);

  const getPicker = (product: ApiProduct) => {
    const state = pickerState[product.id];
    const fallbackVariantId = product.variants[0]?.id ?? "";
    const variantId =
      state?.variantId && product.variants.some((v) => v.id === state.variantId)
        ? state.variantId
        : fallbackVariantId;
    const qty = Math.max(1, Number(state?.qty || 1));
    return { variantId, qty };
  };

  const addToSelection = (product: ApiProduct) => {
    const picker = getPicker(product);
    const variant = product.variants.find((v) => v.id === picker.variantId);
    if (!variant) return;

    setSelectedAdds((prev) => {
      const existing = prev[variant.id];
      return {
        ...prev,
        [variant.id]: {
          variantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          quantity: (existing?.quantity || 0) + picker.qty,
          unitPrice: Number(variant.price || 0),
        },
      };
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
      <div className="max-w-5xl mx-auto bg-card border border-border rounded-2xl p-8 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading products...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <section className="bg-card border border-border rounded-xl p-4">
            <div className="relative mb-3">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                placeholder="Search products..."
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  size="sm"
                  variant={category === cat ? "default" : "outline"}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </section>

          <section className="bg-card border border-border rounded-xl p-4">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm mt-1">
                  Try adjusting your search or category filter
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Showing {filteredProducts.length} items
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const picker = getPicker(product);
                const activeVariant =
                  product.variants.find((v) => v.id === picker.variantId) ||
                  product.variants[0];

                return (
                  <div
                    key={product.id}
                    className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-md transition-shadow flex flex-col"
                  >
                    {/* Image */}
                    <div className="aspect-square bg-muted overflow-hidden block">
                      <img
                        src={
                          product.thumbnailImage?.url ||
                          activeVariant?.thumbnailImage?.url ||
                          "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80";
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-xs text-muted-foreground">
                          {product.category}
                        </p>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground leading-tight mb-1">
                        {product.name}
                      </h3>

                      {product.variants.length > 1 ? (
                        <div className="mb-2">
                          <Select
                            value={picker.variantId}
                            onValueChange={(value) =>
                              setPickerState((prev) => ({
                                ...prev,
                                [product.id]: {
                                  variantId: value,
                                  qty: prev[product.id]?.qty || 1,
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {product.variants.map((variant) => (
                                <SelectItem key={variant.id} value={variant.id}>
                                  {variant.name} - {formatMoney(variant.price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2 flex-1">
                          {activeVariant?.name}
                        </p>
                      )}

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-foreground">
                          {formatMoney(activeVariant?.price || 0)}
                        </span>
                      </div>

                      <div className="flex gap-1.5">
                        <div className="flex items-center border border-border rounded-md h-8 shrink-0">
                          <button
                            type="button"
                            className="h-8 w-7 flex items-center justify-center hover:bg-muted"
                            onClick={() =>
                              setPickerState((prev) => ({
                                ...prev,
                                [product.id]: {
                                  variantId: picker.variantId,
                                  qty: Math.max(1, picker.qty - 1),
                                },
                              }))
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-medium">
                            {picker.qty}
                          </span>
                          <button
                            type="button"
                            className="h-8 w-7 flex items-center justify-center hover:bg-muted"
                            onClick={() =>
                              setPickerState((prev) => ({
                                ...prev,
                                [product.id]: {
                                  variantId: picker.variantId,
                                  qty: picker.qty + 1,
                                },
                              }))
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs"
                          type="button"
                          onClick={() => addToSelection(product)}
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
                </div>
              </>
            )}
          </section>
        </div>

        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-6">
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
                      className="border border-border rounded-lg p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.variantName} · Qty {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {formatMoney(item.quantity * item.unitPrice)}
                        </span>
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

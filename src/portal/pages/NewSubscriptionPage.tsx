import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  Search,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddresses } from "@/portal/context/AddressesContext";
import { cn } from "@/lib/utils";
import api, { ApiError } from "@/api/client";
import { portalSubscriptionsApi } from "@/api/portalSubscriptions";
import {
  portalPaymentsApi,
  type PortalPaymentMethod,
} from "@/api/portalPayments";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// ── API types ────────────────────────────────────────────────────────────────
interface ApiVariant {
  id: string;
  name: string;
  price: number;
  currency: string;
  stockQuantity: number;
  lowStock: boolean;
  thumbnailImage?: { url: string } | null;
}

interface ApiProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnailImage?: { url: string } | null;
  variants: ApiVariant[];
  pricing: { min: number; max: number; currency: string };
}

const fmt = (n: number) => `£${n.toFixed(2)}`;

const steps = [
  "Select Products",
  "Quantities & Variants",
  "Delivery Frequency",
  "Delivery Day",
  "Delivery Address",
  "Review & Confirm",
];

const paymentElementOptions = {
  layout: "tabs" as const,
  // Limit to card + wallets — excludes Stripe Link / Onelink entirely
  paymentMethodOrder: ["apple_pay", "google_pay", "card"],
  wallets: { applePay: "auto" as const, googlePay: "auto" as const },
  terms: {
    card: "never" as const,
    applePay: "never" as const,
    googlePay: "never" as const,
  },
};

/**
 * Build a Stripe appearance object from the app's live CSS custom properties.
 * Called once per Elements mount so it picks up the current light/dark mode.
 */
function buildStripeAppearance(): object {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string) => `hsl(${s.getPropertyValue(name).trim()})`;

  return {
    theme: "none",
    variables: {
      colorBackground: v("--background"),
      colorText: v("--foreground"),
      colorTextSecondary: v("--muted-foreground"),
      colorTextPlaceholder: v("--muted-foreground"),
      colorPrimary: v("--forest"),
      colorDanger: v("--destructive"),
      colorIconTab: v("--muted-foreground"),
      colorIconTabSelected: v("--forest"),
      borderRadius: "12px",
      fontSizeBase: "14px",
      fontFamily: "inherit",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": {
        backgroundColor: v("--background"),
        border: `1px solid hsl(${s.getPropertyValue("--border").trim()})`,
        borderRadius: "10px",
        color: v("--foreground"),
        padding: "10px 12px",
        boxShadow: "none",
        outline: "none",
      },
      ".Input:focus": {
        border: `1px solid hsl(${s.getPropertyValue("--forest").trim()} / 0.7)`,
        boxShadow: "none",
        outline: "none",
      },
      ".Input--invalid": {
        border: `1px solid hsl(${s.getPropertyValue("--destructive").trim()})`,
      },
      ".Label": {
        color: v("--muted-foreground"),
        fontSize: "11px",
        fontWeight: "500",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        marginBottom: "6px",
      },
      ".Tab": {
        backgroundColor: v("--card"),
        border: `1px solid hsl(${s.getPropertyValue("--border").trim()})`,
        borderRadius: "10px",
        color: v("--muted-foreground"),
        boxShadow: "none",
      },
      ".Tab:hover": {
        border: `1px solid hsl(${s.getPropertyValue("--forest").trim()} / 0.5)`,
        color: v("--foreground"),
      },
      ".Tab--selected": {
        backgroundColor: v("--card"),
        border: `1px solid hsl(${s.getPropertyValue("--forest").trim()})`,
        color: v("--forest"),
        boxShadow: "none",
      },
      ".TabIcon--selected": {
        fill: v("--forest"),
      },
      ".TabLabel--selected": {
        color: v("--forest"),
      },
      ".Block": {
        backgroundColor: v("--card"),
        border: `1px solid hsl(${s.getPropertyValue("--border").trim()})`,
        borderRadius: "12px",
        boxShadow: "none",
      },
      ".CheckboxInput": {
        backgroundColor: v("--background"),
        border: `1px solid hsl(${s.getPropertyValue("--border").trim()})`,
        borderRadius: "4px",
      },
      ".CheckboxInput--checked": {
        backgroundColor: v("--forest"),
        border: `1px solid hsl(${s.getPropertyValue("--forest").trim()})`,
      },
    },
  };
}

const cardBrandLabel = (brand?: string | null) => {
  const map: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "Amex",
    discover: "Discover",
    jcb: "JCB",
    unionpay: "UnionPay",
    unknown: "Card",
  };
  return map[brand?.toLowerCase() ?? ""] ?? brand ?? "Card";
};

const fmtMethod = (pm: PortalPaymentMethod) =>
  `${cardBrandLabel(pm.cardBrand)} ···· ${pm.lastFour ?? "----"}  exp ${
    pm.expiryMonth ? String(pm.expiryMonth).padStart(2, "0") : "--"
  }/${pm.expiryYear ? String(pm.expiryYear).slice(-2) : "--"}`;

const SubscriptionPaymentForm: React.FC<{
  onComplete: (paymentMethodId: string) => Promise<void>;
  onError: (message: string) => void;
  submitLoading?: boolean;
}> = ({ onComplete, onError, submitLoading = false }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    try {
      setLoading(true);
      const result = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (result.error) {
        onError(result.error.message || "Failed to save payment method.");
        return;
      }

      const paymentMethodId = result.setupIntent?.payment_method;
      if (typeof paymentMethodId !== "string") {
        onError("Stripe did not return a payment method.");
        return;
      }

      await onComplete(paymentMethodId);
    } catch {
      onError("Failed to save payment method. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <PaymentElement options={paymentElementOptions} />
      <Button
        type="submit"
        className="w-full mt-1"
        disabled={!stripe || loading || submitLoading}
      >
        {loading || submitLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {submitLoading ? "Subscribing…" : "Saving…"}
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            Save &amp; Subscribe
          </>
        )}
      </Button>
    </form>
  );
};

const DRAFT_KEY = "levants_subscription_draft";

function readDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const NewSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const draft = readDraft();
  const [step, setStep] = useState(() => Number(draft?.step ?? 0));

  // ── Product data from API ─────────────────────────────────────────────────
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableDays, setAvailableDays] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const json = await api.get<{ data: { items: ApiProduct[] } }>(
          "/products",
          { page: 1, pageSize: 50 },
        );
        if (!cancelled) setProducts(json?.data?.items ?? []);
      } catch (err) {
        if (!cancelled)
          setProductError("Could not load products. Please try again.");
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    };
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const fetchSettings = async () => {
      try {
        const res = await portalSubscriptionsApi.getSettings();
        const days = (res as any)?.data?.settings?.deliveryDays as
          | number[]
          | undefined;
        if (cancelled || !Array.isArray(days) || days.length === 0) return;
        const names = days
          .map((d) => dayNames[d])
          .filter((n): n is string => Boolean(n));
        setAvailableDays(names);
        setDeliveryDay((prev) => (names.includes(prev) ? prev : names[0]));
      } catch {
        /* fall back to default day list */
      }
    };
    void fetchSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Wizard state ─────────────────────────────────────────────────────────
  const {
    addresses,
    loading: addressesLoading,
    fetchAddresses,
  } = useAddresses();
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    () => (draft?.selectedProducts as string[] | undefined) ?? [],
  );
  const [quantities, setQuantities] = useState<
    Record<string, { qty: number; variantIdx: number }>
  >(
    () =>
      (draft?.quantities as
        | Record<string, { qty: number; variantIdx: number }>
        | undefined) ?? {},
  );
  const [frequency, setFrequency] = useState(
    () => (draft?.frequency as string | undefined) ?? "weekly",
  );
  const [deliveryDay, setDeliveryDay] = useState(
    () => (draft?.deliveryDay as string | undefined) ?? "Tuesday",
  );
  const [selectedAddress, setSelectedAddress] = useState<string>(
    () => (draft?.selectedAddress as string | undefined) ?? "",
  );
  const [subscriptionName, setSubscriptionName] = useState(
    () => (draft?.subscriptionName as string | undefined) ?? "",
  );
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Dark-mode watcher — remounts Stripe Elements when theme toggles ────
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // ── Payment state ──────────────────────────────────────────────────────
  const [savedMethods, setSavedMethods] = useState<PortalPaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  // ID of the method the customer picks to use for this subscription
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  // Whether the "add new" Stripe form is expanded
  const [showNewForm, setShowNewForm] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(
    null,
  );
  const [stripePromise, setStripePromise] = useState<ReturnType<
    typeof loadStripe
  > | null>(null);

  const loadSavedMethods = async () => {
    try {
      setMethodsLoading(true);
      const res = await portalPaymentsApi.listPaymentMethods();
      const methods: PortalPaymentMethod[] =
        (res as any)?.data?.paymentMethods ?? [];
      setSavedMethods(methods);
      // Auto-select the default method
      const def = methods.find((m) => m.isDefault) ?? methods[0] ?? null;
      if (def) setSelectedMethodId(def._id);
    } catch {
      setSavedMethods([]);
    } finally {
      setMethodsLoading(false);
    }
  };

  useEffect(() => {
    void loadSavedMethods();
  }, []);

  // Load a fresh SetupIntent when the new-payment form becomes visible
  useEffect(() => {
    const needsForm = (showNewForm || savedMethods.length === 0) && step === 5;
    if (!needsForm) return;
    if (setupClientSecret) return; // already loaded

    let cancelled = false;

    const loadSetupIntent = async () => {
      try {
        setSetupLoading(true);
        const res = await portalPaymentsApi.createSetupIntent();
        const data = (res as any)?.data;
        const publishableKey = String(data?.publishableKey || "");
        const clientSecret = String(data?.clientSecret || "");
        if (!publishableKey || !clientSecret) {
          throw new Error("Stripe setup data missing");
        }

        if (!cancelled) {
          setStripePromise(loadStripe(publishableKey));
          setSetupClientSecret(clientSecret);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof ApiError
              ? err.message
              : "Failed to initialize payment options.";
          setSubmitError(msg);
          setSetupClientSecret(null);
        }
      } finally {
        if (!cancelled) setSetupLoading(false);
      }
    };

    void loadSetupIntent();

    return () => {
      cancelled = true;
    };
  }, [showNewForm, savedMethods.length, step, setupClientSecret]);

  // Fetch addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Set default address when addresses load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find((a) => a.isDefault);
      setSelectedAddress(defaultAddr?._id ?? addresses[0]?._id ?? "");
    }
  }, [addresses, selectedAddress]);

  const toggleProduct = (id: string) =>
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  // Persist draft on every relevant state change
  useEffect(() => {
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          step,
          selectedProducts,
          quantities,
          frequency,
          deliveryDay,
          selectedAddress,
          subscriptionName,
        }),
      );
    } catch {
      // storage quota exceeded — ignore
    }
  }, [
    step,
    selectedProducts,
    quantities,
    frequency,
    deliveryDay,
    selectedAddress,
    subscriptionName,
  ]);

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  };

  const handleNext = () => setStep((s) => Math.min(steps.length - 1, s + 1));
  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category))).sort(),
  ];
  const filteredProducts = products
    .filter((p) => categoryFilter === "All" || p.category === categoryFilter)
    .filter(
      (p) =>
        searchQuery.trim() === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const selectedProductObjects = products.filter((p) =>
    selectedProducts.includes(p.id),
  );

  const frequencyToApi = (value: string) => {
    if (value === "fortnightly") return "every_two_weeks";
    if (value === "monthly") return "monthly";
    return "weekly";
  };

  const dayToIndex = (value: string) => {
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

  const buildSubscriptionPayload = () => {
    if (!selectedAddress) {
      throw new Error("Please select a delivery address.");
    }

    if (selectedProductObjects.length === 0) {
      throw new Error("Please select at least one product.");
    }

    const items = selectedProductObjects.map((product) => {
      const variantIdx = quantities[product.id]?.variantIdx ?? 0;
      const qty = Math.max(1, quantities[product.id]?.qty ?? 1);
      const variant = product.variants[variantIdx] || product.variants[0];

      return {
        variantId: variant.id,
        quantity: qty,
      };
    });

    return {
      frequency: frequencyToApi(frequency) as
        | "weekly"
        | "every_two_weeks"
        | "monthly",
      preferredDeliveryDay: dayToIndex(deliveryDay),
      deliveryAddressId: selectedAddress,
      notes: subscriptionName || undefined,
      items,
    };
  };

  const completeSubscription = async () => {
    const payload = buildSubscriptionPayload();
    await portalSubscriptionsApi.create(payload);
    clearDraft();
    navigate("/portal/subscriptions");
  };

  // Use an existing saved method and complete subscription
  const handleCreateSubscription = async () => {
    try {
      setSubmitLoading(true);
      setSubmitError(null);
      if (!selectedMethodId) {
        throw new Error(
          "Please select or add a payment method before subscribing.",
        );
      }
      // Ensure the selected method is the Stripe default
      await portalPaymentsApi.setDefaultPaymentMethod(selectedMethodId);
      await completeSubscription();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to create subscription.";
      setSubmitError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Save a brand-new method from the Stripe form, then complete subscription
  const handleSaveAndSubscribe = async (paymentMethodId: string) => {
    try {
      setSubmitLoading(true);
      setSubmitError(null);
      await portalPaymentsApi.attachPaymentMethod({
        stripePaymentMethodId: paymentMethodId,
        setDefault: true,
      });
      await loadSavedMethods();
      await completeSubscription();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to save payment method and complete subscription.";
      setSubmitError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={
            step === 0 ? () => navigate("/portal/subscriptions") : handleBack
          }
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            New Subscription
          </h1>
          <p className="text-xs text-muted-foreground">
            Step {step + 1} of {steps.length}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-0 mb-8 overflow-x-auto">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors",
                  i < step
                    ? "bg-forest border-forest text-primary-foreground"
                    : i === step
                      ? "border-forest text-forest"
                      : "border-muted-foreground/30 text-muted-foreground/30",
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className="text-[9px] mt-1 text-muted-foreground text-center leading-tight w-14 hidden sm:block">
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 min-w-[12px] mb-4",
                  i < step ? "bg-forest" : "bg-border",
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        {/* Step 0: Select Products */}
        {step === 0 && (
          <div className="flex flex-col">
            <h2 className="font-semibold text-foreground mb-1">
              Select Products
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              Choose the products you'd like in your subscription.
            </p>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search products…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Category filter */}
            <div className="flex gap-1.5 flex-wrap mb-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                    categoryFilter === cat
                      ? "bg-forest text-primary-foreground border-forest"
                      : "border-border text-muted-foreground hover:border-forest/40",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product list */}
            {loadingProducts ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading products…</span>
              </div>
            ) : productError ? (
              <div className="flex items-center gap-2 py-8 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {productError}
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[560px] -mx-1 px-1 pr-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {filteredProducts.map((product) => {
                    const selected = selectedProducts.includes(product.id);
                    return (
                      <div
                        key={product.id}
                        className={cn(
                          "relative rounded-xl border transition-colors flex flex-col overflow-hidden",
                          selected
                            ? "border-forest bg-forest/5"
                            : "border-border",
                        )}
                      >
                        {/* Thumbnail */}
                        <div className="w-full aspect-square bg-muted overflow-hidden">
                          {product.thumbnailImage?.url ? (
                            <img
                              src={product.thumbnailImage.url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-2 flex-1 flex flex-col gap-1">
                          <p className="text-xs font-medium text-foreground leading-tight line-clamp-2 flex-1">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {product.pricing.min === product.pricing.max
                              ? fmt(product.pricing.min)
                              : `${fmt(product.pricing.min)}+`}
                          </p>
                          {/* Add / Remove button */}
                          <button
                            onClick={() => toggleProduct(product.id)}
                            className={cn(
                              "mt-1 w-full rounded-lg py-2 text-xs font-bold transition-colors",
                              selected
                                ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                                : "bg-forest text-white hover:bg-forest/90",
                            )}
                          >
                            {selected ? "Remove" : "Add to plan"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <p className="col-span-3 text-sm text-muted-foreground py-6 text-center">
                      No products match your search.
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedProducts.length > 0 && (
              <p className="text-xs text-forest font-medium mt-3">
                {selectedProducts.length} product
                {selectedProducts.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        )}

        {/* Step 1: Quantities */}
        {step === 1 && (
          <div>
            <h2 className="font-semibold text-foreground mb-1">
              Quantities & Variants
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose the size and quantity for each product.
            </p>
            {selectedProductObjects.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No products selected. Go back and select some.
              </p>
            ) : (
              <div className="space-y-4">
                {selectedProductObjects.map((product) => (
                  <div
                    key={product.id}
                    className="border border-border rounded-xl p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      {product.thumbnailImage?.url && (
                        <img
                          src={product.thumbnailImage.url}
                          alt={product.name}
                          className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <p className="text-sm font-medium text-foreground">
                        {product.name}
                      </p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Variant</p>
                        <Select
                          value={String(
                            quantities[product.id]?.variantIdx ?? 0,
                          )}
                          onValueChange={(v) =>
                            setQuantities((prev) => ({
                              ...prev,
                              [product.id]: {
                                qty: prev[product.id]?.qty ?? 1,
                                variantIdx: Number(v),
                              },
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {product.variants.map((v, i) => (
                              <SelectItem key={v.id} value={String(i)}>
                                {v.name} · {fmt(v.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Quantity
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                            onClick={() =>
                              setQuantities((prev) => ({
                                ...prev,
                                [product.id]: {
                                  variantIdx: prev[product.id]?.variantIdx ?? 0,
                                  qty: Math.max(
                                    1,
                                    (prev[product.id]?.qty ?? 1) - 1,
                                  ),
                                },
                              }))
                            }
                          >
                            <span className="text-sm">-</span>
                          </button>
                          <span className="text-sm font-medium w-5 text-center">
                            {quantities[product.id]?.qty ?? 1}
                          </span>
                          <button
                            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                            onClick={() =>
                              setQuantities((prev) => ({
                                ...prev,
                                [product.id]: {
                                  variantIdx: prev[product.id]?.variantIdx ?? 0,
                                  qty: (prev[product.id]?.qty ?? 1) + 1,
                                },
                              }))
                            }
                          >
                            <span className="text-sm">+</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Frequency */}
        {step === 2 && (
          <div>
            <h2 className="font-semibold text-foreground mb-1">
              Delivery Frequency
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              How often would you like deliveries?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "weekly", label: "Weekly", desc: "Every week" },
                {
                  value: "fortnightly",
                  label: "Every 2 weeks",
                  desc: "Fortnightly",
                },
                { value: "monthly", label: "Monthly", desc: "Once a month" },
                {
                  value: "custom",
                  label: "Custom",
                  desc: "Set your own schedule",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFrequency(opt.value)}
                  disabled={opt.value === "custom"}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-colors",
                    frequency === opt.value
                      ? "border-forest bg-forest/5"
                      : "border-border hover:border-forest/40",
                    opt.value === "custom" && "opacity-40 cursor-not-allowed",
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Delivery Day */}
        {step === 3 && (
          <div>
            <h2 className="font-semibold text-foreground mb-1">
              Preferred Delivery Day
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Which day would you prefer for deliveries?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(
                availableDays ?? [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ]
              ).map((day) => (
                <button
                  key={day}
                  onClick={() => setDeliveryDay(day)}
                  className={cn(
                    "p-3 rounded-xl border text-sm font-medium transition-colors",
                    deliveryDay === day
                      ? "border-forest bg-forest text-primary-foreground"
                      : "border-border hover:border-forest/40",
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Address */}
        {step === 4 && (
          <div>
            <h2 className="font-semibold text-foreground mb-1">
              Delivery Address
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Where should we deliver?
            </p>
            {addressesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                <p>No saved addresses yet.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {addresses.map((addr) => (
                    <button
                      key={addr._id}
                      onClick={() => setSelectedAddress(addr._id ?? "")}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-colors",
                        selectedAddress === addr._id
                          ? "border-forest bg-forest/5"
                          : "border-border hover:border-forest/40",
                      )}
                    >
                      <p className="text-sm font-medium">
                        {addr.fullName || "Unnamed"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {addr.line1}, {addr.city}, {addr.postcode}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to="/portal/addresses">Add new address</Link>
            </Button>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div>
            <h2 className="font-semibold text-foreground mb-1">
              Review & Confirm
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Check your subscription details before confirming.
            </p>

            <div className="space-y-1.5 mb-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Subscription name (optional)
              </label>
              <Input
                placeholder="e.g. Weekly Essentials"
                value={subscriptionName}
                onChange={(e) => setSubscriptionName(e.target.value)}
              />
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Products</span>
                <span className="font-medium">
                  {selectedProductObjects.map((p) => p.name).join(", ") ||
                    "None"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Frequency</span>
                <span className="font-medium capitalize">
                  {frequency === "fortnightly" ? "Every 2 weeks" : frequency}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Delivery day</span>
                <span className="font-medium">{deliveryDay}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Address</span>
                <span className="font-medium text-right max-w-[60%]">
                  {addresses.find((a) => a._id === selectedAddress)?.line1 ??
                    "—"}
                </span>
              </div>
            </div>

            {/* ── Payment method ───────────────────────────────────────── */}
            <div className="mt-5 rounded-2xl border border-border bg-background/70 p-4 space-y-3">
              <h3 className="font-semibold text-foreground">Payment method</h3>

              {methodsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading saved methods…
                </div>
              ) : savedMethods.length > 0 ? (
                <div className="space-y-2">
                  {savedMethods.map((pm) => (
                    <button
                      key={pm._id}
                      type="button"
                      onClick={() => {
                        setSelectedMethodId(pm._id);
                        setShowNewForm(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
                        selectedMethodId === pm._id && !showNewForm
                          ? "border-forest bg-forest/5"
                          : "border-border hover:border-forest/40",
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                          selectedMethodId === pm._id && !showNewForm
                            ? "border-forest"
                            : "border-muted-foreground/40",
                        )}
                      >
                        {selectedMethodId === pm._id && !showNewForm && (
                          <div className="w-2 h-2 rounded-full bg-forest" />
                        )}
                      </div>
                      <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {fmtMethod(pm)}
                        </p>
                      </div>
                      {pm.isDefault && (
                        <span className="text-[10px] bg-forest/10 text-forest rounded-full px-1.5 py-0.5 font-medium flex-shrink-0">
                          Default
                        </span>
                      )}
                    </button>
                  ))}

                  {/* Add new method toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewForm((v) => !v);
                      if (!showNewForm) setSelectedMethodId(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
                      showNewForm
                        ? "border-forest bg-forest/5"
                        : "border-dashed border-border hover:border-forest/40",
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                        showNewForm
                          ? "border-forest"
                          : "border-muted-foreground/40",
                      )}
                    >
                      {showNewForm && (
                        <div className="w-2 h-2 rounded-full bg-forest" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      + Add new payment method
                    </span>
                  </button>
                </div>
              ) : (
                /* No saved methods — always show the new-method form */
                <p className="text-xs text-muted-foreground">
                  No saved payment methods. Add one below.
                </p>
              )}

              {/* Stripe new-method form */}
              {(showNewForm || savedMethods.length === 0) && (
                <div className="pt-2 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Apple Pay and Google Pay appear automatically when your
                    device and browser support them. Card entry is always
                    available as a fallback.
                    {window.location.protocol !== "https:" && (
                      <span className="block mt-0.5 text-amber-600 dark:text-amber-400">
                        ⚠ Wallet buttons require HTTPS — use the card form on
                        localhost.
                      </span>
                    )}
                  </p>
                  {setupLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Preparing secure payment form…
                    </div>
                  ) : stripePromise && setupClientSecret ? (
                    <Elements
                      key={`${setupClientSecret}-${isDark ? "dark" : "light"}`}
                      stripe={stripePromise}
                      options={{
                        clientSecret: setupClientSecret,
                        appearance: buildStripeAppearance(),
                      }}
                    >
                      <SubscriptionPaymentForm
                        onComplete={handleSaveAndSubscribe}
                        onError={setSubmitError}
                        submitLoading={submitLoading}
                      />
                    </Elements>
                  ) : null}
                </div>
              )}
            </div>

            {submitError && (
              <p className="mt-3 text-sm text-destructive">{submitError}</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={
            step === 0
              ? () => {
                  clearDraft();
                  navigate("/portal/subscriptions");
                }
              : handleBack
          }
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < steps.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={step === 0 && selectedProducts.length === 0}
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={() => void handleCreateSubscription()}
            disabled={submitLoading || showNewForm || !selectedMethodId}
          >
            <Check className="h-4 w-4" />
            {submitLoading ? "Creating..." : "Create Subscription"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default NewSubscriptionPage;

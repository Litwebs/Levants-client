import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAddresses } from "@/portal/context/AddressesContext";
import { cn } from "@/lib/utils";
import api, { ApiError, resolveImageUrl } from "@/api/client";
import { portalSubscriptionsApi } from "@/api/portalSubscriptions";
import {
  portalPaymentsApi,
  type PortalPaymentMethod,
} from "@/api/portalPayments";
import ProductCard from "@/components/products/ProductCard";
import ShopPage from "@/pages/ShopPage";
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

interface FlatVariant {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  price: number;
  image: string | null;
  category: string;
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

  // ── Sticky offsets: measure the real site header + this page's sub-header ──
  // The site header is fully sticky with a variable height (announcement bars),
  // so we measure it at runtime to position our sticky sub-header right below it.
  const subHeaderRef = useRef<HTMLDivElement>(null);
  const [siteHeaderHeight, setSiteHeaderHeight] = useState(0);
  const [subHeaderHeight, setSubHeaderHeight] = useState(0);

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

  useEffect(() => {
    const el = subHeaderRef.current;
    if (!el) return;
    const update = () => setSubHeaderHeight(el.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const subHeaderTopOffset = siteHeaderHeight;

  // ── Product data from API ─────────────────────────────────────────────────
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [availableDays, setAvailableDays] = useState<string[] | null>(null);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setProductError(null);
    try {
      const json = await api.get<{ data: { items: ApiProduct[] } }>(
        "/products",
        { page: 1, pageSize: 50 },
      );
      setProducts(json?.data?.items ?? []);
    } catch {
      setProductError("Could not load products. Please try again.");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    void fetchProducts();
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
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>(
    () => (draft?.selectedVariantIds as string[] | undefined) ?? [],
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(
    () => (draft?.quantities as Record<string, number> | undefined) ?? {},
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

  const toggleVariant = (variantId: string) =>
    setSelectedVariantIds((prev) =>
      prev.includes(variantId)
        ? prev.filter((id) => id !== variantId)
        : [...prev, variantId],
    );

  // Persist draft on every relevant state change
  useEffect(() => {
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          step,
          selectedVariantIds,
          quantities,
          frequency,
          deliveryDay,
          selectedAddress,
        }),
      );
    } catch {
      // storage quota exceeded — ignore
    }
  }, [
    step,
    selectedVariantIds,
    quantities,
    frequency,
    deliveryDay,
    selectedAddress,
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

  const flatVariants: FlatVariant[] = products.flatMap((p) =>
    p.variants.map((v) => ({
      variantId: v.id,
      productId: p.id,
      productName: p.name,
      variantName: v.name,
      price: v.price,
      image: v.thumbnailImage?.url || p.thumbnailImage?.url || null,
      category: p.category,
    })),
  );

  const selectedFlatVariants = flatVariants.filter((v) =>
    selectedVariantIds.includes(v.variantId),
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

    if (selectedFlatVariants.length === 0) {
      throw new Error("Please select at least one product.");
    }

    const items = selectedFlatVariants.map((sv) => ({
      variantId: sv.variantId,
      quantity: Math.max(1, quantities[sv.variantId] ?? 1),
    }));

    return {
      frequency: frequencyToApi(frequency) as
        | "weekly"
        | "every_two_weeks"
        | "monthly",
      preferredDeliveryDay: dayToIndex(deliveryDay),
      deliveryAddressId: selectedAddress,
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
    <div
      className="w-full flex min-h-screen flex-col"
      style={{ minHeight: `calc(100dvh - ${siteHeaderHeight}px)` }}
    >
      <div
        ref={subHeaderRef}
        className="sticky z-30 mb-5 -mx-4 bg-background/95 pt-4 pb-4 backdrop-blur-sm sm:-mx-6 lg:-mx-8"
        style={{ top: subHeaderTopOffset }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={
                step === 0
                  ? () => navigate("/portal/subscriptions")
                  : handleBack
              }
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="font-heading text-base font-bold text-foreground leading-tight">
                New Subscription
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Step {step + 1} of {steps.length}
              </p>
            </div>
            {step === 0 && selectedVariantIds.length > 0 && (
              <span className="text-[11px] text-forest font-medium whitespace-nowrap">
                {selectedVariantIds.length} variant
                {selectedVariantIds.length > 1 ? "s" : ""} selected
              </span>
            )}
          </div>

          {/* Progress */}
          <div className="flex w-full items-start gap-0 max-w-2xl mx-auto pb-1">
            {steps.map((s, i) => (
              <React.Fragment key={i}>
                <div className="flex w-[56px] flex-col items-center flex-shrink-0 sm:w-14">
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
                  <span className="mt-1 w-full px-0.5 text-[7px] text-muted-foreground text-center leading-tight sm:px-1 sm:text-[9px]">
                    {s}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "mt-[14px] flex-1 h-0.5 min-w-[6px] sm:min-w-[12px]",
                      i < step ? "bg-forest" : "bg-border",
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div
        className={cn(
          step === 0
            ? "flex-1 pb-6"
            : "flex-1 bg-card border border-border rounded-2xl p-6 mb-6",
        )}
      >
        {/* Step 0: Select Products */}
        {step === 0 && (
          <div>
            <ShopPage
              embedded
              hideCardQuantityStepper
              contentGapClassName="flex flex-col lg:flex-row gap-4"
              productGridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
              sidebarStickyTopOffset={subHeaderTopOffset + subHeaderHeight + 16}
              cardActionLabel={({ lockedVariantId }) =>
                lockedVariantId && selectedVariantIds.includes(lockedVariantId)
                  ? "Remove from plan"
                  : "Add to plan"
              }
              cardActionClassName={({ lockedVariantId }) =>
                lockedVariantId && selectedVariantIds.includes(lockedVariantId)
                  ? "!bg-destructive/10 !text-destructive hover:!bg-destructive/20"
                  : undefined
              }
              onCardAction={({ variant, lockedVariantId }) => {
                const variantId = variant?.id ?? lockedVariantId;
                if (!variantId) return;
                toggleVariant(variantId);
              }}
            />
          </div>
        )}

        {/* Step 1: Quantities */}
        {step === 1 && (
          <div>
            <h2 className="font-semibold text-foreground mb-1">Quantities</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Set how many of each item you'd like per delivery.
            </p>
            {selectedFlatVariants.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No variants selected. Go back and select some.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedFlatVariants.map((sv) => (
                  <div
                    key={sv.variantId}
                    className="border border-border rounded-xl p-3 flex items-center gap-3"
                  >
                    {sv.image && (
                      <img
                        src={sv.image}
                        alt={sv.variantName}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {sv.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sv.variantName} · {fmt(sv.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                        onClick={() =>
                          setQuantities((prev) => ({
                            ...prev,
                            [sv.variantId]: Math.max(
                              1,
                              (prev[sv.variantId] ?? 1) - 1,
                            ),
                          }))
                        }
                      >
                        <span className="text-sm">-</span>
                      </button>
                      <span className="text-sm font-medium w-5 text-center">
                        {quantities[sv.variantId] ?? 1}
                      </span>
                      <button
                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                        onClick={() =>
                          setQuantities((prev) => ({
                            ...prev,
                            [sv.variantId]: (prev[sv.variantId] ?? 1) + 1,
                          }))
                        }
                      >
                        <span className="text-sm">+</span>
                      </button>
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

            <div className="space-y-3 text-sm">
              <div className="py-1.5 border-b border-border">
                <p className="text-muted-foreground mb-1">Products</p>
                {selectedFlatVariants.length === 0 ? (
                  <p className="font-medium">None</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-1 font-medium">
                    {selectedFlatVariants.map((sv) => (
                      <li key={sv.variantId}>
                        {sv.variantName} x{" "}
                        {Math.max(1, quantities[sv.variantId] ?? 1)}
                      </li>
                    ))}
                  </ul>
                )}
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
      <div className="sticky bottom-0 z-30 mt-6 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="rounded-none border border-border bg-background/95 px-4 py-4 shadow-sm backdrop-blur-sm sm:px-6 lg:px-8">
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
                disabled={step === 0 && selectedVariantIds.length === 0}
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
      </div>
    </div>
  );
};

export default NewSubscriptionPage;

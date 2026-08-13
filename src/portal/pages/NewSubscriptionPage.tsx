import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  ExpressCheckoutElement,
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
const SUBSCRIPTION_DELIVERY_FEE = 1;

const steps = [
  "Delivery Days",
  "Frequency",
  "Products by Day",
  "Delivery Details",
  "Review & Payment",
];

const DRAFT_FLOW_VERSION = 2;

const paymentElementOptions = {
  layout: "tabs" as const,
  // Stripe still decides eligibility; this only controls the preferred order.
  paymentMethodOrder: ["apple_pay", "google_pay", "card"],
  wallets: { applePay: "auto" as const, googlePay: "auto" as const },
  terms: {
    card: "never" as const,
    applePay: "never" as const,
    googlePay: "never" as const,
  },
};

const expressCheckoutOptions = {
  buttonHeight: 48,
  buttonType: {
    applePay: "subscribe" as const,
    googlePay: "subscribe" as const,
  },
  paymentMethods: {
    applePay: "always" as const,
    googlePay: "always" as const,
    amazonPay: "never" as const,
    link: "never" as const,
    paypal: "never" as const,
  },
  layout: {
    maxColumns: 2,
    maxRows: 1,
    overflow: "never" as const,
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

const formatFrequencyLabel = (value: string) => {
  if (value === "fortnightly") return "Every 2 weeks";
  if (value === "monthly") return "Monthly";
  return "Weekly";
};

const formatCycleLabel = (value: string) => {
  if (value === "fortnightly") return "every 2 weeks";
  if (value === "monthly") return "every month";
  return "every week";
};

const getAddressId = (
  address: { _id?: string; id?: string } | null | undefined,
) => address?._id || address?.id || "";

const SubscriptionPaymentForm: React.FC<{
  onComplete: (paymentMethodId: string) => Promise<void>;
  onError: (message: string) => void;
  onSetupExpired: () => void;
  submitLoading?: boolean;
}> = ({ onComplete, onError, onSetupExpired, submitLoading = false }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [elementReady, setElementReady] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [elementError, setElementError] = useState<string | null>(null);
  const [expressCheckoutReady, setExpressCheckoutReady] = useState(false);

  const handleStripeError = (error: { code?: string; message?: string }) => {
    const message = error.message || "Failed to save payment method.";
    const normalizedMessage = message.toLowerCase();
    const setupExpired =
      error.code === "resource_missing" ||
      normalizedMessage.includes("no such setupintent") ||
      normalizedMessage.includes("setup intent has expired") ||
      normalizedMessage.includes("setupintent is in a terminal state") ||
      normalizedMessage.includes("cannot be used to initialize elements");
    if (setupExpired) {
      onSetupExpired();
      onError(
        "Your secure payment session expired. A new form is loading—please enter your card again.",
      );
      return;
    }
    onError(message);
  };

  const confirmPaymentSetup = async (paymentFailed?: () => void) => {
    if (!stripe || !elements || !elementReady) {
      onError(
        "The secure payment form is still loading. Please wait a moment.",
      );
      paymentFailed?.();
      return false;
    }

    try {
      setLoading(true);
      onError("");
      const submitted = await elements.submit();
      if (submitted.error) {
        handleStripeError(submitted.error);
        paymentFailed?.();
        return false;
      }
      const result = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (result.error) {
        handleStripeError(result.error);
        paymentFailed?.();
        return false;
      }

      const paymentMethodId = result.setupIntent?.payment_method;
      if (typeof paymentMethodId !== "string") {
        onError("Stripe did not return a payment method.");
        paymentFailed?.();
        return false;
      }

      await onComplete(paymentMethodId);
      return true;
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to save payment method. Please try again.";
      handleStripeError({ message });
      paymentFailed?.();
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentComplete) {
      onError("Enter your complete card details before subscribing.");
      return;
    }
    await confirmPaymentSetup();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className={cn("space-y-3", !expressCheckoutReady && "hidden")}>
        <ExpressCheckoutElement
          options={expressCheckoutOptions}
          onReady={({ availablePaymentMethods }) =>
            setExpressCheckoutReady(Boolean(availablePaymentMethods))
          }
          onConfirm={(event) => {
            void confirmPaymentSetup(() => event.paymentFailed());
          }}
          onLoadError={(event) => {
            setExpressCheckoutReady(false);
            setElementError(
              event.error?.message || "Wallet payment options could not load.",
            );
          }}
        />
        <div className="flex items-center gap-3" aria-hidden="true">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or use a card</span>
          <Separator className="flex-1" />
        </div>
      </div>
      <PaymentElement
        options={paymentElementOptions}
        onLoaderStart={() => setElementReady(false)}
        onReady={() => {
          setElementReady(true);
          setElementError(null);
        }}
        onChange={(event) => {
          setPaymentComplete(event.complete);
          setElementError(null);
        }}
        onLoadError={(event) => {
          setElementReady(false);
          setElementError(
            event.error?.message || "The secure payment form could not load.",
          );
        }}
      />
      {elementError && (
        <p className="text-xs text-destructive" role="alert">
          {elementError}
        </p>
      )}
      <Button
        type="submit"
        className="w-full mt-1"
        disabled={
          !stripe ||
          !elementReady ||
          !paymentComplete ||
          loading ||
          submitLoading
        }
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
  const [searchParams] = useSearchParams();
  const isPreparedSubscription = searchParams.get("prepared") === "1";
  const draft = readDraft();
  const [step, setStep] = useState(() => {
    if (isPreparedSubscription) return steps.length - 1;
    if (Number(draft?.flowVersion) !== DRAFT_FLOW_VERSION) return 0;
    const draftStep = Number(draft?.step ?? 0);
    return Number.isFinite(draftStep)
      ? Math.min(steps.length - 1, Math.max(0, draftStep))
      : 0;
  });

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
        const days = res.data?.settings?.deliveryDays;
        if (cancelled || !Array.isArray(days) || days.length === 0) return;
        const names = days
          .map((d) => dayNames[d])
          .filter((n): n is string => Boolean(n));
        setAvailableDays(names);
        setDeliveryDays((prev) => {
          const filtered = prev.filter((day) => names.includes(day));
          if (filtered.length > 0) return filtered;
          return names[0] ? [names[0]] : prev;
        });
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
    createAddress,
  } = useAddresses();
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>(
    () => (draft?.selectedVariantIds as string[] | undefined) ?? [],
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(
    () => (draft?.quantities as Record<string, number> | undefined) ?? {},
  );
  const [dayQuantities, setDayQuantities] = useState<
    Record<string, Record<string, number>>
  >(
    () =>
      (draft?.dayQuantities as
        | Record<string, Record<string, number>>
        | undefined) ?? {},
  );
  const [frequency, setFrequency] = useState(() => {
    const draftFrequency = draft?.frequency as string | undefined;
    if (draftFrequency === "fortnightly") return "fortnightly";
    if (draftFrequency === "monthly") return "monthly";
    return "weekly";
  });
  const [deliveryDays, setDeliveryDays] = useState<string[]>(() => {
    const draftDays = draft?.deliveryDays;
    if (Array.isArray(draftDays) && draftDays.length > 0) {
      return draftDays.filter(
        (value): value is string => typeof value === "string",
      );
    }
    const legacyDay = draft?.deliveryDay;
    return typeof legacyDay === "string" && legacyDay
      ? [legacyDay]
      : ["Sunday"];
  });
  const [activeProductDay, setActiveProductDay] = useState(
    () => deliveryDays[0] ?? "Sunday",
  );
  const [selectedAddress, setSelectedAddress] = useState<string>(
    () => (draft?.selectedAddress as string | undefined) ?? "",
  );
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    () => (draft?.deliveryInstructions as string | undefined) ?? "",
  );
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    postcode: "",
    country: "",
    deliveryInstructions: "",
    isDefault: false,
  });
  const [newAddressError, setNewAddressError] = useState<string | null>(null);
  const [newAddressLoading, setNewAddressLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetNewAddressForm = () => {
    setNewAddressForm({
      fullName: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      postcode: "",
      country: "",
      deliveryInstructions: "",
      isDefault: false,
    });
    setNewAddressError(null);
    setIsAddressFormOpen(false);
  };

  const handleCreateAddress = async () => {
    const line1 = newAddressForm.line1.trim();
    const city = newAddressForm.city.trim();
    const postcode = newAddressForm.postcode.trim();
    const country = newAddressForm.country.trim();

    if (!line1 || !city || !postcode || !country) {
      setNewAddressError("Please complete the required address fields.");
      return;
    }

    try {
      setNewAddressLoading(true);
      setNewAddressError(null);

      const createdAddress = await createAddress({
        ...newAddressForm,
        fullName: newAddressForm.fullName.trim(),
        phone: newAddressForm.phone.trim(),
        line1,
        line2: newAddressForm.line2.trim(),
        city,
        postcode,
        country,
        deliveryInstructions: newAddressForm.deliveryInstructions.trim(),
        isDefault: newAddressForm.isDefault,
      });

      const nextAddressId = createdAddress._id ?? createdAddress.id ?? "";
      if (nextAddressId) {
        setSelectedAddress(nextAddressId);
        const nextInstructions =
          createdAddress.deliveryInstructions ??
          newAddressForm.deliveryInstructions.trim();
        setDeliveryInstructions(nextInstructions);
      }

      resetNewAddressForm();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create address";
      setNewAddressError(message);
    } finally {
      setNewAddressLoading(false);
    }
  };

  useEffect(() => {
    if (!isPreparedSubscription || draft) return;

    let active = true;
    void portalSubscriptionsApi
      .getPreparedDraft()
      .then((response) => {
        if (!active) return;
        const preparedDraft = response.data?.draft;
        if (!preparedDraft) {
          setSubmitError(
            "This prepared subscription is no longer available. Please ask the business for a new link.",
          );
          return;
        }

        try {
          sessionStorage.setItem(DRAFT_KEY, JSON.stringify(preparedDraft));
        } catch {
          // The in-memory state below still allows setup to continue.
        }

        setStep(steps.length - 1);
        setSelectedVariantIds(
          Array.isArray(preparedDraft.selectedVariantIds)
            ? preparedDraft.selectedVariantIds.filter(
                (value): value is string => typeof value === "string",
              )
            : [],
        );
        setQuantities(
          (preparedDraft.quantities as Record<string, number> | undefined) ??
            {},
        );
        setDayQuantities(
          (preparedDraft.dayQuantities as
            | Record<string, Record<string, number>>
            | undefined) ?? {},
        );
        const preparedFrequency = String(preparedDraft.frequency || "weekly");
        setFrequency(
          preparedFrequency === "fortnightly" || preparedFrequency === "monthly"
            ? preparedFrequency
            : "weekly",
        );
        setDeliveryDays(
          Array.isArray(preparedDraft.deliveryDays)
            ? preparedDraft.deliveryDays.filter(
                (value): value is string => typeof value === "string",
              )
            : ["Sunday"],
        );
        setSelectedAddress(
          typeof preparedDraft.selectedAddress === "string"
            ? preparedDraft.selectedAddress
            : "",
        );
        setDeliveryInstructions(
          typeof preparedDraft.deliveryInstructions === "string"
            ? preparedDraft.deliveryInstructions
            : "",
        );
      })
      .catch(() => {
        if (active) {
          setSubmitError(
            "We could not load the prepared subscription. Please try the link again.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [draft, isPreparedSubscription]);

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
      const methods: PortalPaymentMethod[] = res.data?.paymentMethods ?? [];
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
    const needsForm =
      (showNewForm || savedMethods.length === 0) && step === steps.length - 1;
    if (!needsForm) return;
    if (setupClientSecret) return; // already loaded

    let cancelled = false;

    const loadSetupIntent = async () => {
      try {
        setSetupLoading(true);
        const res = await portalPaymentsApi.createSetupIntent();
        const data = res.data;
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
    if (addresses.length === 0) return;

    const currentAddressExists = addresses.some(
      (address) => getAddressId(address) === selectedAddress,
    );

    if (currentAddressExists) return;

    const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
    const nextAddressId = getAddressId(defaultAddr);
    if (!nextAddressId) return;

    setSelectedAddress(nextAddressId);
    if (!deliveryInstructions && defaultAddr?.deliveryInstructions) {
      setDeliveryInstructions(defaultAddr.deliveryInstructions);
    }
  }, [addresses, deliveryInstructions, selectedAddress]);

  const syncSelectionFromDayPlans = (
    plans: Record<string, Record<string, number>>,
  ) => {
    const nextQuantities: Record<string, number> = {};

    Object.values(plans).forEach((dayPlan) => {
      Object.entries(dayPlan || {}).forEach(([variantId, quantity]) => {
        if (quantity <= 0) return;
        nextQuantities[variantId] = Math.max(
          nextQuantities[variantId] ?? 0,
          quantity,
        );
      });
    });

    setSelectedVariantIds(Object.keys(nextQuantities));
    setQuantities(nextQuantities);
  };

  const chooseDeliveryDays = (nextDays: string[]) => {
    const uniqueDays = Array.from(new Set(nextDays)).filter(Boolean);
    setDeliveryDays(uniqueDays);
    setActiveProductDay(uniqueDays[0] ?? "Sunday");
    if (uniqueDays.length > 1) setFrequency("weekly");

    const nextPlans = Object.fromEntries(
      uniqueDays.map((day) => [day, dayQuantities[day] || {}]),
    );
    setDayQuantities(nextPlans);
    syncSelectionFromDayPlans(nextPlans);
  };

  const setDayVariantQuantity = (
    day: string,
    variantId: string,
    quantity: number,
  ) => {
    const nextDayPlan = { ...(dayQuantities[day] || {}) };
    const safeQuantity = Math.max(0, Math.floor(quantity));
    if (safeQuantity > 0) nextDayPlan[variantId] = safeQuantity;
    else delete nextDayPlan[variantId];

    const nextPlans = { ...dayQuantities, [day]: nextDayPlan };
    setDayQuantities(nextPlans);
    syncSelectionFromDayPlans(nextPlans);
  };

  useEffect(() => {
    if (frequency === "weekly") return;
    if (deliveryDays.length <= 1) return;
    const firstDay = deliveryDays[0];
    const firstDayPlan = dayQuantities[firstDay] || {};
    const nextQuantities = Object.fromEntries(
      Object.entries(firstDayPlan).filter(([, quantity]) => quantity > 0),
    );
    setDeliveryDays([firstDay]);
    setActiveProductDay(firstDay);
    setDayQuantities({ [firstDay]: firstDayPlan });
    setSelectedVariantIds(Object.keys(nextQuantities));
    setQuantities(nextQuantities);
  }, [dayQuantities, deliveryDays, frequency]);

  useEffect(() => {
    if (deliveryDays.includes(activeProductDay)) return;
    setActiveProductDay(deliveryDays[0] ?? "Sunday");
  }, [activeProductDay, deliveryDays]);

  // Persist draft on every relevant state change
  useEffect(() => {
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          flowVersion: DRAFT_FLOW_VERSION,
          step,
          selectedVariantIds,
          quantities,
          dayQuantities,
          frequency,
          deliveryDays,
          selectedAddress,
          deliveryInstructions,
        }),
      );
    } catch {
      // storage quota exceeded — ignore
    }
  }, [
    step,
    selectedVariantIds,
    quantities,
    dayQuantities,
    frequency,
    deliveryDays,
    selectedAddress,
    deliveryInstructions,
  ]);

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  };

  const hasProductsForEverySelectedDay =
    deliveryDays.length > 0 &&
    deliveryDays.every((day) =>
      Object.values(dayQuantities[day] || {}).some((quantity) => quantity > 0),
    );

  const selectedAddressValid =
    Boolean(selectedAddress) &&
    addresses.some((a) => getAddressId(a) === selectedAddress);

  const canContinue =
    (step === 0 && deliveryDays.length > 0) ||
    step === 1 ||
    (step === 2 && hasProductsForEverySelectedDay) ||
    (step === 3 && selectedAddressValid);

  const handleNext = () => {
    if (!canContinue) {
      if (step === 2) {
        setSubmitError(
          "Please add at least one product to each selected delivery day.",
        );
      } else if (step === 3) {
        setSubmitError("Please select a delivery address.");
      }
      return;
    }
    setSubmitError(null);
    setStep((s) => Math.min(steps.length - 1, s + 1));
  };
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

  const reviewSelectedDays = useMemo(
    () => (deliveryDays.length > 0 ? deliveryDays : ["Sunday"]),
    [deliveryDays],
  );
  const reviewIsMultiDayWeekly =
    frequency === "weekly" && reviewSelectedDays.length > 1;

  const reviewDayPlans = useMemo(() => {
    if (selectedFlatVariants.length === 0) return [];

    if (reviewIsMultiDayWeekly) {
      const hasExplicitDayQuantities = reviewSelectedDays.some(
        (dayName) =>
          Boolean(dayQuantities[dayName]) &&
          Object.keys(dayQuantities[dayName] || {}).length > 0,
      );

      return reviewSelectedDays.map((dayName) => {
        const items = selectedFlatVariants
          .map((sv) => {
            const quantity = hasExplicitDayQuantities
              ? Math.max(0, dayQuantities[dayName]?.[sv.variantId] ?? 0)
              : Math.max(
                  0,
                  dayQuantities[dayName]?.[sv.variantId] ??
                    Math.max(1, quantities[sv.variantId] ?? 1),
                );

            return {
              variantId: sv.variantId,
              name: sv.variantName,
              quantity,
              unitPrice: sv.price,
              lineTotal: sv.price * quantity,
            };
          })
          .filter((item) => item.quantity > 0);

        const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
        const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

        return {
          dayName,
          items,
          subtotal,
          totalQty,
          deliveryFee: SUBSCRIPTION_DELIVERY_FEE,
          totalWithFee: subtotal + SUBSCRIPTION_DELIVERY_FEE,
        };
      });
    }

    const items = selectedFlatVariants.map((sv) => {
      const quantity = Math.max(1, quantities[sv.variantId] ?? 1);
      return {
        variantId: sv.variantId,
        name: sv.variantName,
        quantity,
        unitPrice: sv.price,
        lineTotal: sv.price * quantity,
      };
    });
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

    return [
      {
        dayName: reviewSelectedDays[0] ?? "Selected delivery",
        items,
        subtotal,
        totalQty,
        deliveryFee: SUBSCRIPTION_DELIVERY_FEE,
        totalWithFee: subtotal + SUBSCRIPTION_DELIVERY_FEE,
      },
    ];
  }, [
    dayQuantities,
    quantities,
    reviewIsMultiDayWeekly,
    reviewSelectedDays,
    selectedFlatVariants,
  ]);

  const reviewSubtotal = useMemo(
    () => reviewDayPlans.reduce((sum, plan) => sum + plan.subtotal, 0),
    [reviewDayPlans],
  );

  const reviewDeliveryFeeCount =
    selectedFlatVariants.length === 0
      ? 0
      : reviewIsMultiDayWeekly
        ? reviewSelectedDays.length
        : 1;

  const reviewDeliveryFeeTotal =
    SUBSCRIPTION_DELIVERY_FEE * reviewDeliveryFeeCount;

  const reviewTotal = reviewSubtotal + reviewDeliveryFeeTotal;
  const reviewAddressDetails =
    addresses.find((a) => getAddressId(a) === selectedAddress) ?? null;
  const selectedPaymentMethod =
    savedMethods.find((method) => method._id === selectedMethodId) ?? null;
  const reviewFrequencyLabel = formatFrequencyLabel(frequency);
  const reviewCycleLabel = formatCycleLabel(frequency);

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

    // Validate that the selected address actually exists
    const addressExists = addresses.some(
      (a) => getAddressId(a) === selectedAddress,
    );
    if (!addressExists) {
      throw new Error(
        "The selected address is no longer available. Please select another address.",
      );
    }

    if (selectedFlatVariants.length === 0) {
      throw new Error("Please select at least one product.");
    }

    const selectedDays = deliveryDays.length > 0 ? deliveryDays : ["Sunday"];
    const selectedDayIndexes = selectedDays.map(dayToIndex);
    const isMultiDayWeekly = frequency === "weekly" && selectedDays.length > 1;
    const hasExplicitDayQuantities = selectedDays.some(
      (dayName) =>
        Boolean(dayQuantities[dayName]) &&
        Object.keys(dayQuantities[dayName] || {}).length > 0,
    );

    const baseItems = selectedFlatVariants.map((sv) => ({
      variantId: sv.variantId,
      quantity: Math.max(1, quantities[sv.variantId] ?? 1),
    }));

    let deliveryDayPlans:
      | Array<{
          day: number;
          items: Array<{ variantId: string; quantity: number }>;
        }>
      | undefined;

    if (isMultiDayWeekly) {
      deliveryDayPlans = selectedDays.map((dayName) => {
        const planItems = selectedFlatVariants
          .map((sv) => ({
            variantId: sv.variantId,
            quantity: hasExplicitDayQuantities
              ? Math.max(0, dayQuantities[dayName]?.[sv.variantId] ?? 0)
              : Math.max(
                  0,
                  dayQuantities[dayName]?.[sv.variantId] ??
                    Math.max(1, quantities[sv.variantId] ?? 1),
                ),
          }))
          .filter((item) => item.quantity > 0);

        if (planItems.length === 0) {
          throw new Error(
            `Please add at least one product for ${dayName} deliveries.`,
          );
        }

        return {
          day: dayToIndex(dayName),
          items: planItems,
        };
      });

      const mergedByVariant = new Map<string, number>();
      for (const plan of deliveryDayPlans) {
        for (const item of plan.items) {
          mergedByVariant.set(
            item.variantId,
            (mergedByVariant.get(item.variantId) || 0) + item.quantity,
          );
        }
      }

      const mergedItems = Array.from(mergedByVariant.entries()).map(
        ([variantId, quantity]) => ({ variantId, quantity }),
      );

      return {
        frequency: frequencyToApi(frequency) as
          | "weekly"
          | "every_two_weeks"
          | "monthly",
        preferredDeliveryDay: selectedDayIndexes[0],
        preferredDeliveryDays: Array.from(new Set(selectedDayIndexes)),
        deliveryDayPlans,
        deliveryAddressId: selectedAddress,
        deliveryInstructions: deliveryInstructions.trim(),
        items: mergedItems,
      };
    }

    return {
      frequency: frequencyToApi(frequency) as
        | "weekly"
        | "every_two_weeks"
        | "monthly",
      preferredDeliveryDay: selectedDayIndexes[0],
      preferredDeliveryDays:
        frequency === "weekly"
          ? Array.from(new Set(selectedDayIndexes))
          : [selectedDayIndexes[0]],
      deliveryAddressId: selectedAddress,
      deliveryInstructions: deliveryInstructions.trim(),
      items: baseItems,
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
    let paymentMethodSaved = false;
    try {
      setSubmitLoading(true);
      setSubmitError(null);
      await portalPaymentsApi.attachPaymentMethod({
        stripePaymentMethodId: paymentMethodId,
        setDefault: true,
      });
      paymentMethodSaved = true;
      await loadSavedMethods();
      await completeSubscription();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : paymentMethodSaved
            ? "Your card was saved, but we could not create the subscription. Please try again using the saved card."
            : "We could not save your payment method. Please check the card details and try again.";
      setSubmitError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const refreshPaymentSetup = () => {
    setSetupClientSecret(null);
    setStripePromise(null);
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
            {step === 2 && selectedVariantIds.length > 0 && (
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
          step === 2
            ? "flex-1 pb-6 xl:w-5/6 xl:max-w-6xl xl:mx-auto"
            : "flex-1 bg-card border border-border rounded-2xl p-6 mb-6 xl:w-1/2 xl:mx-auto",
        )}
      >
        {/* Step 0: Delivery days */}
        {step === 0 && (
          <div>
            <h2 className="font-semibold text-foreground mb-1">
              Which days would you like delivery?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Choose Sunday, Wednesday, or both days.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Sunday", "Wednesday"].map((day) => {
                const selected =
                  deliveryDays.length === 1 && deliveryDays[0] === day;
                const unavailable =
                  Array.isArray(availableDays) && !availableDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={unavailable}
                    aria-pressed={selected}
                    onClick={() => chooseDeliveryDays([day])}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                      selected
                        ? "border-forest bg-forest/5"
                        : "border-border hover:border-forest/40",
                    )}
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {day}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {unavailable
                        ? "Currently unavailable"
                        : "One delivery day"}
                    </p>
                  </button>
                );
              })}
              <button
                type="button"
                disabled={
                  Array.isArray(availableDays) &&
                  !["Sunday", "Wednesday"].every((day) =>
                    availableDays.includes(day),
                  )
                }
                aria-pressed={deliveryDays.length > 1}
                onClick={() => chooseDeliveryDays(["Sunday", "Wednesday"])}
                className={cn(
                  "rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                  deliveryDays.length > 1
                    ? "border-forest bg-forest/5"
                    : "border-border hover:border-forest/40",
                )}
              >
                <p className="text-sm font-semibold text-foreground">
                  Both days
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sunday and Wednesday
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Frequency */}
        {step === 1 && (
          <div>
            <h2 className="font-semibold text-foreground mb-1">
              How often would you like delivery?
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Choose how often this subscription should repeat.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { value: "weekly", label: "Weekly", desc: "Every week" },
                {
                  value: "fortnightly",
                  label: "Every 2 weeks",
                  desc: "Once every two weeks",
                },
                {
                  value: "monthly",
                  label: "Monthly",
                  desc: "Once every month",
                },
              ].map((opt) => {
                const disabled =
                  deliveryDays.length > 1 && opt.value !== "weekly";
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={disabled}
                    aria-pressed={frequency === opt.value}
                    onClick={() => setFrequency(opt.value)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                      frequency === opt.value
                        ? "border-forest bg-forest/5"
                        : "border-border hover:border-forest/40",
                    )}
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {opt.label}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
            {deliveryDays.length > 1 && (
              <p className="mt-4 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                Both-day delivery is a weekly plan because it includes separate
                Sunday and Wednesday orders each week.
              </p>
            )}
          </div>
        )}

        {/* Step 2: Products by selected day */}
        {step === 2 && (
          <div>
            <div className="mb-5">
              <h2 className="font-semibold text-foreground">
                Choose products for each delivery day
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Build a separate order for every day you selected.
              </p>
            </div>

            <div className="mb-5 flex flex-wrap gap-2" role="tablist">
              {deliveryDays.map((day) => {
                const itemCount = Object.values(
                  dayQuantities[day] || {},
                ).filter((quantity) => quantity > 0).length;
                return (
                  <button
                    key={day}
                    type="button"
                    role="tab"
                    aria-selected={activeProductDay === day}
                    onClick={() => setActiveProductDay(day)}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                      activeProductDay === day
                        ? "border-forest bg-forest text-primary-foreground"
                        : "border-border hover:border-forest/40",
                    )}
                  >
                    {day} order · {itemCount}
                  </button>
                );
              })}
            </div>

            <section className="mb-6 rounded-xl border border-border bg-muted/20 p-4">
              <h3 className="text-sm font-semibold text-foreground">
                {activeProductDay} delivery
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Adjust quantities or remove products from this day.
              </p>

              <div className="mt-3 space-y-2">
                {selectedFlatVariants.filter(
                  (variant) =>
                    (dayQuantities[activeProductDay]?.[variant.variantId] ??
                      0) > 0,
                ).length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                    No products added to {activeProductDay} yet.
                  </p>
                ) : (
                  selectedFlatVariants
                    .filter(
                      (variant) =>
                        (dayQuantities[activeProductDay]?.[variant.variantId] ??
                          0) > 0,
                    )
                    .map((variant) => {
                      const currentQuantity =
                        dayQuantities[activeProductDay]?.[variant.variantId] ??
                        1;
                      return (
                        <div
                          key={`${activeProductDay}-${variant.variantId}`}
                          className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
                        >
                          {variant.image && (
                            <img
                              src={variant.image}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {variant.productName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {variant.variantName} · {fmt(variant.price)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Decrease ${variant.variantName} quantity`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
                              onClick={() =>
                                setDayVariantQuantity(
                                  activeProductDay,
                                  variant.variantId,
                                  currentQuantity - 1,
                                )
                              }
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm font-medium">
                              {currentQuantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase ${variant.variantName} quantity`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
                              onClick={() =>
                                setDayVariantQuantity(
                                  activeProductDay,
                                  variant.variantId,
                                  currentQuantity + 1,
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </section>

            <ShopPage
              embedded
              contentGapClassName="flex flex-col lg:flex-row gap-4"
              productGridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
              sidebarStickyTopOffset={subHeaderTopOffset + subHeaderHeight + 16}
              cardActionLabel={({ lockedVariantId }) =>
                lockedVariantId &&
                (dayQuantities[activeProductDay]?.[lockedVariantId] ?? 0) > 0
                  ? `Remove from ${activeProductDay}`
                  : `Add to ${activeProductDay}`
              }
              cardActionClassName={({ lockedVariantId }) =>
                lockedVariantId &&
                (dayQuantities[activeProductDay]?.[lockedVariantId] ?? 0) > 0
                  ? "!bg-destructive/10 !text-destructive hover:!bg-destructive/20"
                  : undefined
              }
              onCardAction={({ variant, quantity, lockedVariantId }) => {
                const variantId = variant?.id ?? lockedVariantId;
                if (!variantId) return;
                const isSelected =
                  (dayQuantities[activeProductDay]?.[variantId] ?? 0) > 0;
                setDayVariantQuantity(
                  activeProductDay,
                  variantId,
                  isSelected ? 0 : quantity,
                );
              }}
            />
          </div>
        )}

        {/* Step 3: Address and delivery instructions */}
        {step === 3 && (
          <div>
            <h2 className="font-semibold text-foreground mb-1">
              Delivery details
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose an address and add any instructions for the driver.
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
                      key={addr._id ?? addr.id}
                      onClick={() => {
                        setSelectedAddress(addr._id ?? addr.id ?? "");
                        setDeliveryInstructions(
                          addr.deliveryInstructions ?? "",
                        );
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-colors",
                        selectedAddress === (addr._id ?? addr.id)
                          ? "border-forest bg-forest/5"
                          : "border-border hover:border-forest/40",
                      )}
                    >
                      <p className="text-sm font-medium">
                        {addr.fullName || addr.label || addr.line1 || "Address"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {addr.line1}, {addr.city}, {addr.postcode}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddressFormOpen((open) => !open)}
            >
              Add new address
            </Button>

            {isAddressFormOpen && (
              <div className="mt-4 rounded-xl border border-border bg-card p-4 space-y-4">
                {newAddressError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {newAddressError}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Full name
                    </label>
                    <input
                      value={newAddressForm.fullName}
                      onChange={(event) =>
                        setNewAddressForm((prev) => ({
                          ...prev,
                          fullName: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-0 transition-colors placeholder:text-muted-foreground focus:border-forest"
                      placeholder="Sarah Mitchell"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Phone number
                    </label>
                    <input
                      value={newAddressForm.phone}
                      onChange={(event) =>
                        setNewAddressForm((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-0 transition-colors placeholder:text-muted-foreground focus:border-forest"
                      placeholder="+44 7700 900000"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Address line 1{" "}
                    <span className="text-muted-foreground">*</span>
                  </label>
                  <input
                    value={newAddressForm.line1}
                    onChange={(event) =>
                      setNewAddressForm((prev) => ({
                        ...prev,
                        line1: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-0 transition-colors placeholder:text-muted-foreground focus:border-forest"
                    placeholder="14 Meadow Lane"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Address line 2 (optional)
                  </label>
                  <input
                    value={newAddressForm.line2}
                    onChange={(event) =>
                      setNewAddressForm((prev) => ({
                        ...prev,
                        line2: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-0 transition-colors placeholder:text-muted-foreground focus:border-forest"
                    placeholder="Flat 3"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      City <span className="text-muted-foreground">*</span>
                    </label>
                    <input
                      value={newAddressForm.city}
                      onChange={(event) =>
                        setNewAddressForm((prev) => ({
                          ...prev,
                          city: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-0 transition-colors placeholder:text-muted-foreground focus:border-forest"
                      placeholder="Manchester"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Postcode <span className="text-muted-foreground">*</span>
                    </label>
                    <input
                      value={newAddressForm.postcode}
                      onChange={(event) =>
                        setNewAddressForm((prev) => ({
                          ...prev,
                          postcode: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-0 transition-colors placeholder:text-muted-foreground focus:border-forest"
                      placeholder="M14 5TF"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Country <span className="text-muted-foreground">*</span>
                  </label>
                  <input
                    value={newAddressForm.country}
                    onChange={(event) =>
                      setNewAddressForm((prev) => ({
                        ...prev,
                        country: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-0 transition-colors placeholder:text-muted-foreground focus:border-forest"
                    placeholder="United Kingdom"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Delivery instructions (optional)
                  </label>
                  <textarea
                    value={newAddressForm.deliveryInstructions}
                    onChange={(event) =>
                      setNewAddressForm((prev) => ({
                        ...prev,
                        deliveryInstructions: event.target.value,
                      }))
                    }
                    rows={3}
                    maxLength={500}
                    className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-0 transition-colors placeholder:text-muted-foreground focus:border-forest"
                    placeholder="Leave at the side gate or ring the doorbell."
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={newAddressForm.isDefault}
                    onChange={(event) =>
                      setNewAddressForm((prev) => ({
                        ...prev,
                        isDefault: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-input text-forest focus:ring-forest"
                  />
                  Set as default delivery address
                </label>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={resetNewAddressForm}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateAddress}
                    disabled={newAddressLoading}
                    type="button"
                  >
                    {newAddressLoading ? "Saving..." : "Save address"}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6">
              <label
                htmlFor="subscription-delivery-instructions"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Delivery instructions{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="subscription-delivery-instructions"
                value={deliveryInstructions}
                onChange={(event) =>
                  setDeliveryInstructions(event.target.value.slice(0, 500))
                }
                rows={4}
                maxLength={500}
                placeholder="For example: leave by the side gate or ring the doorbell."
                className="input-field resize-y"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {deliveryInstructions.length}/500
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Review and payment */}
        {step === 4 && (
          <div>
            {isPreparedSubscription && (
              <div className="mb-5 rounded-xl border border-forest/20 bg-forest/5 p-4">
                <p className="text-sm font-semibold text-forest">
                  Your subscription has been prepared
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Review the details below and add a payment method to activate
                  it. You will not be charged unless setup completes.
                </p>
              </div>
            )}
            <h2 className="font-semibold text-foreground mb-1">
              Review & Payment
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Check your subscription details before confirming.
            </p>

            <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
              <div className="divide-y divide-border">
                <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Frequency</span>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      {reviewFrequencyLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Renews {reviewCycleLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Delivery days</span>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      {reviewSelectedDays.join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {reviewIsMultiDayWeekly
                        ? `${reviewSelectedDays.length} deliveries per weekly cycle`
                        : "1 delivery per cycle"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Address</span>
                  <div className="max-w-[65%] text-right">
                    <p className="font-medium text-foreground">
                      {reviewAddressDetails?.fullName ||
                        reviewAddressDetails?.label ||
                        reviewAddressDetails?.line1 ||
                        "No address selected"}
                    </p>
                    {reviewAddressDetails ? (
                      <p className="text-xs leading-5 text-muted-foreground">
                        {reviewAddressDetails.line1}
                        {reviewAddressDetails.line2
                          ? `, ${reviewAddressDetails.line2}`
                          : ""}
                        <br />
                        {reviewAddressDetails.city},{" "}
                        {reviewAddressDetails.postcode}
                      </p>
                    ) : null}
                    {deliveryInstructions.trim() ? (
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Instructions: {deliveryInstructions.trim()}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <section className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground">
                    Products
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {reviewDayPlans.reduce(
                      (sum, plan) => sum + plan.totalQty,
                      0,
                    )}{" "}
                    qty total
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {reviewDayPlans.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                      No products selected.
                    </div>
                  ) : (
                    reviewDayPlans.map((plan) => (
                      <div
                        key={`review-plan-${plan.dayName}`}
                        className="rounded-xl border border-border bg-background/80"
                      >
                        <div className="flex items-start justify-between gap-4 px-4 py-3 border-b border-border">
                          <div>
                            <p className="font-medium text-foreground">
                              {reviewIsMultiDayWeekly
                                ? plan.dayName
                                : "Selected products"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {plan.items.length} product
                              {plan.items.length === 1 ? "" : "s"} ·{" "}
                              {plan.totalQty} qty
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-medium text-foreground">
                              {fmt(plan.totalWithFee)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {fmt(plan.subtotal)} + {fmt(plan.deliveryFee)}{" "}
                              delivery
                            </p>
                          </div>
                        </div>

                        <div className="divide-y divide-border/70 px-4">
                          {plan.items.map((item) => (
                            <div
                              key={`${plan.dayName}-${item.variantId}`}
                              className="flex items-start justify-between gap-4 py-3"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                  {item.name}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {item.quantity} x {fmt(item.unitPrice)}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-foreground">
                                {fmt(item.lineTotal)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5">
                <h3 className="text-base font-semibold text-foreground">
                  Summary
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      Products subtotal
                    </span>
                    <span className="font-medium text-foreground">
                      {fmt(reviewSubtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      Delivery fees
                      {reviewDeliveryFeeCount > 1
                        ? ` (${reviewDeliveryFeeCount} deliveries)`
                        : ""}
                    </span>
                    <span className="font-medium text-foreground">
                      {fmt(reviewDeliveryFeeTotal)}
                    </span>
                  </div>
                  {reviewIsMultiDayWeekly && (
                    <div className="rounded-xl bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                      {reviewDayPlans.map((plan) => (
                        <div
                          key={`review-cycle-${plan.dayName}`}
                          className="flex items-center justify-between gap-3 py-1"
                        >
                          <span>{plan.dayName}</span>
                          <span className="font-medium text-foreground">
                            {fmt(plan.totalWithFee)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between gap-4 text-base">
                    <span className="font-semibold text-foreground">
                      Total charged today
                    </span>
                    <span className="font-semibold text-foreground">
                      {fmt(reviewTotal)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-muted/40 px-3 py-3 text-xs leading-5 text-muted-foreground">
                    Charged now to
                    <span className="font-medium text-foreground">
                      {selectedPaymentMethod
                        ? ` ${fmtMethod(selectedPaymentMethod)}`
                        : showNewForm
                          ? " your new payment method"
                          : " your selected payment method"}
                    </span>
                    . Future payments renew at
                    <span className="font-medium text-foreground">
                      {fmt(reviewTotal)}
                    </span>
                    {` ${reviewCycleLabel}`}.
                  </div>
                </div>
              </section>
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
                    Apple Pay and Google Pay are shown first on supported
                    devices and browsers. Card entry is always available below.
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
                        onSetupExpired={refreshPaymentSetup}
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
      <div
        className={cn(
          "sticky bottom-0 z-30 mt-6 -mx-4 sm:-mx-6 lg:-mx-8 xl:mx-auto",
          step === 2 ? "xl:w-5/6 xl:max-w-6xl" : "xl:w-1/2",
        )}
      >
        <div className="rounded-none border border-border bg-background/95 px-3 py-3 shadow-sm backdrop-blur-sm sm:px-6 lg:px-3">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={
                isPreparedSubscription
                  ? () => navigate("/portal/subscriptions")
                  : step === 0
                    ? () => {
                        clearDraft();
                        navigate("/portal/subscriptions");
                      }
                    : handleBack
              }
            >
              <ArrowLeft className="h-4 w-4" />
              {step === 0 || isPreparedSubscription ? "Cancel" : "Back"}
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={handleNext} disabled={!canContinue}>
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

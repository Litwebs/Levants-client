import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  Search,
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
import { mockAddresses } from "@/portal/data/mockData";
import { cn } from "@/lib/utils";
import api from "@/api/client";

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

const NewSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // ── Product data from API ─────────────────────────────────────────────────
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

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

  // ── Wizard state ─────────────────────────────────────────────────────────
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<
    Record<string, { qty: number; variantIdx: number }>
  >({});
  const [frequency, setFrequency] = useState("weekly");
  const [deliveryDay, setDeliveryDay] = useState("Tuesday");
  const [selectedAddress, setSelectedAddress] = useState(
    mockAddresses.find((a) => a.isDefault)?.id ?? "",
  );
  const [subscriptionName, setSubscriptionName] = useState("");

  const toggleProduct = (id: string) =>
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

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
                  className={cn(
                    "p-4 rounded-xl border text-left transition-colors",
                    frequency === opt.value
                      ? "border-forest bg-forest/5"
                      : "border-border hover:border-forest/40",
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
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ].map((day) => (
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
            <div className="space-y-2 mb-4">
              {mockAddresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => setSelectedAddress(addr.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-colors",
                    selectedAddress === addr.id
                      ? "border-forest bg-forest/5"
                      : "border-border hover:border-forest/40",
                  )}
                >
                  <p className="text-sm font-medium">{addr.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {addr.line1}, {addr.city}, {addr.postcode}
                  </p>
                </button>
              ))}
            </div>
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
                  {mockAddresses.find((a) => a.id === selectedAddress)?.line1 ??
                    "—"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={
            step === 0 ? () => navigate("/portal/subscriptions") : handleBack
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
          <Button onClick={() => navigate("/portal/subscriptions")}>
            <Check className="h-4 w-4" />
            Create Subscription
          </Button>
        )}
      </div>
    </div>
  );
};

export default NewSubscriptionPage;

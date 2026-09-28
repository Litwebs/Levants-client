import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2, Package, ShoppingBag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getDeal, type Deal } from "@/api/deals";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

const DealDetailPage: React.FC = () => {
  const { slug = "" } = useParams();
  const { addDeal } = useCart();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDeal = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const value = await getDeal(slug);
      setDeal(value);
      if (!value) setError("Deal not found.");
    } catch (err) {
      setDeal(null);
      setError(err instanceof Error ? err.message : "Failed to load deal.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadDeal();
  }, [loadDeal]);

  if (loading) {
    return (
      <div className="container-custom flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!deal || error) {
    return (
      <div className="container-custom py-16 text-center">
        <p className="mb-4 text-destructive">{error || "Deal not found."}</p>
        <button type="button" onClick={() => void loadDeal()} className="btn-outline">
          Retry
        </button>
      </div>
    );
  }

  const soldOut = Number(deal.maxPackages || 0) <= 0;

  const add = () => {
    if (soldOut) return;
    addDeal(deal, 1);
    toast.success(deal.name + " added to your basket", {
      description: "Package deal · save £" + Number(deal.savings || 0).toFixed(2),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-8 lg:py-12">
        <Link
          to="/deals"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to deals
        </Link>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
              {deal.imageUrl ? (
                <img
                  src={deal.imageUrl}
                  alt={deal.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="badge-fresh">Save {deal.savingsPercent}%</span>
              {deal.isFeatured && <span className="badge-gold">Featured</span>}
              {soldOut && <span className="badge-bestseller">Unavailable</span>}
            </div>

            <h1 className="font-heading text-3xl font-semibold lg:text-4xl">
              {deal.name}
            </h1>

            {deal.description && (
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {deal.description}
              </p>
            )}

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-primary">
                £{deal.packagePrice.toFixed(2)}
              </span>
              <span className="text-base text-muted-foreground line-through">
                £{deal.originalValue.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-primary">
              You save £{deal.savings.toFixed(2)}
            </p>

            <div className="mt-8 rounded-xl bg-secondary/50 p-4">
              <p className="text-sm font-medium">What's included</p>
              <div className="mt-3 space-y-3">
                {deal.items.map((item) => (
                  <div key={item.variantId} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.variant.name} × {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={add}
              disabled={soldOut}
              className="btn-primary mt-6 flex h-10 w-full items-center justify-center gap-2 px-3 py-0 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span className="text-sm">
                {soldOut ? "Currently unavailable" : "Add package to basket"}
              </span>
            </button>

            {!soldOut && (
              <p className="mt-3 text-xs text-muted-foreground">
                {deal.maxPackages} package{deal.maxPackages === 1 ? "" : "s"} currently available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetailPage;

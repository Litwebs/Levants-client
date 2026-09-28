import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    let active = true;
    void getDeal(slug)
      .then((value) => {
        if (!active) return;
        setDeal(value);
        if (!value) setError("Deal not found.");
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load deal.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="container-custom flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading deal...
      </div>
    );
  }

  if (!deal || error) {
    return (
      <div className="container-custom py-16">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive">
          {error || "Deal not found."}
        </div>
      </div>
    );
  }

  const add = () => {
    addDeal(deal, 1);
    toast.success(deal.name + " added to your basket");
  };

  return (
    <div className="min-h-screen bg-background py-10 lg:py-16">
      <div className="container-custom">
        <Link
          to="/deals"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to deals
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <div className="overflow-hidden rounded-3xl border border-border bg-muted">
            {deal.imageUrl ? (
              <img
                src={deal.imageUrl}
                alt={deal.name}
                className="aspect-[4/3] h-full w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </div>

          <div>
            <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              Save {deal.savingsPercent}%
            </span>
            <h1 className="mt-4 font-heading text-4xl font-semibold">
              {deal.name}
            </h1>
            {deal.description && (
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {deal.description}
              </p>
            )}

            <div className="mt-6 flex items-end gap-3">
              <span className="text-3xl font-bold text-primary">
                £{deal.packagePrice.toFixed(2)}
              </span>
              <span className="pb-1 text-base text-muted-foreground line-through">
                £{deal.originalValue.toFixed(2)}
              </span>
              <span className="pb-1 text-sm font-medium text-primary">
                Save £{deal.savings.toFixed(2)}
              </span>
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-card p-5">
              <h2 className="font-heading text-lg font-semibold">
                What's included
              </h2>
              <div className="mt-4 space-y-3">
                {deal.items.map((item) => (
                  <div
                    key={item.variantId}
                    className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3"
                  >
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {item.product.name}
                      </p>
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
              disabled={deal.maxPackages <= 0}
              className="btn-primary mt-6 flex w-full items-center justify-center gap-2 py-3 disabled:opacity-50"
            >
              <ShoppingBag className="h-4 w-4" />
              Add package to basket
            </button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {deal.maxPackages} package{deal.maxPackages === 1 ? "" : "s"} currently available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetailPage;

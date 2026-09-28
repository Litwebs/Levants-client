import React from "react";
import { Link } from "react-router-dom";
import { Package, ShoppingBag } from "lucide-react";
import type { Deal } from "@/api/deals";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

interface DealCardProps {
  deal: Deal;
  compact?: boolean;
}

const DealCard: React.FC<DealCardProps> = ({ deal, compact = false }) => {
  const { addDeal } = useCart();
  const soldOut = Number(deal.maxPackages || 0) <= 0;

  const addToCart = () => {
    if (soldOut) return;
    addDeal(deal, 1);
    toast.success(deal.name + " added to your basket", {
      description: "Package deal · save £" + Number(deal.savings || 0).toFixed(2),
    });
  };

  return (
    <article className="h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link to={"/deals/" + deal.slug} className="block">
        <div className={"relative overflow-hidden bg-muted " + (compact ? "aspect-[16/9]" : "aspect-[4/3]")}>
          {deal.imageUrl ? (
            <img
              src={deal.imageUrl}
              alt={deal.name}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            Save {deal.savingsPercent}%
          </div>
        </div>
      </Link>

      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <Link to={"/deals/" + deal.slug}>
              <h3 className="font-heading text-lg font-semibold hover:text-primary">
                {deal.name}
              </h3>
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              {deal.items.length} product{deal.items.length === 1 ? "" : "s"} in this package
            </p>
          </div>
          {deal.isFeatured && (
            <span className="rounded-full bg-gold/15 px-2 py-1 text-[11px] font-semibold text-foreground">
              Featured
            </span>
          )}
        </div>

        {!compact && deal.description && (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {deal.description}
          </p>
        )}

        <div className="mb-4 flex items-end gap-2">
          <span className="text-xl font-bold text-primary">
            £{deal.packagePrice.toFixed(2)}
          </span>
          <span className="pb-0.5 text-sm text-muted-foreground line-through">
            £{deal.originalValue.toFixed(2)}
          </span>
        </div>

        <button
          type="button"
          disabled={soldOut}
          onClick={addToCart}
          className="btn-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingBag className="h-4 w-4" />
          {soldOut ? "Currently unavailable" : "Add package to basket"}
        </button>
      </div>
    </article>
  );
};

export default DealCard;

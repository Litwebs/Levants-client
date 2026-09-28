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
    <article className="card-product group flex h-full flex-col">
      <Link to={"/deals/" + deal.slug} className="block">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {deal.imageUrl ? (
            <img
              src={deal.imageUrl}
              alt={deal.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="badge-fresh">
              Save {deal.savingsPercent}%
            </span>
            {deal.isFeatured && <span className="badge-gold">Featured</span>}
          </div>

          {soldOut && (
            <span className="absolute right-3 top-3 badge-bestseller">
              Unavailable
            </span>
          )}
        </div>

        <div className="p-4">
          <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
            Package deal
          </p>
          <h3 className="mb-1 line-clamp-1 font-heading text-lg font-medium">
            {deal.name}
          </h3>
          {!compact && deal.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {deal.description}
            </p>
          )}
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-lg font-semibold text-primary">
              £{deal.packagePrice.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground line-through">
              £{deal.originalValue.toFixed(2)}
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {deal.items.length} product{deal.items.length === 1 ? "" : "s"} included
          </p>
        </div>
      </Link>

      <div className="mt-auto px-4 pb-4 pt-0">
        <button
          type="button"
          disabled={soldOut}
          onClick={addToCart}
          className="btn-primary flex h-10 w-full items-center justify-center gap-2 px-3 py-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingBag className="h-4 w-4 shrink-0" />
          <span className="truncate text-sm">
            {soldOut ? "Currently unavailable" : "Add package to basket"}
          </span>
        </button>
      </div>
    </article>
  );
};

export default DealCard;

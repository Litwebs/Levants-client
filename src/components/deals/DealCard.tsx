import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Package, ShoppingBag } from "lucide-react";
import type { Deal } from "@/api/deals";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { dealPresentation } from "./dealPresentation";

interface DealCardProps {
  deal: Deal;
}

export default function DealCard({ deal }: DealCardProps) {
  const titleId = useId();
  const { addDeal, deals, openCart } = useCart();
  const [failedImage, setFailedImage] = useState<string>();
  const value = dealPresentation(deal);
  const quantity =
    deals.find((entry) => entry.deal.id === deal.id)?.quantity ?? 0;
  const soldOut =
    !Number.isFinite(deal.maxPackages) ||
    deal.maxPackages <= 0 ||
    Boolean(deal.endsAt && new Date(deal.endsAt).getTime() <= Date.now());
  const atLimit = quantity >= Math.min(99, deal.maxPackages);
  const endDate = deal.endsAt ? new Date(deal.endsAt) : null;

  const addToCart = () => {
    if (soldOut || !value.validPrice) return;
    if (atLimit) {
      openCart();
      return;
    }
    addDeal(deal, 1);
    toast.success(deal.name + " added to your basket", {
      description: value.saving
        ? `Package deal · save ${value.saving}`
        : "Package deal",
    });
  };

  return (
    <article
      aria-labelledby={titleId}
      className="deal-card group mx-auto flex h-full w-full min-w-0 max-w-sm flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft transition-colors hover:border-primary/40 sm:mx-0"
    >
      <div className="relative aspect-[2/1] shrink-0 overflow-hidden bg-secondary/60">
        <Link
          to={"/deals/" + deal.slug}
          tabIndex={-1}
          aria-hidden="true"
          className="block h-full"
        >
          {deal.imageUrl && failedImage !== deal.imageUrl ? (
            <img
              src={deal.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              width={640}
              height={320}
              onError={() => setFailedImage(deal.imageUrl)}
              className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-primary/40">
              <Package className="h-12 w-12" />
            </div>
          )}
        </Link>
        {value.saving && !soldOut && (
          <span className="absolute left-3 top-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-soft">
            Save {value.percent !== null ? `${value.percent}%` : value.saving}
          </span>
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-foreground">
            Currently unavailable
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
          <span>Package deal</span>
          {deal.isFeatured && (
            <span className="text-muted-foreground">Featured</span>
          )}
        </div>
        <h3
          id={titleId}
          className="font-heading text-xl font-semibold leading-snug"
        >
          <Link
            to={"/deals/" + deal.slug}
            className="line-clamp-2 min-h-[3.25rem] break-words rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title={deal.name}
          >
            {deal.name}
          </Link>
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Package aria-hidden="true" className="h-3.5 w-3.5" />
          {deal.items.length} product{deal.items.length === 1 ? "" : "s"}{" "}
          included
        </p>
        <p className="mt-2 line-clamp-2 min-h-10 break-words text-sm leading-5 text-muted-foreground">
          {deal.description}
        </p>
        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-2xl font-bold tracking-tight text-primary">
              {value.price}
            </span>
            {value.original && (
              <span className="text-sm text-muted-foreground">
                <span className="sr-only">Original value </span>
                <del>{value.original}</del>
              </span>
            )}
          </div>
          <div className="mb-3 mt-1 flex min-h-5 flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
            {value.saving && (
              <span className="font-semibold text-primary">
                Save {value.saving}
              </span>
            )}
            {endDate && Number.isFinite(endDate.getTime()) && (
              <span className="text-muted-foreground">
                Ends{" "}
                {endDate.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>
          <Button
            type="button"
            disabled={soldOut || !value.validPrice}
            onClick={addToCart}
            className="h-11 w-full rounded-xl px-3 motion-reduce:transition-none"
          >
            {quantity > 0 ? (
              <Check aria-hidden="true" />
            ) : (
              <ShoppingBag aria-hidden="true" />
            )}
            {soldOut
              ? "Currently unavailable"
              : !value.validPrice
                ? "Price unavailable"
                : atLimit
                  ? "View basket"
                  : quantity > 0
                    ? "Add another package"
                    : "Add package to basket"}
          </Button>
          <p
            aria-live="polite"
            className="mt-2 min-h-4 text-center text-xs text-muted-foreground"
          >
            {quantity > 0
              ? `${quantity} in your basket${atLimit ? " · maximum available" : ""}`
              : "View package for full contents"}
          </p>
        </div>
      </div>
    </article>
  );
}

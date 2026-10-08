import { useId } from "react";
import { Link } from "react-router-dom";
import { Check, Package, ShoppingBag } from "lucide-react";
import type { Deal } from "@/api/deals";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { dealPresentation } from "./dealPresentation";
import { cn } from "@/lib/utils";
import DealImage from "./DealImage";
import DealContents from "./DealContents";

interface DealCardProps {
  deal: Deal;
  variant?: "card" | "featured";
}

export default function DealCard({ deal, variant = "card" }: DealCardProps) {
  const titleId = useId();
  const { addDeal, deals, openCart } = useCart();
  const featured = variant === "featured";
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
      className={cn(
        "deal-card group h-full w-full min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft transition-colors hover:border-primary/40",
        featured
          ? "grid grid-rows-[auto_1fr] md:grid-cols-2 md:grid-rows-1"
          : "mx-auto flex max-w-sm flex-col sm:mx-0",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-secondary/60",
          featured
            ? "aspect-[4/3] md:aspect-auto md:min-h-[28rem]"
            : "aspect-[4/3] shrink-0",
        )}
      >
        <Link
          to={"/deals/" + deal.slug}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 block"
        >
          <DealImage
            src={deal.imageUrl}
            className={cn(
              "h-full w-full object-contain",
              featured && "p-4 sm:p-6",
            )}
          />
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
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          featured ? "p-5 sm:p-6 lg:p-8" : "p-4",
        )}
      >
        <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
          <span>Package deal</span>
          {deal.isFeatured && (
            <span className="text-muted-foreground">Featured</span>
          )}
        </div>
        <h3
          id={titleId}
          className={cn(
            "font-heading font-semibold",
            featured
              ? "text-2xl leading-tight lg:text-3xl"
              : "text-lg leading-6",
          )}
        >
          <Link
            to={"/deals/" + deal.slug}
            className={cn(
              "break-words rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !featured && "line-clamp-2 min-h-12",
            )}
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
        <p
          className={cn(
            "mt-2 break-words text-sm leading-5 text-muted-foreground",
            !featured && "line-clamp-1 min-h-5",
          )}
        >
          {deal.description}
        </p>
        {featured && <DealContents items={deal.items} />}
        <div className={cn("mt-auto", featured ? "pt-5" : "pt-3")}>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span
              className={cn(
                "font-bold tracking-tight text-primary",
                featured ? "text-3xl" : "text-2xl",
              )}
            >
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
              : featured
                ? "One package, all your favourites"
                : "View package for full contents"}
          </p>
        </div>
      </div>
    </article>
  );
}

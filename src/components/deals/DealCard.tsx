import { useId } from "react";
import { Link } from "react-router-dom";
import { Check, Package } from "lucide-react";
import type { Deal } from "@/api/deals";
import { useCart } from "@/context/CartContext";
import { BasketButton, SavingsTag } from "@/components/products/CatalogCardControls";
import { toast } from "sonner";
import { dealPresentation } from "./dealPresentation";
import { cn } from "@/lib/utils";
import DealImage from "./DealImage";
import DealContents from "./DealContents";

interface DealCardProps {
  deal: Deal;
  variant?: "card" | "featured";
  showContents?: boolean;
  imageAspectClassName?: string;
  compactAction?: boolean;
}

export default function DealCard({ deal, variant = "card", showContents = true, imageAspectClassName, compactAction = false }: DealCardProps) {
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

  if (featured) {
    return (
      <article
        aria-labelledby={titleId}
        className={cn(
          "deal-card flex h-full min-w-0 flex-col overflow-hidden bg-transparent text-white",
          showContents ? "rounded-2xl" : "rounded-t-2xl",
        )}
      >
        <div className={cn("relative isolate overflow-hidden rounded-t-2xl bg-forest-dark", imageAspectClassName ?? "aspect-[4/5] sm:aspect-[4/3]")}>
          <Link
            to={"/deals/" + deal.slug}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-0"
          >
            <DealImage
              src={deal.imageUrl}
              className="h-full w-full object-cover"
            />
          </Link>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/10" />
          {value.saving && !soldOut && (
            <SavingsTag overlay className={compactAction ? "absolute left-4 top-4 sm:left-5 sm:top-5" : "absolute left-5 top-5 sm:left-8 sm:top-6"}>
              Save {value.percent !== null ? `${value.percent}%` : value.saving}
            </SavingsTag>
          )}
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 text-white sm:p-7">
            <div className="min-w-0">
              <h3 id={titleId} className="font-heading text-2xl font-semibold leading-tight sm:text-3xl xl:text-4xl">
                <Link
                  to={"/deals/" + deal.slug}
                  className="line-clamp-2 break-words rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  title={deal.name}
                >
                  {deal.name}
                </Link>
              </h3>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-2xl font-semibold tracking-tight sm:text-3xl">{value.price}</span>
                {value.original && (
                  <span className="text-sm text-white/80">
                    <span className="sr-only">Original value </span>
                    <del>{value.original}</del>
                  </span>
                )}
              </div>
              <div className="shrink-0">
                <BasketButton
                  compact={compactAction}
                  disabled={soldOut || !value.validPrice}
                  onClick={addToCart}
                  icon={quantity > 0 ? <Check aria-hidden="true" className="h-4 w-4 shrink-0" /> : undefined}
                  className="motion-reduce:transition-none"
                >
                  {soldOut
                    ? "Currently unavailable"
                    : !value.validPrice
                      ? "Price unavailable"
                      : atLimit
                        ? "View basket"
                        : quantity > 0
                          ? "Add another package"
                          : "Add package to basket"}
                </BasketButton>
                <p aria-live="polite" className={cn("text-center text-xs text-white/90", quantity > 0 ? "mt-2" : "sr-only")}>
                  {quantity > 0 ? `${quantity} in your basket${atLimit ? " · maximum available" : ""}` : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
        {showContents && <DealContents items={deal.items} compact />}
      </article>
    );
  }

  return (
    <article
      aria-labelledby={titleId}
      className="deal-card group mx-auto flex h-full w-full min-w-0 max-w-sm flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft transition-colors hover:border-primary/40 sm:mx-0"
    >
      <div
        className="relative aspect-[4/3] shrink-0 overflow-hidden bg-secondary/60"
      >
        <Link
          to={"/deals/" + deal.slug}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 block"
        >
          <DealImage
            src={deal.imageUrl}
            className="h-full w-full object-contain"
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
        className="flex min-w-0 flex-1 flex-col p-4"
      >
        <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
          <span>Package deal</span>
          {deal.isFeatured && (
            <span className="text-muted-foreground">Featured</span>
          )}
        </div>
        <h3
          id={titleId}
          className="font-heading text-lg font-semibold leading-6"
        >
          <Link
            to={"/deals/" + deal.slug}
            className="line-clamp-2 min-h-12 break-words rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          className="mt-2 line-clamp-1 min-h-5 break-words text-sm leading-5 text-muted-foreground"
        >
          {deal.description}
        </p>
        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span
              className="text-2xl font-bold tracking-tight text-primary"
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
          <BasketButton
            compact
            disabled={soldOut || !value.validPrice}
            onClick={addToCart}
            icon={quantity > 0 ? <Check aria-hidden="true" className="h-4 w-4 shrink-0" /> : undefined}
            className="w-full motion-reduce:transition-none"
          >
            {soldOut
              ? "Currently unavailable"
              : !value.validPrice
                ? "Price unavailable"
                : atLimit
                  ? "View basket"
                  : quantity > 0
                    ? "Add another package"
                    : "Add package to basket"}
          </BasketButton>
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

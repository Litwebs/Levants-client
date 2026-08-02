import React from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Check,
  RefreshCw,
  ShoppingBasket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isPortalLoggedIn } from "@/lib/portalAuth";

export type OrderType = "one-time" | "subscription";

interface OrderTypeChoiceProps {
  selected?: OrderType;
  onChange?: (value: OrderType) => void;
  id?: string;
  compact?: boolean;
  showHeading?: boolean;
}

const choices = [
  {
    value: "one-time" as const,
    title: "One-time order",
    eyebrow: "Pay once",
    description:
      "Choose what you need today and check out without a recurring commitment.",
    detail: "Ideal for trying us or topping up",
    icon: ShoppingBasket,
    to: "/shop",
  },
  {
    value: "subscription" as const,
    title: "Flexible weekly subscription",
    eyebrow: "Sunday, Wednesday, or both",
    description:
      "Build a regular delivery you can update, pause, or cancel before the deadline.",
    detail: "No contract or long-term commitment",
    icon: RefreshCw,
    to: "/portal/subscriptions/new",
  },
];

const OrderTypeChoice: React.FC<OrderTypeChoiceProps> = ({
  selected,
  onChange,
  id,
  compact = false,
  showHeading = true,
}) => {
  const isInteractiveSelector = Boolean(selected && onChange);
  const subscriptionPath = "/portal/subscriptions/new";
  const subscriptionHref = isPortalLoggedIn()
    ? subscriptionPath
    : `/login?redirect=${encodeURIComponent(subscriptionPath)}`;

  if (compact && isInteractiveSelector) {
    const selectedChoice = choices.find((choice) => choice.value === selected);

    return (
      <fieldset id={id} className="min-w-0">
        <legend className="mb-2 text-sm font-medium text-foreground">
          How would you like to order?
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {choices.map((choice) => {
            const Icon = choice.icon;
            const isSelected = choice.value === selected;

            return (
              <button
                key={choice.value}
                type="button"
                className={cn(
                  "flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-secondary/50",
                )}
                aria-pressed={isSelected}
                onClick={() => onChange?.(choice.value)}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {choice.value === "one-time"
                    ? "One-time order"
                    : "Weekly subscription"}
                </span>
                {isSelected && (
                  <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {selectedChoice?.description}
        </p>
      </fieldset>
    );
  }

  const renderContent = (choice: (typeof choices)[number]) => {
    const Icon = choice.icon;
    const isSelected = selected === choice.value;

    return (
      <>
        <div className="flex items-start justify-between gap-4">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary group-hover:bg-primary/15",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          {isSelected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> Selected
            </span>
          )}
        </div>
        <div className={compact ? "mt-4" : "mt-5"}>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            {choice.eyebrow}
          </p>
          <h3 className="font-heading text-xl font-semibold text-foreground">
            {choice.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {choice.description}
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
            {choice.detail}
          </p>
        </div>
      </>
    );
  };

  return (
    <div id={id} className="scroll-mt-32">
      {showHeading && (
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Order your way
          </p>
          <h2 className="font-heading text-3xl font-semibold sm:text-4xl">
            Choose what works for you
          </h2>
          <p className="mt-3 text-muted-foreground">
            Place a one-time order or make fresh essentials automatic with a
            flexible weekly delivery.
          </p>
        </div>
      )}

      <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
        {choices.map((choice) => {
          const isSelected = selected === choice.value;
          const className = cn(
            "group min-h-[190px] w-full min-w-0 rounded-2xl border p-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-6",
            "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-medium",
            isSelected
              ? "border-primary bg-primary/[0.04] shadow-medium"
              : "border-border bg-card",
          );

          if (isInteractiveSelector) {
            return (
              <button
                key={choice.value}
                type="button"
                className={className}
                aria-pressed={isSelected}
                onClick={() => onChange?.(choice.value)}
              >
                {renderContent(choice)}
              </button>
            );
          }

          return (
            <Link
              key={choice.value}
              to={
                choice.value === "subscription"
                  ? subscriptionHref
                  : choice.to
              }
              className={className}
            >
              {renderContent(choice)}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTypeChoice;

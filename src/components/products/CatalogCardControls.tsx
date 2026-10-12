import * as React from "react";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface BasketButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  compact?: boolean;
  icon?: React.ReactNode;
}

export const BasketButton = React.forwardRef<HTMLButtonElement, BasketButtonProps>(
  ({ compact = false, icon, children, className, type = "button", ...props }, ref) => (
    <button
      {...props}
      ref={ref}
      type={type}
      className={cn(
        "btn-primary inline-flex min-w-0 items-center justify-center gap-2 overflow-hidden rounded-xl px-3 py-0 text-sm disabled:cursor-not-allowed disabled:opacity-50",
        compact ? "h-9" : "h-10",
        className,
      )}
    >
      {icon ?? <ShoppingBag aria-hidden="true" className="h-4 w-4 shrink-0" />}
      <span className="truncate">{children}</span>
    </button>
  ),
);
BasketButton.displayName = "BasketButton";

export function SavingsTag({
  children,
  overlay = false,
  className,
}: {
  children: React.ReactNode;
  overlay?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground",
        overlay && "border border-primary/40 bg-primary/65 font-semibold text-white backdrop-blur-md",
        className,
      )}
    >
      {children}
    </span>
  );
}

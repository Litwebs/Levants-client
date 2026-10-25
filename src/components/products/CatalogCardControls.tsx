import * as React from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BasketButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  compact?: boolean;
  icon?: React.ReactNode;
}

export const BasketButton = React.forwardRef<HTMLButtonElement, BasketButtonProps>(
  ({ compact = false, icon, children, className, type = "button", ...props }, ref) => (
    <Button
      {...props}
      ref={ref}
      type={type}
      size="touch"
      className={cn(
        "min-w-0 overflow-hidden px-3 text-sm disabled:cursor-not-allowed",
        compact ? "text-xs sm:text-sm" : "text-sm",
        className,
      )}
    >
      {icon ?? <ShoppingBag aria-hidden="true" className="h-4 w-4 shrink-0" />}
      <span className="truncate">{children}</span>
    </Button>
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

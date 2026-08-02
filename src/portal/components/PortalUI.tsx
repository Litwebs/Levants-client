import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center text-center py-16 px-6",
      className,
    )}
  >
    {icon && (
      <div className="mb-4 text-muted-foreground opacity-40">{icon}</div>
    )}
    <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
      {title}
    </h3>
    {description && (
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        {description}
      </p>
    )}
    {action}
  </div>
);

// ─── Card Skeleton ────────────────────────────────────────────────────────────
export const CardSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={cn("rounded-2xl border bg-card p-5 space-y-3", className)}>
    <Skeleton className="h-4 w-2/5" />
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-3 w-3/4" />
  </div>
);

// ─── List Skeleton ────────────────────────────────────────────────────────────
export const ListSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 4,
  className,
}) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="rounded-xl border bg-card p-4 flex items-center gap-4"
      >
        <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    ))}
  </div>
);

// ─── Page Header ──────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6",
      className,
    )}
  >
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

// ─── Confirmation Modal ───────────────────────────────────────────────────────
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  isLoading = false,
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-xl p-8">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-1">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing || isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isProcessing || isLoading}
          >
            {(isProcessing || isLoading) && (
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Order Timeline ───────────────────────────────────────────────────────────
import type { OrderStatus } from "@/portal/data/mockData";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const orderSteps: { status: OrderStatus; label: string }[] = [
  { status: "placed", label: "Order Placed" },
  { status: "confirmed", label: "Confirmed" },
  { status: "preparing", label: "Preparing" },
  { status: "out-for-delivery", label: "Out for Delivery" },
  { status: "delivered", label: "Delivered" },
];

const stepIndex = (status: OrderStatus) =>
  orderSteps.findIndex((s) => s.status === status);

export const OrderTimeline: React.FC<{ status: OrderStatus }> = ({
  status,
}) => {
  const current = stepIndex(status);
  const isCancelled = status === "cancelled" || status === "failed-delivery";

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {orderSteps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step.status}>
            <div className="flex flex-col items-center min-w-[70px]">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-colors",
                  isCancelled
                    ? "border-muted-foreground/30 text-muted-foreground/30"
                    : done
                      ? "bg-forest border-forest text-primary-foreground"
                      : active
                        ? "border-forest text-forest"
                        : "border-muted-foreground/30 text-muted-foreground/30",
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : active ? (
                  <Clock className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-1 text-center leading-tight",
                  active
                    ? "text-forest font-semibold"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < orderSteps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mt-3.5 min-w-[16px]",
                  i < current && !isCancelled ? "bg-forest" : "bg-border",
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Dashboard Summary Card ───────────────────────────────────────────────────
interface DashboardSummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const DashboardSummaryCard: React.FC<DashboardSummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  className,
  onClick,
}) => (
  <div
    className={cn(
      "rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md",
      onClick && "cursor-pointer",
      className,
    )}
    onClick={onClick}
  >
    <div className="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center text-forest mb-3">
      {icon}
    </div>
    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
      {title}
    </p>
    <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
    {subtitle && (
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    )}
  </div>
);

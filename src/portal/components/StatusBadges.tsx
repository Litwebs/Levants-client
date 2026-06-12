import React from "react";
import { cn } from "@/lib/utils";
import type {
  OrderStatus,
  PaymentStatus,
  SubscriptionStatus,
  DeliveryStatus,
  SupportStatus,
} from "@/portal/data/mockData";

// Shared dot+label badge — small colored dot followed by label text
const StatusDot: React.FC<{
  label: string;
  dotClass: string;
  className?: string;
}> = ({ label, dotClass, className }) => (
  <span className={cn("inline-flex items-center gap-1.5", className)}>
    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", dotClass)} />
    <span className="text-xs font-medium text-foreground">{label}</span>
  </span>
);

// ─── Order Status Badge ───────────────────────────────────────────────────────
const orderStatusConfig: Record<OrderStatus, { label: string; dot: string }> = {
  placed: { label: "Placed", dot: "bg-blue-500" },
  confirmed: { label: "Confirmed", dot: "bg-indigo-500" },
  preparing: { label: "Preparing", dot: "bg-amber-400" },
  "out-for-delivery": { label: "Out for Delivery", dot: "bg-orange-500" },
  delivered: { label: "Delivered", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", dot: "bg-gray-400" },
  "failed-delivery": { label: "Failed Delivery", dot: "bg-red-500" },
  rescheduled: { label: "Rescheduled", dot: "bg-purple-500" },
};

export const OrderStatusBadge: React.FC<{
  status: OrderStatus;
  className?: string;
}> = ({ status, className }) => {
  const cfg = orderStatusConfig[status] ?? {
    label: status,
    dot: "bg-gray-400",
  };
  return (
    <StatusDot label={cfg.label} dotClass={cfg.dot} className={className} />
  );
};

// ─── Payment Status Badge ─────────────────────────────────────────────────────
const paymentStatusConfig: Record<
  PaymentStatus,
  { label: string; dot: string }
> = {
  paid: { label: "Paid", dot: "bg-emerald-500" },
  pending: { label: "Pending", dot: "bg-amber-400" },
  failed: { label: "Failed", dot: "bg-red-500" },
  refunded: { label: "Refunded", dot: "bg-gray-400" },
};

export const PaymentStatusBadge: React.FC<{
  status: PaymentStatus;
  className?: string;
}> = ({ status, className }) => {
  const cfg = paymentStatusConfig[status] ?? {
    label: status,
    dot: "bg-gray-400",
  };
  return (
    <StatusDot label={cfg.label} dotClass={cfg.dot} className={className} />
  );
};

// ─── Subscription Status Badge ────────────────────────────────────────────────
const subStatusConfig: Record<
  SubscriptionStatus,
  { label: string; dot: string }
> = {
  active: { label: "Active", dot: "bg-emerald-500" },
  paused: { label: "Paused", dot: "bg-amber-400" },
  cancelled: { label: "Cancelled", dot: "bg-gray-400" },
};

export const SubscriptionStatusBadge: React.FC<{
  status: SubscriptionStatus;
  className?: string;
}> = ({ status, className }) => {
  const cfg = subStatusConfig[status] ?? { label: status, dot: "bg-gray-400" };
  return (
    <StatusDot label={cfg.label} dotClass={cfg.dot} className={className} />
  );
};

// ─── Delivery Status Badge ────────────────────────────────────────────────────
const deliveryStatusConfig: Record<
  DeliveryStatus,
  { label: string; dot: string }
> = {
  scheduled: { label: "Scheduled", dot: "bg-blue-500" },
  preparing: { label: "Preparing", dot: "bg-amber-400" },
  "out-for-delivery": { label: "Out for Delivery", dot: "bg-orange-500" },
  delivered: { label: "Delivered", dot: "bg-emerald-500" },
  failed: { label: "Failed", dot: "bg-red-500" },
  rescheduled: { label: "Rescheduled", dot: "bg-purple-500" },
};

export const DeliveryStatusBadge: React.FC<{
  status: DeliveryStatus;
  className?: string;
}> = ({ status, className }) => {
  const cfg = deliveryStatusConfig[status] ?? {
    label: status,
    dot: "bg-gray-400",
  };
  return (
    <StatusDot label={cfg.label} dotClass={cfg.dot} className={className} />
  );
};

// ─── Support Status Badge ─────────────────────────────────────────────────────
const supportStatusConfig: Record<
  SupportStatus,
  { label: string; dot: string }
> = {
  open: { label: "Open", dot: "bg-blue-500" },
  "in-review": { label: "In Review", dot: "bg-amber-400" },
  resolved: { label: "Resolved", dot: "bg-emerald-500" },
  closed: { label: "Closed", dot: "bg-gray-400" },
};

export const SupportStatusBadge: React.FC<{
  status: SupportStatus;
  className?: string;
}> = ({ status, className }) => {
  const cfg = supportStatusConfig[status] ?? {
    label: status,
    dot: "bg-gray-400",
  };
  return (
    <StatusDot label={cfg.label} dotClass={cfg.dot} className={className} />
  );
};

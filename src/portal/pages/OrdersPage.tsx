import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  ClipboardList,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/api/client";
import { portalOrdersApi, type PortalOrder } from "@/api/portalOrders";
import {
  EmptyState,
  PageHeader,
  ListSkeleton,
} from "@/portal/components/PortalUI";

const PAGE_SIZE = 10;

type ApiOrderStatus =
  | "paid"
  | "failed"
  | "partially_refunded"
  | "refunded"
  | "refund_failed"
  | "ordered"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "returned";

const ORDER_STATUS_OPTIONS: Array<{
  value: "all" | ApiOrderStatus;
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "partially_refunded", label: "Partially Refunded" },
  { value: "refunded", label: "Refunded" },
  { value: "refund_failed", label: "Refund Failed" },
  { value: "ordered", label: "Ordered" },
  { value: "dispatched", label: "Dispatched" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "returned", label: "Returned" },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatMoney = (amount: number, currency = "GBP") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount || 0);

const formatStatusLabel = (status?: string) => {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
};

const getOrderStatusBadgeClass = (status?: string) => {
  switch (status) {
    case "paid":
    case "refunded":
      return "bg-forest/10 text-forest dark:bg-emerald-500/20 dark:text-emerald-200";
    case "partially_refunded":
      return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200";
    case "failed":
    case "refund_failed":
      return "bg-destructive/10 text-destructive dark:bg-red-500/20 dark:text-red-200";
    default:
      return "bg-foreground/5 text-foreground dark:bg-slate-500/20 dark:text-slate-100";
  }
};

const getDeliveryStatusBadgeClass = (status?: string) => {
  switch (status) {
    case "delivered":
      return "bg-forest/10 text-forest dark:bg-emerald-500/20 dark:text-emerald-200";
    case "ordered":
      return "bg-foreground/5 text-foreground dark:bg-slate-500/20 dark:text-slate-100";
    case "dispatched":
    case "in_transit":
      return "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200";
    case "returned":
      return "bg-destructive/10 text-destructive dark:bg-red-500/20 dark:text-red-200";
    default:
      return "bg-foreground/5 text-foreground dark:bg-slate-500/20 dark:text-slate-100";
  }
};

const formatDeliveryAddress = (order: PortalOrder) => {
  const a = order.deliveryAddress;
  return [a.line1, a.line2, a.city, a.postcode, a.country]
    .filter(Boolean)
    .join(", ");
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<PortalOrder[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ApiOrderStatus>(
    "all",
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await portalOrdersApi.list({
          page,
          pageSize: PAGE_SIZE,
          status: statusFilter === "all" ? undefined : statusFilter,
          search: debouncedSearch || undefined,
        });

        const data = (res as any)?.data;
        if (!cancelled) {
          setOrders(data?.orders || []);
          setTotal(Number(data?.meta?.total || 0));
        }
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiError
            ? err.message
            : "Failed to load your orders. Please try again.";
        setError(msg);
        setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadOrders();

    return () => {
      cancelled = true;
    };
  }, [page, statusFilter, debouncedSearch]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );
  const showPagination = total > PAGE_SIZE;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="My Orders"
        description="View and manage your order history"
        action={
          <Button asChild size="sm">
            <Link to="/portal/products">Place New Order</Link>
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "all" | ApiOrderStatus)}
        >
          <SelectTrigger className="w-full sm:w-56">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading orders...
          </div>
          <ListSkeleton rows={4} />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-16 w-16" />}
          title="No orders found"
          description="Try adjusting your search or filter, or place your first order."
          action={
            <Button asChild>
              <Link to="/portal/products">Browse Products</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {order.orderId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getOrderStatusBadgeClass(order.status)}`}
                    >
                      {formatStatusLabel(order.status)}
                    </span>
                    {order.deliveryStatus && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getDeliveryStatusBadgeClass(order.deliveryStatus)}`}
                      >
                        {formatStatusLabel(order.deliveryStatus)}
                      </span>
                    )}
                    <span className="text-sm font-bold text-foreground">
                      {formatMoney(order.total, order.currency || "GBP")}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                  {order.items
                    .map((i) => `${i.name} x${i.quantity}`)
                    .join(", ")}
                </p>

                <p className="text-xs text-muted-foreground mb-3">
                  {formatDeliveryAddress(order)}
                </p>

                <Button asChild variant="outline" size="sm">
                  <Link to={`/portal/orders/${order._id}`}>
                    View details
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          {showPagination && (
            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Showing page {page} of {totalPages} ({total} orders)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersPage;

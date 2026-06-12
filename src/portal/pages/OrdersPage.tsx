import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, ClipboardList, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockOrders, type OrderStatus } from "@/portal/data/mockData";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/portal/components/StatusBadges";
import { EmptyState, PageHeader } from "@/portal/components/PortalUI";

const OrdersPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");

  const filtered = mockOrders.filter((o) => {
    const matchesSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) =>
        i.productName.toLowerCase().includes(search.toLowerCase()),
      );
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "all" | OrderStatus)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="placed">Placed</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="failed-delivery">Failed Delivery</SelectItem>
            <SelectItem value="rescheduled">Rescheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
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
        <div className="space-y-3">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-shadow"
            >
              {/* Top row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {order.orderNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">{order.date}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                  <span className="text-sm font-bold text-foreground">
                    {order.total}
                  </span>
                </div>
              </div>

              {/* Products summary */}
              <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                {order.items
                  .map((i) => `${i.productName} ×${i.quantity}`)
                  .join(", ")}
              </p>

              {/* Delivery address */}
              <p className="text-xs text-muted-foreground mb-3">
                {order.deliveryAddress}
              </p>

              {/* View details */}
              <Button asChild variant="outline" size="sm">
                <Link to={`/portal/orders/${order.id}`}>
                  View details
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;

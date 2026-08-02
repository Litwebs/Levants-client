import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  RefreshCcw,
  AlertCircle,
  Plus,
  ShoppingBag,
  ArrowRight,
  CreditCard,
  CalendarDays,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortalCustomer } from "@/portal/context/CustomerContext";
import { DashboardSummaryCard } from "@/portal/components/PortalUI";
import {
  SubscriptionStatusBadge,
  OrderStatusBadge,
} from "@/portal/components/StatusBadges";
import type { OrderStatus } from "@/portal/data/mockData";
import { ApiError } from "@/api/client";
import { portalOrdersApi, type PortalOrder } from "@/api/portalOrders";
import { portalPaymentsApi, type PortalPayment } from "@/api/portalPayments";
import {
  portalSubscriptionsApi,
  type PortalSubscription,
} from "@/api/portalSubscriptions";

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (amount: number, currency = "GBP") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount || 0);

const getDisplayNextDeliveryDate = (subscription: PortalSubscription) =>
  subscription.upcomingDeliveryDate ?? subscription.nextDeliveryDate;

const getOrderRefundSummary = (order?: PortalOrder | null) => {
  if (!order) return { before: 0, refunded: 0, after: 0 };
  const before = Number(order.amountPaid ?? order.total ?? 0);
  const refundedFromEntries = (order.refunds || []).reduce(
    (sum, refund) => sum + Number(refund.amount ?? refund.amountMinor ?? 0),
    0,
  );
  const refunded =
    refundedFromEntries > 0
      ? refundedFromEntries
      : order.refund?.refundedAt
        ? before
        : 0;
  const after = Math.max(before - refunded, 0);
  return { before, refunded, after };
};

const DashboardPage: React.FC = () => {
  const { customer } = usePortalCustomer();
  const firstName = customer?.firstName || "there";

  const [subscriptions, setSubscriptions] = useState<PortalSubscription[]>([]);
  const [orders, setOrders] = useState<PortalOrder[]>([]);
  const [payments, setPayments] = useState<PortalPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const [subscriptionsRes, ordersRes, paymentsRes] = await Promise.all([
          portalSubscriptionsApi.list({ page: 1, pageSize: 100 }),
          portalOrdersApi.list({ page: 1, pageSize: 5 }),
          portalPaymentsApi.list({ page: 1, pageSize: 10 }),
        ]);

        if (cancelled) return;

        setSubscriptions((subscriptionsRes as any)?.data?.subscriptions || []);
        setOrders((ordersRes as any)?.data?.orders || []);
        setPayments((paymentsRes as any)?.data?.payments || []);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiError
            ? err.message
            : "Failed to load dashboard data.";
        setError(msg);
        setSubscriptions([]);
        setOrders([]);
        setPayments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.status === "active"),
    [subscriptions],
  );
  const pausedSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.status === "paused"),
    [subscriptions],
  );
  const nextSubscription = useMemo(
    () =>
      [...subscriptions]
        .filter(
          (s) =>
            s.status !== "cancelled" && Boolean(getDisplayNextDeliveryDate(s)),
        )
        .sort((a, b) =>
          String(getDisplayNextDeliveryDate(a)).localeCompare(
            String(getDisplayNextDeliveryDate(b)),
          ),
        )[0] || null,
    [subscriptions],
  );
  const outstandingPayments = useMemo(
    () =>
      payments.filter(
        (payment) =>
          payment.status === "failed" || payment.status === "pending",
      ),
    [payments],
  );
  const recentOrders = orders.slice(0, 5);

  const summaryCards = [
    {
      title: "Active Subscriptions",
      value: activeSubscriptions.length,
      subtitle: "Running now",
      icon: <RefreshCcw className="h-5 w-5" />,
      onClick: () => (window.location.href = "/portal/subscriptions"),
    },
    {
      title: "Next Delivery",
      value: nextSubscription
        ? formatDate(getDisplayNextDeliveryDate(nextSubscription))
        : "—",
      subtitle: nextSubscription
        ? `${nextSubscription.items.length} item${nextSubscription.items.length === 1 ? "" : "s"}`
        : "None scheduled",
      icon: <CalendarDays className="h-5 w-5" />,
      onClick: () => (window.location.href = "/portal/subscriptions"),
    },
    {
      title: "Outstanding",
      value: outstandingPayments.length,
      subtitle:
        outstandingPayments.length === 0 ? "All paid up!" : "Payments due",
      icon: <AlertCircle className="h-5 w-5" />,
      className: outstandingPayments.length > 0 ? "border-destructive/40" : "",
      onClick: () => (window.location.href = "/portal/payments"),
    },
    {
      title: "Paused Plans",
      value: pausedSubscriptions.length,
      subtitle:
        pausedSubscriptions.length === 0 ? "All active" : "Tap to resume",
      icon: <ShoppingBag className="h-5 w-5" />,
      onClick: () => (window.location.href = "/portal/subscriptions"),
    },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Good morning, {firstName} 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your subscriptions and delivery schedule
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/portal/subscriptions/new">
            <Plus className="h-4 w-4" />
            New Subscription
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <DashboardSummaryCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            className={card.className}
            onClick={card.onClick}
          />
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Active subscriptions list */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4 text-forest" />
                  My Subscriptions
                </CardTitle>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-forest"
                >
                  <Link to="/portal/subscriptions">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {subscriptions.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    No subscriptions yet. Set up a recurring delivery plan.
                  </p>
                  <Button asChild size="sm">
                    <Link to="/portal/subscriptions/new">
                      <Plus className="h-4 w-4" />
                      Create Subscription
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub._id}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {sub.subscriptionNumber || sub._id}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                          {sub.frequency === "every_two_weeks"
                            ? "Every 2 weeks"
                            : sub.frequency}
                          {" · "}Next:{" "}
                          {formatDate(getDisplayNextDeliveryDate(sub))}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <SubscriptionStatusBadge
                          status={sub.status}
                          isCancellationScheduled={sub.isCancellationScheduled}
                        />
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                        >
                          <Link to={`/portal/subscriptions/${sub._id}`}>
                            Manage
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent one-time orders */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-forest" />
                  Recent Orders
                </CardTitle>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-forest"
                >
                  <Link to="/portal/orders">
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentOrders.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No orders yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentOrders.map((order) => {
                    const refundSummary = getOrderRefundSummary(order);
                    return (
                      <div
                        key={order._id}
                        className="px-5 py-3.5 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-foreground truncate min-w-0">
                            {order.orderId}
                          </p>
                          <OrderStatusBadge
                            status={order.status as OrderStatus}
                          />
                        </div>

                        {order.orderType === "subscription_generated" && (
                          <div className="mt-2">
                            <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-[11px] font-medium text-sky-800 dark:bg-sky-500/20 dark:text-sky-200">
                              Subscription generated
                            </span>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(order.createdAt)}
                        </p>
                        {refundSummary.refunded > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Refunded{" "}
                            {formatMoney(
                              refundSummary.refunded,
                              order.currency || "GBP",
                            )}{" "}
                            · Before{" "}
                            {formatMoney(
                              refundSummary.before,
                              order.currency || "GBP",
                            )}{" "}
                            · After{" "}
                            {formatMoney(
                              refundSummary.after,
                              order.currency || "GBP",
                            )}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-3 mt-3">
                          <span className="text-sm font-semibold text-foreground">
                            {formatMoney(order.total, order.currency || "GBP")}
                          </span>
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                          >
                            <Link to={`/portal/orders/${order._id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming delivery */}
          {nextSubscription && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-forest" />
                  Upcoming Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xl font-bold text-foreground">
                  {formatDate(getDisplayNextDeliveryDate(nextSubscription))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {nextSubscription.items.length} item
                  {nextSubscription.items.length === 1 ? "" : "s"} scheduled
                </p>
                <p className="text-xs text-muted-foreground">
                  {nextSubscription.deliveryAddress.line1},{" "}
                  {nextSubscription.deliveryAddress.city}
                </p>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full mt-1"
                >
                  <Link to="/portal/subscriptions">Manage subscriptions</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-forest" />
                Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {outstandingPayments.length > 0 ? (
                <>
                  <p className="text-sm text-destructive font-medium">
                    {outstandingPayments.length} payment
                    {outstandingPayments.length > 1 ? "s" : ""} need attention
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="w-full"
                    variant="destructive"
                  >
                    <Link to="/portal/payments">Resolve now</Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    All payments up to date.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Link to="/portal/payments">View history</Link>
                  </Button>
                </>
              )}
              <div className="pt-2 text-xs text-muted-foreground">
                {payments.length} payment record
                {payments.length === 1 ? "" : "s"} loaded from live data.
              </div>
            </CardContent>
          </Card>

          {/* One-time order nudge */}
          <Card className="border-dashed">
            <CardContent className="pt-5 text-center space-y-2">
              <ExternalLink className="h-6 w-6 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Need a one-time order?
              </p>
              <p className="text-xs text-muted-foreground">
                Visit the shop to order without a subscription.
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href="/shop">
                  Go to Shop
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

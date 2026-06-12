import React from "react";
import { Link } from "react-router-dom";
import {
  RefreshCcw,
  Truck,
  AlertCircle,
  Plus,
  ShoppingBag,
  ArrowRight,
  CreditCard,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  mockCustomer,
  mockOrders,
  mockSubscriptions,
  mockDeliveries,
  mockPayments,
} from "@/portal/data/mockData";
import { DashboardSummaryCard } from "@/portal/components/PortalUI";
import {
  SubscriptionStatusBadge,
  PaymentStatusBadge,
  DeliveryStatusBadge,
  OrderStatusBadge,
} from "@/portal/components/StatusBadges";

const DashboardPage: React.FC = () => {
  const activeSubscriptions = mockSubscriptions.filter(
    (s) => s.status === "active",
  );
  const pausedSubscriptions = mockSubscriptions.filter(
    (s) => s.status === "paused",
  );
  const nextDelivery = mockDeliveries.find(
    (d) => d.status === "scheduled" || d.status === "out-for-delivery",
  );
  const outstandingPayments = mockPayments.filter(
    (p) => p.status === "failed" || p.status === "pending",
  );
  const recentOrders = mockOrders.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Good morning, {mockCustomer.name.split(" ")[0]} 👋
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
        <DashboardSummaryCard
          title="Active Subscriptions"
          value={activeSubscriptions.length}
          subtitle="Running now"
          icon={<RefreshCcw className="h-5 w-5" />}
          onClick={() => (window.location.href = "/portal/subscriptions")}
        />
        <DashboardSummaryCard
          title="Next Delivery"
          value={nextDelivery ? nextDelivery.date : "—"}
          subtitle={nextDelivery ? nextDelivery.window : "None scheduled"}
          icon={<Truck className="h-5 w-5" />}
          onClick={() => (window.location.href = "/portal/deliveries")}
        />
        <DashboardSummaryCard
          title="Outstanding"
          value={outstandingPayments.length}
          subtitle={
            outstandingPayments.length === 0 ? "All paid up!" : "Payments due"
          }
          icon={<AlertCircle className="h-5 w-5" />}
          className={
            outstandingPayments.length > 0 ? "border-destructive/40" : ""
          }
          onClick={() => (window.location.href = "/portal/payments")}
        />
        <DashboardSummaryCard
          title="Paused Plans"
          value={pausedSubscriptions.length}
          subtitle={
            pausedSubscriptions.length === 0 ? "All active" : "Tap to resume"
          }
          icon={<CalendarDays className="h-5 w-5" />}
          onClick={() => (window.location.href = "/portal/subscriptions")}
        />
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
              {mockSubscriptions.length === 0 ? (
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
                  {mockSubscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {sub.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                          {sub.frequency === "fortnightly"
                            ? "Every 2 weeks"
                            : sub.frequency}
                          {" · "}Next: {sub.nextDelivery}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <SubscriptionStatusBadge status={sub.status} />
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                        >
                          <Link to={`/portal/subscriptions/${sub.id}`}>
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
                  Recent One-Time Orders
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
              <div className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <OrderStatusBadge status={order.status} />
                      <span className="text-sm font-semibold text-foreground hidden sm:block">
                        {order.total}
                      </span>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                      >
                        <Link to={`/portal/orders/${order.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Next delivery */}
          {nextDelivery && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Truck className="h-4 w-4 text-forest" />
                  Next Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xl font-bold text-foreground">
                  {nextDelivery.date}
                </p>
                <p className="text-xs text-muted-foreground">
                  {nextDelivery.window}
                </p>
                <DeliveryStatusBadge status={nextDelivery.status} />
                <p className="text-xs text-muted-foreground">
                  {nextDelivery.productsSummary}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {nextDelivery.address}
                </p>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full mt-1"
                >
                  <Link to="/portal/deliveries">View all deliveries</Link>
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

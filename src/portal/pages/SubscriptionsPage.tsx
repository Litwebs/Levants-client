import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  RefreshCcw,
  ArrowRight,
  Pause,
  Play,
  Trash2,
  CalendarDays,
  MapPin,
  CreditCard,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockSubscriptions, type Subscription } from "@/portal/data/mockData";
import {
  SubscriptionStatusBadge,
  PaymentStatusBadge,
} from "@/portal/components/StatusBadges";
import {
  ConfirmationModal,
  EmptyState,
  PageHeader,
} from "@/portal/components/PortalUI";

const SubscriptionCard: React.FC<{ subscription: Subscription }> = ({
  subscription: sub,
}) => {
  const [pauseOpen, setPauseOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const frequencyLabel =
    sub.frequency === "fortnightly" ? "Every 2 weeks" : sub.frequency;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Coloured top bar based on status */}
      <div
        className={
          sub.status === "active"
            ? "h-1 bg-forest"
            : sub.status === "paused"
              ? "h-1 bg-amber-400"
              : "h-1 bg-muted"
        }
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCcw className="h-4 w-4 text-forest flex-shrink-0" />
              <h3 className="text-base font-semibold text-foreground leading-tight truncate">
                {sub.name}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground capitalize ml-6">
              {frequencyLabel} · Every {sub.preferredDay}
            </p>
          </div>
          <SubscriptionStatusBadge status={sub.status} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
              Per delivery
            </p>
            <p className="text-sm font-bold text-foreground">{sub.total}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
              Next delivery
            </p>
            <p className="text-sm font-semibold text-foreground">
              {sub.nextDelivery}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
              Items
            </p>
            <p className="text-sm font-bold text-foreground">
              {sub.items.length}
            </p>
          </div>
        </div>

        {/* Products */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Products
            </p>
          </div>
          <div className="space-y-1.5">
            {sub.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground">
                  {item.productName}
                  <span className="text-muted-foreground">
                    {" "}
                    ({item.variant}) ×{item.quantity}
                  </span>
                </span>
                <span className="text-muted-foreground text-xs font-medium">
                  {item.pricePerDelivery}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator className="mb-4" />

        {/* Meta info */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="flex items-start gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-muted-foreground">Address</p>
              <p className="font-medium text-foreground truncate">
                {sub.deliveryAddress}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-muted-foreground mb-0.5">Payment</p>
              <PaymentStatusBadge status={sub.paymentStatus} />
            </div>
          </div>
          <div className="flex items-start gap-1.5 col-span-2">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-muted-foreground">Member since</p>
              <p className="font-medium text-foreground">{sub.startDate}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="flex-1 sm:flex-none">
            <Link to={`/portal/subscriptions/${sub.id}`}>
              Manage
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          {sub.status === "active" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPauseOpen(true)}
            >
              <Pause className="h-3.5 w-3.5" />
              Pause
            </Button>
          )}
          {sub.status === "paused" && (
            <Button variant="outline" size="sm">
              <Play className="h-3.5 w-3.5" />
              Resume
            </Button>
          )}
          {sub.status !== "cancelled" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 ml-auto"
              onClick={() => setCancelOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation modals */}
      <ConfirmationModal
        open={pauseOpen}
        onOpenChange={setPauseOpen}
        title="Pause Subscription?"
        description={`Pausing "${sub.name}" will stop deliveries from the next scheduled date. You can resume at any time.`}
        confirmLabel="Pause Subscription"
        onConfirm={() => {}}
      />
      <ConfirmationModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Subscription?"
        description={`Are you sure you want to cancel "${sub.name}"? This will stop all future deliveries.`}
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Subscription"
        variant="destructive"
        onConfirm={() => {}}
      />
    </div>
  );
};

const SubscriptionsPage: React.FC = () => {
  const active = mockSubscriptions.filter((s) => s.status === "active");
  const paused = mockSubscriptions.filter((s) => s.status === "paused");
  const cancelled = mockSubscriptions.filter((s) => s.status === "cancelled");

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="My Subscriptions"
        description="Manage your recurring dairy deliveries"
        action={
          <Button asChild size="sm">
            <Link to="/portal/subscriptions/new">
              <Plus className="h-4 w-4" />
              New Subscription
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue="active">
        <TabsList className="mb-5">
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="paused">Paused ({paused.length})</TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {active.length === 0 ? (
            <EmptyState
              icon={<RefreshCcw className="h-16 w-16" />}
              title="No active subscriptions"
              description="Create a subscription to get dairy products delivered on a schedule that works for you."
              action={
                <Button asChild>
                  <Link to="/portal/subscriptions/new">
                    Create Subscription
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {active.map((sub) => (
                <SubscriptionCard key={sub.id} subscription={sub} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paused">
          {paused.length === 0 ? (
            <EmptyState
              icon={<RefreshCcw className="h-16 w-16" />}
              title="No paused subscriptions"
            />
          ) : (
            <div className="space-y-4">
              {paused.map((sub) => (
                <SubscriptionCard key={sub.id} subscription={sub} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled">
          {cancelled.length === 0 ? (
            <EmptyState
              icon={<RefreshCcw className="h-16 w-16" />}
              title="No cancelled subscriptions"
            />
          ) : (
            <div className="space-y-4">
              {cancelled.map((sub) => (
                <SubscriptionCard key={sub.id} subscription={sub} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionsPage;

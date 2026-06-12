import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  CalendarDays,
  MapPin,
  Pause,
  Play,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mockSubscriptions } from "@/portal/data/mockData";
import {
  SubscriptionStatusBadge,
  PaymentStatusBadge,
} from "@/portal/components/StatusBadges";
import { ConfirmationModal } from "@/portal/components/PortalUI";

const upcomingDeliveries = [
  { date: "18 Jun 2024", status: "Scheduled" },
  { date: "25 Jun 2024", status: "Scheduled" },
  { date: "2 Jul 2024", status: "Scheduled" },
  { date: "9 Jul 2024", status: "Scheduled" },
];

const SubscriptionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const sub =
    mockSubscriptions.find((s) => s.id === id) ?? mockSubscriptions[0];

  const [pauseOpen, setPauseOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [removeProductOpen, setRemoveProductOpen] = useState(false);
  const [items, setItems] = useState(
    sub.items.map((item) => ({ ...item, qty: item.quantity })),
  );
  const [frequency, setFrequency] = useState(sub.frequency);
  const [deliveryDay, setDeliveryDay] = useState(sub.preferredDay);

  const updateQty = (idx: number, delta: number) =>
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, qty: Math.max(1, item.qty + delta) } : item,
      ),
    );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link to="/portal/subscriptions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-xl font-bold text-foreground truncate">
            {sub.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            Started {sub.startDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SubscriptionStatusBadge status={sub.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Products */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">
                Products in Subscription
              </h3>
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" />
                Add product
              </Button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.variant} · {item.pricePerDelivery}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(idx, -1)}
                      className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center font-medium">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(idx, 1)}
                      className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => setRemoveProductOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between text-sm font-bold">
              <span>Per delivery</span>
              <span>{sub.total}</span>
            </div>
          </div>

          {/* Schedule settings */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-forest" />
              Delivery Schedule
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Frequency
                </p>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="fortnightly">Every 2 weeks</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Preferred Day
                </p>
                <Select value={deliveryDay} onValueChange={setDeliveryDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ].map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button size="sm" className="mt-4">
              Save Changes
            </Button>
          </div>

          {/* Delivery address */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-forest" />
              Delivery Address
            </h3>
            <p className="text-sm text-foreground mb-3">
              {sub.deliveryAddress}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link to="/portal/addresses">Change address</Link>
            </Button>
          </div>

          {/* Upcoming deliveries */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-3">
              Upcoming Deliveries
            </h3>
            <div className="space-y-2">
              {upcomingDeliveries.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0"
                >
                  <span className="text-foreground">{d.date}</span>
                  <span className="text-xs text-blue-600 font-medium">
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: quick actions */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-3">
              Subscription Actions
            </h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">
                  Payment status
                </p>
                <PaymentStatusBadge status={sub.paymentStatus} />
              </div>
              <Separator />
              {sub.status === "active" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setPauseOpen(true)}
                >
                  <Pause className="h-3.5 w-3.5" />
                  Pause Subscription
                </Button>
              ) : sub.status === "paused" ? (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => setResumeOpen(true)}
                >
                  <Play className="h-3.5 w-3.5" />
                  Resume Subscription
                </Button>
              ) : null}
              {sub.status !== "cancelled" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:bg-destructive/10"
                  onClick={() => setCancelOpen(true)}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmationModal
        open={pauseOpen}
        onOpenChange={setPauseOpen}
        title="Pause Subscription?"
        description="Deliveries will be paused from the next scheduled date. You can resume anytime."
        confirmLabel="Pause"
        onConfirm={() => {}}
      />
      <ConfirmationModal
        open={resumeOpen}
        onOpenChange={setResumeOpen}
        title="Resume Subscription?"
        description="Your subscription will resume from the next available delivery date."
        confirmLabel="Resume"
        onConfirm={() => {}}
      />
      <ConfirmationModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Subscription?"
        description="This will permanently cancel your subscription and stop all future deliveries."
        confirmLabel="Yes, Cancel"
        cancelLabel="Keep Subscription"
        variant="destructive"
        onConfirm={() => {}}
      />
      <ConfirmationModal
        open={removeProductOpen}
        onOpenChange={setRemoveProductOpen}
        title="Remove Product?"
        description="This product will be removed from your next and all future deliveries in this subscription."
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={() => setItems((prev) => prev.slice(0, -1))}
      />
    </div>
  );
};

export default SubscriptionDetailPage;

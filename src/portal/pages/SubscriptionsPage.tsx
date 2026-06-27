import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  RefreshCcw,
  ArrowRight,
  Play,
  CalendarDays,
  MapPin,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionStatusBadge } from "@/portal/components/StatusBadges";
import {
  ConfirmationModal,
  EmptyState,
  PageHeader,
} from "@/portal/components/PortalUI";
import { cn } from "@/lib/utils";
import { ApiError } from "@/api/client";
import {
  portalSubscriptionsApi,
  type PortalSubscription,
} from "@/api/portalSubscriptions";

const dayName = (day: number) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[day] || "Unknown";
};

const frequencyLabel = (value: string) => {
  if (value === "every_two_weeks") return "Every 2 weeks";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    value || 0,
  );

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const statusAccent: Record<string, string> = {
  active: "border-l-forest",
  paused: "border-l-amber-400",
  cancelled: "border-l-border",
};

const SubscriptionCard: React.FC<{
  subscription: PortalSubscription;
  onResume: (id: string) => Promise<void>;
  actionLoadingId: string | null;
}> = ({ subscription: sub, onResume, actionLoadingId }) => {
  const [resumeOpen, setResumeOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const total = sub.items.reduce(
    (sum, item) =>
      sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
    0,
  );

  const address = [
    sub.deliveryAddress?.line1,
    sub.deliveryAddress?.city,
    sub.deliveryAddress?.postcode,
  ]
    .filter(Boolean)
    .join(", ");

  const isBusy = actionLoadingId === sub._id;

  return (
    <div
      className={cn(
        "bg-card border border-border border-l-4 rounded-2xl overflow-hidden transition-shadow hover:shadow-md",
        statusAccent[sub.status] ?? "border-l-border",
      )}
    >
      <div className="p-4 sm:p-5">
        {/* ── Top row ───────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <RefreshCcw className="h-3.5 w-3.5 text-forest flex-shrink-0" />
              <span className="text-sm font-semibold text-foreground leading-tight">
                {sub.subscriptionNumber ??
                  `SUB-${sub._id.slice(-6).toUpperCase()}`}
              </span>
              <SubscriptionStatusBadge status={sub.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-[22px]">
              {frequencyLabel(sub.frequency)} · Every{" "}
              {dayName(sub.preferredDeliveryDay)}
            </p>
          </div>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5 rounded-xl bg-muted/40 px-3 py-2.5">
            <CalendarDays className="h-4 w-4 text-forest flex-shrink-0" />
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Next delivery
              </p>
              <p
                className={cn(
                  "text-sm font-semibold",
                  sub.status === "paused"
                    ? "text-amber-500"
                    : "text-foreground",
                )}
              >
                {sub.status === "paused"
                  ? "Paused"
                  : formatDate(sub.nextDeliveryDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 px-3 py-2.5">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Per delivery
              </p>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(total)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 px-3 py-2.5 overflow-hidden">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {sub.items.length === 1
                  ? "1 product"
                  : `${sub.items.length} products`}
              </p>
              <p className="text-sm text-foreground truncate">
                {sub.items.map((i) => i.name).join(", ")}
              </p>
            </div>
          </div>
        </div>

        {/* ── Expandable detail ─────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Show details
            </>
          )}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3 border-t border-border pt-3">
            <div className="space-y-1.5">
              {sub.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {(item as any).imageUrl && (
                      <img
                        src={(item as any).imageUrl}
                        alt={item.name}
                        className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <span className="text-foreground truncate">
                      {item.name}
                    </span>
                    <span className="text-muted-foreground flex-shrink-0">
                      ×{item.quantity}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs font-medium ml-2 flex-shrink-0">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-semibold pt-1 border-t border-border/60">
                <span className="text-muted-foreground">
                  Total per delivery
                </span>
                <span className="text-foreground">{formatCurrency(total)}</span>
              </div>
            </div>
            {address && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-forest" />
                <span>{address}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {sub.status === "paused" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setResumeOpen(true)}
              disabled={isBusy}
            >
              <Play className="h-3.5 w-3.5" />
              Resume
            </Button>
          )}
          <Button asChild size="sm" variant="outline" className="h-8 ml-auto">
            <Link to={`/portal/subscriptions/${sub._id}`}>
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Confirmation modals */}
      <ConfirmationModal
        open={resumeOpen}
        onOpenChange={setResumeOpen}
        title="Resume Subscription?"
        description="This subscription will become active again and new delivery slots will be created."
        confirmLabel="Resume Subscription"
        onConfirm={() => onResume(sub._id)}
      />
    </div>
  );
};

const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<PortalSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await portalSubscriptionsApi.list({ page: 1, pageSize: 100 });
      const data = (res as any)?.data;
      setSubscriptions(data?.subscriptions || []);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to load subscriptions.";
      setError(msg);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSubscriptions();
  }, []);

  const handleResume = async (id: string) => {
    try {
      setActionLoadingId(id);
      await portalSubscriptionsApi.resume(id);
      await loadSubscriptions();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to resume subscription.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const active = useMemo(
    () => subscriptions.filter((s) => s.status === "active"),
    [subscriptions],
  );
  const paused = useMemo(
    () => subscriptions.filter((s) => s.status === "paused"),
    [subscriptions],
  );
  const cancelled = useMemo(
    () => subscriptions.filter((s) => s.status === "cancelled"),
    [subscriptions],
  );

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

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading subscriptions...
        </div>
      ) : (
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
                  <SubscriptionCard
                    key={sub._id}
                    subscription={sub}
                    onResume={handleResume}
                    actionLoadingId={actionLoadingId}
                  />
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
                  <SubscriptionCard
                    key={sub._id}
                    subscription={sub}
                    onResume={handleResume}
                    actionLoadingId={actionLoadingId}
                  />
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
                  <SubscriptionCard
                    key={sub._id}
                    subscription={sub}
                    onResume={handleResume}
                    actionLoadingId={actionLoadingId}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SubscriptionsPage;

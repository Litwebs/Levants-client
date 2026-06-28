import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Trash2,
  AlertCircle,
  Receipt,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentStatusBadge } from "@/portal/components/StatusBadges";
import {
  EmptyState,
  PageHeader,
  ListSkeleton,
} from "@/portal/components/PortalUI";
import { ApiError, resolveApiUrl } from "@/api/client";
import {
  portalPaymentsApi,
  type PortalPayment,
  type PortalPaymentMethod,
} from "@/api/portalPayments";
import { portalOrdersApi } from "@/api/portalOrders";

const PAGE_SIZE = 10;

const formatMoney = (amount: number, currency = "GBP") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount || 0);

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const paymentReference = (payment: PortalPayment) =>
  payment.order?.orderId ||
  payment.subscription?.subscriptionNumber ||
  payment.providerReference ||
  `PMT-${payment._id.slice(-6).toUpperCase()}`;

const paymentReferenceType = (payment: PortalPayment) => {
  if (payment.order?.orderId) return "Order";
  if (payment.subscription?.subscriptionNumber) return "Subscription";
  if (payment.providerReference) return "Provider";
  return "Payment";
};

const getRefundSummary = (payment: PortalPayment) => {
  const original = Number(
    payment.order?.amountPaid ?? payment.order?.total ?? payment.amount ?? 0,
  );
  const refundedFromEntries = (payment.order?.refunds || []).reduce(
    (sum, refund) => sum + Number(refund.amount ?? refund.amountMinor ?? 0),
    0,
  );
  const refunded =
    refundedFromEntries > 0
      ? refundedFromEntries
      : payment.order?.refund?.refundedAt
        ? original
        : 0;
  const after = Math.max(original - refunded, 0);
  return { original, refunded, after };
};

const paymentMethodLabel = (method: PortalPaymentMethod) => {
  if (method.type === "card") {
    const brand = method.cardBrand || "Card";
    return `${brand} •••• ${method.lastFour || "----"}`;
  }
  if (method.type === "bank_transfer") return "Bank Transfer";
  if (method.type === "cash") return "Cash";
  return "Other";
};

const sharedStripeInputOptions = {
  style: {
    base: {
      fontSize: "14px",
      color: "hsl(var(--foreground))",
      fontFamily: "inherit",
      "::placeholder": {
        color: "hsl(var(--muted-foreground))",
      },
    },
    invalid: {
      color: "hsl(var(--destructive))",
    },
  },
};

const AddCardForm: React.FC<{
  clientSecret: string;
  onSuccess: (paymentMethodId: string) => Promise<void>;
  onError: (message: string) => void;
  onRefreshSetupIntent: () => Promise<void>;
}> = ({ clientSecret, onSuccess, onError, onRefreshSetupIntent }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [billingName, setBillingName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) {
      onError("Card form is not ready yet.");
      return;
    }

    try {
      setLoading(true);
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: billingName || undefined,
          },
        },
      });

      if (result.error) {
        const stripeError = result.error as {
          code?: string;
          message?: string;
        };
        const isMissingSetupIntent =
          stripeError.code === "resource_missing" ||
          (stripeError.message || "")
            .toLowerCase()
            .includes("no such setupintent");

        if (isMissingSetupIntent) {
          await onRefreshSetupIntent();
          onError(
            "Your card setup session expired. Please try adding the card again.",
          );
          return;
        }

        onError(stripeError.message || "Failed to save card.");
        return;
      }

      const paymentMethodId = result.setupIntent?.payment_method;
      if (typeof paymentMethodId !== "string") {
        onError("Stripe did not return a payment method.");
        return;
      }

      await onSuccess(paymentMethodId);
      setBillingName("");
      cardElement.clear();
      elements.getElement(CardExpiryElement)?.clear();
      elements.getElement(CardCvcElement)?.clear();
      void onRefreshSetupIntent();
    } catch {
      onError("Failed to save card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Add card details</p>
        <p className="text-xs text-muted-foreground">
          Stripe handles the card fields and nothing is stored in this app
          database.
        </p>
      </div>
      <Input
        placeholder="Cardholder name"
        value={billingName}
        onChange={(e) => setBillingName(e.target.value)}
      />
      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-background px-3 py-3 transition-colors focus-within:border-forest/60">
          <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Card number
          </label>
          <CardNumberElement options={sharedStripeInputOptions} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background px-3 py-3 transition-colors focus-within:border-forest/60">
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Expiry date
            </label>
            <CardExpiryElement options={sharedStripeInputOptions} />
          </div>
          <div className="rounded-xl border border-border bg-background px-3 py-3 transition-colors focus-within:border-forest/60">
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              CVC
            </label>
            <CardCvcElement options={sharedStripeInputOptions} />
          </div>
        </div>
      </div>
      <Button type="submit" size="sm" disabled={!stripe || loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Add Card
          </>
        )}
      </Button>
    </form>
  );
};

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PortalPayment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PortalPaymentMethod[]>(
    [],
  );
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(
    null,
  );
  const [stripePromise, setStripePromise] = useState<ReturnType<
    typeof loadStripe
  > | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await portalPaymentsApi.list({ page, pageSize: PAGE_SIZE });
        const data = (res as any)?.data;
        if (!cancelled) {
          setPayments(data?.payments || []);
          setTotal(Number(data?.meta?.total || 0));
        }
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiError
            ? err.message
            : "Failed to load payment records. Please try again.";
        setError(msg);
        setPayments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadPayments();

    return () => {
      cancelled = true;
    };
  }, [page]);

  const loadPaymentMethods = async () => {
    try {
      setMethodsLoading(true);
      const res = await portalPaymentsApi.listPaymentMethods();
      const data = (res as any)?.data;
      setPaymentMethods(data?.paymentMethods || []);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to load payment methods.";
      setError(msg);
      setPaymentMethods([]);
    } finally {
      setMethodsLoading(false);
    }
  };

  useEffect(() => {
    void loadPaymentMethods();
  }, []);

  const loadSetupIntent = async () => {
    try {
      setSetupLoading(true);
      setError(null);
      const res = await portalPaymentsApi.createSetupIntent();
      const data = (res as any)?.data;
      const publishableKey = String(data?.publishableKey || "");
      const clientSecret = String(data?.clientSecret || "");
      if (!publishableKey || !clientSecret) {
        throw new Error("Stripe setup data missing");
      }
      setStripePromise(loadStripe(publishableKey));
      setSetupClientSecret(clientSecret);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to initialize card setup.";
      setError(msg);
      setSetupClientSecret(null);
    } finally {
      setSetupLoading(false);
    }
  };

  useEffect(() => {
    void loadSetupIntent();
  }, []);

  const handleAddStripeMethod = async (stripePaymentMethodId: string) => {
    await portalPaymentsApi.attachPaymentMethod({
      stripePaymentMethodId,
      setDefault: paymentMethods.length === 0,
    });
    await loadPaymentMethods();
  };

  const handleRefreshSetupIntent = async () => {
    try {
      setError(null);
      setSetupLoading(true);
      const res = await portalPaymentsApi.createSetupIntent();
      const data = (res as any)?.data;
      const publishableKey = String(data?.publishableKey || "");
      const clientSecret = String(data?.clientSecret || "");
      if (!publishableKey || !clientSecret) return;
      setStripePromise(loadStripe(publishableKey));
      setSetupClientSecret(clientSecret);
    } catch {
      // Keep the newly added card visible even if the next setup intent
      // cannot be refreshed immediately.
    } finally {
      setSetupLoading(false);
    }
  };

  const handleSetDefaultMethod = async (methodId: string) => {
    try {
      setActionLoadingId(methodId);
      setError(null);
      await portalPaymentsApi.setDefaultPaymentMethod(methodId);
      await loadPaymentMethods();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to set default payment method.";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    try {
      setActionLoadingId(methodId);
      setError(null);
      await portalPaymentsApi.deletePaymentMethod(methodId);
      await loadPaymentMethods();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to remove payment method.";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownloadReceipt = async (payment: PortalPayment) => {
    if (!payment.order?._id) return;
    try {
      setReceiptLoadingId(payment._id);
      setError(null);
      const res = await portalOrdersApi.getReceiptUrl(payment.order._id);
      const receiptUrl = (res as any)?.data?.receiptUrl as string | undefined;
      if (receiptUrl) {
        window.open(resolveApiUrl(receiptUrl), "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Unable to download receipt right now.";
      setError(msg);
    } finally {
      setReceiptLoadingId((current) =>
        current === payment._id ? null : current,
      );
    }
  };

  const summary = useMemo(() => {
    const totalPaid = payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pendingCount = payments.filter((p) => p.status === "pending").length;
    const failedCount = payments.filter((p) => p.status === "failed").length;
    return { totalPaid, pendingCount, failedCount };
  }, [payments]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );
  const showPagination = total > PAGE_SIZE;

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Payments"
        description="Manage your payment methods and view payment history"
      />

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Failed payment alert */}
      {summary.failedCount > 0 && (
        <Alert variant="destructive" className="mb-5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {summary.failedCount} failed payment
            {summary.failedCount > 1 ? "s" : ""}. Please update your payment
            method.{" "}
            <button className="underline font-medium">Review history</button>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          {
            label: "Total Paid (Page)",
            value: formatMoney(summary.totalPaid),
            color: "text-foreground",
          },
          {
            label: "Pending",
            value: summary.pendingCount,
            color: "text-yellow-600",
          },
          {
            label: "Failed",
            value: summary.failedCount,
            color: "text-destructive",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border rounded-2xl p-4 text-center"
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Payment Methods</h3>
        </div>

        {setupLoading ? (
          <div className="mb-4 text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Initializing secure card form...
          </div>
        ) : stripePromise && setupClientSecret ? (
          <div className="mb-4">
            <Elements
              key={setupClientSecret}
              stripe={stripePromise}
              options={{ clientSecret: setupClientSecret }}
            >
              <AddCardForm
                clientSecret={setupClientSecret}
                onSuccess={handleAddStripeMethod}
                onError={setError}
                onRefreshSetupIntent={handleRefreshSetupIntent}
              />
            </Elements>
          </div>
        ) : null}

        {methodsLoading ? (
          <ListSkeleton rows={2} />
        ) : paymentMethods.length === 0 ? (
          <EmptyState
            title="No payment methods"
            description="No saved payment methods found."
          />
        ) : (
          <div className="space-y-2">
            {paymentMethods.map((pm) => (
              <div
                key={pm._id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border"
              >
                <div className="w-10 h-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {paymentMethodLabel(pm)}
                  </p>
                  {pm.expiryMonth && pm.expiryYear ? (
                    <p className="text-xs text-muted-foreground">
                      Expires {String(pm.expiryMonth).padStart(2, "0")}/
                      {String(pm.expiryYear).slice(-2)}
                    </p>
                  ) : null}
                </div>
                {pm.isDefault && (
                  <span className="text-[10px] bg-forest/10 text-forest rounded-full px-1.5 py-0.5 font-medium flex-shrink-0">
                    Default
                  </span>
                )}
                <div className="flex gap-1">
                  {!pm.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => void handleSetDefaultMethod(pm._id)}
                      disabled={actionLoadingId === pm._id}
                    >
                      Set default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => void handleDeleteMethod(pm._id)}
                    disabled={actionLoadingId === pm._id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Payment History</h3>
        {loading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading payments...
            </div>
            <ListSkeleton rows={4} />
          </div>
        ) : payments.length === 0 ? (
          <EmptyState title="No payment history" />
        ) : (
          <>
            <div className="divide-y divide-border">
              {payments.map((pay) => {
                const summary = getRefundSummary(pay);

                return (
                  <div key={pay._id} className="py-3">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-sm font-medium text-foreground">
                            {paymentReference(pay)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(pay.paidAt || pay.createdAt)} ·{" "}
                            {paymentReferenceType(pay)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
                          <PaymentStatusBadge status={pay.status as any} />
                          <span className="text-sm font-bold text-foreground">
                            {formatMoney(pay.amount, pay.currency || "GBP")}
                          </span>
                        </div>
                      </div>

                      {summary.refunded > 0 && (
                        <p className="truncate whitespace-nowrap text-xs text-muted-foreground">
                          Refunded{" "}
                          {formatMoney(summary.refunded, pay.currency || "GBP")}{" "}
                          · Before{" "}
                          {formatMoney(summary.original, pay.currency || "GBP")}{" "}
                          · After{" "}
                          {formatMoney(summary.after, pay.currency || "GBP")}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-2 border-t border-border pt-3 whitespace-nowrap">
                        {pay.order?._id && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                          >
                            <Link to={`/portal/orders/${pay.order._id}`}>
                              View Order
                            </Link>
                          </Button>
                        )}
                        {/* {pay.order?._id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => void handleDownloadReceipt(pay)}
                            disabled={receiptLoadingId === pay._id}
                            title="Download receipt"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                          </Button>
                        )} */}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {showPagination && (
              <div className="mt-5 pt-4 border-t border-border flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Showing page {page} of {totalPages} ({total} records)
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
    </div>
  );
};

export default PaymentsPage;

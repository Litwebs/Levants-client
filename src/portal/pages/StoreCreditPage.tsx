import React, { useEffect, useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { ApiError } from "@/api/client";
import { EmptyState, PageHeader } from "@/portal/components/PortalUI";
import {
  portalCreditsApi,
  type PortalCreditTransaction,
} from "@/api/portalCredits";

const formatMoney = (minor: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format((Number(minor) || 0) / 100);

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const TYPE_LABELS: Record<PortalCreditTransaction["type"], string> = {
  subscription_refund: "Subscription refund",
  order_redemption: "Used on order",
  order_redemption_reversal: "Order credit returned",
  admin_adjustment: "Adjustment",
};

const StoreCreditPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<PortalCreditTransaction[]>(
    [],
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await portalCreditsApi.get({ page: 1, pageSize: 50 });
        if (!active) return;
        setBalance(Number(res.data?.balance || 0));
        setTransactions(res.data?.transactions || []);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Failed to load your store credit.",
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Store Credit"
        description="Use your balance towards future orders and subscriptions."
      />

      <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Available balance</div>
          <div className="text-3xl font-semibold">{formatMoney(balance)}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-sm font-medium mb-4">History</h2>
        {loading ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : error ? (
          <EmptyState title="Couldn't load history" description={error} />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No store credit yet"
            description="Refunds and adjustments will appear here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((tx) => (
              <li
                key={tx._id}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {tx.reason || TYPE_LABELS[tx.type]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(tx.createdAt)} · {TYPE_LABELS[tx.type]}
                  </div>
                </div>
                <div
                  className={`text-sm font-semibold whitespace-nowrap ${
                    tx.amount >= 0 ? "text-green-600" : "text-foreground"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : "−"}
                  {formatMoney(Math.abs(tx.amount))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StoreCreditPage;

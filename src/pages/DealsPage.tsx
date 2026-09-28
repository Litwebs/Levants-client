import React, { useCallback, useEffect, useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import DealCard from "@/components/deals/DealCard";
import { listDeals, type Deal } from "@/api/deals";

const DealsPage: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listDeals({ page: 1, pageSize: 100 });
      setDeals(res.deals);
    } catch (err) {
      setDeals([]);
      setError(err instanceof Error ? err.message : "Failed to load deals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDeals();
  }, [loadDeals]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-secondary/30 py-12 lg:py-16">
        <div className="container-custom">
          <h1 className="mb-2 font-heading text-3xl font-semibold lg:text-4xl">
            Deals & Product Packages
          </h1>
          <p className="text-muted-foreground">
            Fresh product collections at a better package price.
          </p>
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="mb-4 text-destructive">{error}</p>
            <button type="button" onClick={() => void loadDeals()} className="btn-outline">
              Retry
            </button>
          </div>
        ) : deals.length === 0 ? (
          <div className="py-16 text-center">
            <Gift className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
            <h2 className="font-heading text-xl font-semibold">
              No deals available right now
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back soon for new product packages and seasonal offers.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DealsPage;

import React, { useEffect, useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import DealCard from "@/components/deals/DealCard";
import { listDeals, type Deal } from "@/api/deals";

const DealsPage: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void listDeals({ page: 1, pageSize: 100 })
      .then((res) => {
        if (!active) return;
        setDeals(res.deals);
        setError("");
      })
      .catch((err) => {
        if (!active) return;
        setDeals([]);
        setError(err instanceof Error ? err.message : "Failed to load deals.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-primary/5 py-14 lg:py-20">
        <div className="container-custom text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Gift className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-4xl font-semibold lg:text-5xl">
            Deals & Product Packages
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Get more value from your favourites with specially priced product collections.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container-custom">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading deals...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-center text-sm text-destructive">
              {error}
            </div>
          ) : deals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
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
      </section>
    </div>
  );
};

export default DealsPage;

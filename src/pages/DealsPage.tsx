import React, { useCallback, useEffect, useRef, useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import DealCard from "@/components/deals/DealCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { listDeals, type Deal } from "@/api/deals";

const DealsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadSequence = useRef(0);

  const loadDeals = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setError("");
    try {
      const res = await listDeals({ page, pageSize: 12 });
      if (sequence !== loadSequence.current) return;
      setDeals(res.deals);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch (err) {
      if (sequence !== loadSequence.current) return;
      setDeals([]);
      setError(err instanceof Error ? err.message : "Failed to load deals.");
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadDeals();
    return () => {
      loadSequence.current += 1;
    };
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
            <button
              type="button"
              onClick={() => void loadDeals()}
              className="btn-outline"
            >
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
        {!loading && !error && totalPages > 1 && (
          <nav
            aria-label="Deals pagination"
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </nav>
        )}
        {!loading && !error && !deals.length && (
          <div className="text-center">
            <Button asChild variant="outline">
              <Link to="/shop">Browse all products</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealsPage;

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Gift, Tag } from "lucide-react";
import DealsSkeleton from "@/components/deals/DealsSkeleton";
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
    } catch {
      if (sequence !== loadSequence.current) return;
      setDeals([]);
      setError("We couldn’t load the deals. Please try again.");
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
    <div className="bg-background">
      <div className="border-b border-border/60 bg-secondary/30 py-8 lg:py-10">
        <div className="container-custom">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Tag aria-hidden="true" className="h-3.5 w-3.5" /> More to enjoy,
            less to spend
          </p>
          <h1 className="mb-2 font-heading text-3xl font-semibold lg:text-4xl">
            Deals & Product Packages
          </h1>
          <p className="text-muted-foreground">
            Fresh product collections at a better package price.
          </p>
        </div>
      </div>

      <div className="container-custom py-6 lg:py-8">
        {loading ? (
          <DealsSkeleton />
        ) : error ? (
          <div className="rounded-2xl border border-border/60 bg-card px-6 py-12 text-center">
            <p role="alert" className="mb-4 text-muted-foreground">
              {error}
            </p>
            <Button
              variant="outline"
              type="button"
              onClick={() => void loadDeals()}
              className="h-11 rounded-xl"
            >
              Retry
            </Button>
          </div>
        ) : deals.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card px-6 py-12 text-center">
            <Gift className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
            <h2 className="font-heading text-xl font-semibold">
              No deals available right now
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back soon for new product packages and seasonal offers.
            </p>
          </div>
        ) : (
          <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="mt-5 text-center">
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

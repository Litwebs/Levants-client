import { useEffect, useState } from "react";
import { ArrowRight, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { listDeals, type Deal } from "@/api/deals";
import DealsCarousel from "./DealsCarousel";
import DealsSkeleton from "./DealsSkeleton";

export default function FeaturedDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void listDeals({ page: 1, pageSize: 12 })
      .then((res) => {
        if (active) setDeals(res.deals);
      })
      .catch(() => {
        if (active) setDeals([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!loading && deals.length === 0) return null;

  return (
    <section
      aria-labelledby="featured-deals-heading"
      className="border-b border-primary/10 bg-primary/5 py-8 sm:py-10 lg:py-10"
    >
      <div className="container-custom">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Tag className="h-3.5 w-3.5" aria-hidden="true" /> Fresh picks,
              better value
            </span>
            <h2
              id="featured-deals-heading"
              className="mt-2 font-heading text-3xl font-semibold"
            >
              Featured Deals
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your farm-fresh favourites, for a little less.
            </p>
          </div>
          <Link
            to="/deals"
            className="inline-flex min-h-11 w-fit shrink-0 items-center gap-2 rounded-lg text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View all deals <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {loading ? <DealsSkeleton home /> : <DealsCarousel deals={deals} />}
      </div>
    </section>
  );
}

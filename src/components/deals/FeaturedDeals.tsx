import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { listDeals, type Deal } from "@/api/deals";
import DealsCarousel from "./DealsCarousel";
import { cn } from "@/lib/utils";

export default function FeaturedDeals({ onImage = false, onAvailabilityChange }: { onImage?: boolean; onAvailabilityChange?: (available: boolean) => void }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const availabilityCallback = useRef(onAvailabilityChange);
  useEffect(() => { availabilityCallback.current = onAvailabilityChange; }, [onAvailabilityChange]);

  useEffect(() => {
    let active = true;
    let generation = 0;
    let expiryTimer: number | undefined;
    const load = async () => {
      const request = ++generation;
      let nextDeals: Deal[] = [];
      try {
        const response = await listDeals({ page: 1, pageSize: 12, featured: true });
        nextDeals = response.deals.filter(deal => deal.isFeatured && deal.maxPackages > 0 && (!deal.endsAt || new Date(deal.endsAt).getTime() > Date.now()) && (!deal.startsAt || new Date(deal.startsAt).getTime() <= Date.now()));
      } catch {
        // Hide the collection when offers cannot be loaded.
      }

      if (!active || request !== generation) return;
      window.clearTimeout(expiryTimer);
      const endings = nextDeals.map(d => d.endsAt ? new Date(d.endsAt).getTime() : Infinity).filter(Number.isFinite);
      if (endings.length) expiryTimer = window.setTimeout(() => { void load(); }, Math.min(Math.max(0, Math.min(...endings) - Date.now() + 10), 2_147_483_647));
      availabilityCallback.current?.(nextDeals.length > 0);
      setDeals(nextDeals);
      setLoading(false);
    };
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, 60_000);
    return () => { active = false; window.clearTimeout(expiryTimer); window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, []);

  // Do not show a placeholder for offers that may not exist.
  if (loading || deals.length === 0) return null;

  return (
    <section
      aria-labelledby="featured-deals-heading"
      className={cn("min-w-0", onImage && "text-white")}
    >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2
              id="featured-deals-heading"
              className="font-heading text-xl font-semibold"
            >
              Featured Deals
            </h2>
          </div>
          <Link
            to="/deals"
            className={cn("inline-flex min-h-11 w-fit shrink-0 items-center gap-2 rounded-lg text-xs font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2", onImage ? "text-white/90 focus-visible:ring-white" : "text-primary focus-visible:ring-ring")}
          >
            View all deals <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <DealsCarousel deals={deals} onImage={onImage} />
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { listDeals, type Deal } from "@/api/deals";
import DealsCarousel from "./DealsCarousel";
import DealsSkeleton from "./DealsSkeleton";
import { cn } from "@/lib/utils";

const MIN_LOADING_MS = 400;
const IMAGE_WAIT_MS = 2500;

function waitForFirstImage(src?: string): Promise<void> {
  if (!src) return Promise.resolve();

  return new Promise((resolve) => {
    const image = new Image();
    const finish = () => {
      window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      resolve();
    };
    const timer = window.setTimeout(finish, IMAGE_WAIT_MS);
    image.onload = finish;
    image.onerror = finish;
    image.src = src;
    if (image.complete) finish();
  });
}

export default function FeaturedDeals({ onImage = false, onAvailabilityChange }: { onImage?: boolean; onAvailabilityChange?: (available: boolean) => void }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const availabilityCallback = useRef(onAvailabilityChange);
  useEffect(() => { availabilityCallback.current = onAvailabilityChange; }, [onAvailabilityChange]);

  useEffect(() => {
    let active = true;
    let generation = 0;
    let expiryTimer: number | undefined;
    const startedAt = performance.now();
    const load = async () => {
      const request = ++generation;
      let nextDeals: Deal[] = [];
      try {
        const response = await listDeals({ page: 1, pageSize: 12, featured: true });
        nextDeals = response.deals.filter(deal => deal.isFeatured && deal.maxPackages > 0 && (!deal.endsAt || new Date(deal.endsAt).getTime() > Date.now()) && (!deal.startsAt || new Date(deal.startsAt).getTime() <= Date.now()));
      } catch {
        // Hide the collection when offers cannot be loaded.
      }

      await Promise.all([
        waitForFirstImage(nextDeals[0]?.imageUrl),
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, Math.max(0, MIN_LOADING_MS - (performance.now() - startedAt)));
        }),
      ]);

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

  useEffect(() => {
    if (loading || deals.length === 0) return;
    const frame = window.requestAnimationFrame(() => setRevealed(true));
    const timer = window.setTimeout(() => setShowSkeleton(false), 600);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [loading, deals.length]);

  if (!loading && deals.length === 0) return null;

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
        <div className="relative grid min-w-0">
          {showSkeleton && (
            <div
              aria-hidden={!loading}
              className={cn(
                "col-start-1 row-start-1 z-10 transition-opacity duration-500 ease-out motion-reduce:transition-none",
                loading ? "opacity-100" : "pointer-events-none absolute inset-0",
                revealed && "opacity-0",
              )}
            >
              <DealsSkeleton home />
            </div>
          )}
          {!loading && (
            <div className={cn(
              "col-start-1 row-start-1 min-w-0 transition-opacity duration-500 ease-out motion-reduce:transition-none",
              revealed ? "opacity-100" : "opacity-0",
            )}>
              <DealsCarousel deals={deals} onImage={onImage} />
            </div>
          )}
        </div>
    </section>
  );
}

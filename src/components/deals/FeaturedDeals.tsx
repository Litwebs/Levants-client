import { useEffect, useState } from "react";
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
    let timer: number;
    const finish = () => {
      window.clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      resolve();
    };
    timer = window.setTimeout(finish, IMAGE_WAIT_MS);
    image.onload = finish;
    image.onerror = finish;
    image.src = src;
    if (image.complete) finish();
  });
}

export default function FeaturedDeals({ fallbackImage, onImage = false }: { fallbackImage?: string; onImage?: boolean }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    let active = true;
    const startedAt = performance.now();
    const load = async () => {
      let nextDeals: Deal[] = [];
      try {
        const response = await listDeals({ page: 1, pageSize: 12 });
        nextDeals = response.deals;
      } catch {
        // The existing fallback image is shown when deals cannot be loaded.
      }

      await Promise.all([
        waitForFirstImage(nextDeals[0]?.imageUrl),
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, Math.max(0, MIN_LOADING_MS - (performance.now() - startedAt)));
        }),
      ]);

      if (!active) return;
      setDeals(nextDeals);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
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

  if (!loading && deals.length === 0) {
    return fallbackImage ? (
      <img src={fallbackImage} alt="Countryside farm with grazing cows" className="aspect-[4/5] w-full rounded-2xl object-cover sm:aspect-[4/3]" />
    ) : null;
  }

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

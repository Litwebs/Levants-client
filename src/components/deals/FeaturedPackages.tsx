import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Deal } from "@/api/deals";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import DealCard from "./DealCard";

interface FeaturedPackagesProps {
  deals: Deal[];
  loading: boolean;
}

const arrowButtonClass = "h-8 w-8 rounded-lg border border-border bg-transparent p-0 text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted hover:text-foreground focus-visible:ring-primary [&_svg]:size-4";
const SCROLL_SPEED = 32; // pixels per second

export default function FeaturedPackages({ deals, loading }: FeaturedPackagesProps) {
  const distinctImages = new Set<string>();
  const distinct: Deal[] = [];
  const repeated: Deal[] = [];
  deals.filter((deal) => deal.isFeatured).forEach((deal) => {
    if (deal.imageUrl && !distinctImages.has(deal.imageUrl)) {
      distinctImages.add(deal.imageUrl);
      distinct.push(deal);
    } else {
      repeated.push(deal);
    }
  });
  const featured = [...distinct, ...repeated];
  const viewport = useRef<HTMLDivElement>(null);
  const group = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(true);
  const canScroll = featured.length > 1;
  const copies = featured.length < 4 ? 7 : 5;
  const middleCopy = Math.floor(copies / 2);

  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const element = viewport.current;
    const firstGroup = group.current;
    if (!canScroll || !element || !firstGroup) return;
    let frame = 0;
    let previousTime = 0;
    const groupWidth = () => firstGroup.getBoundingClientRect().width + 16;
    const normalize = () => {
      const width = groupWidth();
      if (!width) return;
      if (element.scrollLeft >= (middleCopy + 1) * width) element.scrollLeft -= width;
      if (element.scrollLeft < middleCopy * width) element.scrollLeft += width;
    };
    const position = () => { element.scrollLeft = middleCopy * groupWidth(); };
    position();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(position) : null;
    observer?.observe(firstGroup);
    const tick = (time: number) => {
      if (previousTime && !reducedMotion && !document.hidden) {
        element.scrollLeft += SCROLL_SPEED * Math.min(time - previousTime, 50) / 1000;
        normalize();
      }
      previousTime = time;
      frame = window.requestAnimationFrame(tick);
    };
    if (!reducedMotion) frame = window.requestAnimationFrame(tick);
    return () => { window.cancelAnimationFrame(frame); observer?.disconnect(); };
  }, [canScroll, copies, middleCopy, reducedMotion, featured.length]);

  const move = (direction: -1 | 1) => {
    const element = viewport.current;
    const firstCard = group.current?.firstElementChild;
    if (!element || !(firstCard instanceof HTMLElement)) return;
    element.scrollLeft += direction * (firstCard.getBoundingClientRect().width + 16);
    const width = group.current ? group.current.getBoundingClientRect().width + 16 : 0;
    if (width && element.scrollLeft >= (middleCopy + 1) * width) element.scrollLeft -= width;
    if (width && element.scrollLeft < middleCopy * width) element.scrollLeft += width;
  };

  if (!loading && featured.length === 0) return null;

  return (
    <section aria-labelledby="featured-packages-heading" className="mb-9 min-w-0">
      <div className="mb-4 flex min-h-9 items-center justify-between gap-4">
        <h2 id="featured-packages-heading" className="font-heading text-xl font-semibold sm:text-2xl">Featured packages</h2>
        {canScroll && !loading && (
          <div className="flex shrink-0 items-center">
            <Button type="button" variant="ghost" size="icon" className={arrowButtonClass} onClick={() => move(-1)} aria-label="Previous featured packages"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></Button>
            <Button type="button" variant="ghost" size="icon" className={arrowButtonClass} onClick={() => move(1)} aria-label="Next featured packages"><ChevronRight className="h-4 w-4" aria-hidden="true" /></Button>
          </div>
        )}
      </div>
      {loading ? (
        <div role="status" aria-label="Loading featured packages" className="flex gap-4 overflow-hidden">
          {[0, 1, 2, 3].map((index) => <Skeleton key={index} className="aspect-[4/3] w-[78vw] max-w-[22rem] shrink-0 rounded-2xl motion-reduce:animate-none" />)}
        </div>
      ) : canScroll ? (
        <div ref={viewport} role="region" aria-label="Featured packages carousel" className="overflow-hidden rounded-2xl" onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}>
          <div className="flex w-max gap-4">
            {Array.from({ length: copies }, (_, copy) => (
              <div key={copy} ref={copy === 0 ? group : undefined} className="flex shrink-0 gap-4">
                {featured.map((deal) => (
                  <div key={deal.id} className="w-[78vw] shrink-0 sm:w-80 lg:w-[22rem]">
                    <DealCard deal={deal} variant="featured" showContents={false} compactAction smallFeatured imageAspectClassName="aspect-[4/3]" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-[78vw] sm:w-80 lg:w-[22rem]">
          <DealCard deal={featured[0]} variant="featured" showContents={false} compactAction smallFeatured imageAspectClassName="aspect-[4/3]" />
        </div>
      )}
    </section>
  );
}

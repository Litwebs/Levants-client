import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Deal } from "@/api/deals";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import DealCard from "./DealCard";

interface FeaturedPackagesProps {
  deals: Deal[];
  loading: boolean;
}

const arrowButtonClass = "relative h-9 w-9 rounded-full bg-transparent p-0 text-muted-foreground hover:bg-transparent hover:text-foreground before:absolute before:inset-1 before:rounded-full before:border before:border-border/70 before:bg-background hover:before:bg-secondary [&_svg]:relative [&_svg]:size-3.5";

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
  const root = useRef<HTMLElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [canScroll, setCanScroll] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    if (!api || !root.current) return;
    const element = root.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)");
    let visible = false;
    let timer: number | undefined;
    const schedule = () => {
      window.clearTimeout(timer);
      setReducedMotion(media.matches);
      const scrollable = api.canScrollNext() || api.canScrollPrev();
      setCanScroll(scrollable);
      if (!visible || !scrollable || media.matches || document.hidden ||
          (hoverCapable.matches && element.matches(":hover")) ||
          element.querySelector(":focus-visible")) return;
      timer = window.setTimeout(() => api.scrollNext(), 6000);
    };
    const onFocusOut = () => queueMicrotask(schedule);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    }, { threshold: 0.25 });
    observer.observe(element);
    media.addEventListener("change", schedule);
    hoverCapable.addEventListener("change", schedule);
    document.addEventListener("visibilitychange", schedule);
    element.addEventListener("mouseenter", schedule);
    element.addEventListener("mouseleave", schedule);
    element.addEventListener("focusin", schedule);
    element.addEventListener("focusout", onFocusOut);
    api.on("select", schedule);
    api.on("reInit", schedule);
    schedule();
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      media.removeEventListener("change", schedule);
      hoverCapable.removeEventListener("change", schedule);
      document.removeEventListener("visibilitychange", schedule);
      element.removeEventListener("mouseenter", schedule);
      element.removeEventListener("mouseleave", schedule);
      element.removeEventListener("focusin", schedule);
      element.removeEventListener("focusout", onFocusOut);
      api.off("select", schedule);
      api.off("reInit", schedule);
    };
  }, [api, featured.length]);

  if (!loading && featured.length === 0) return null;

  return (
    <section ref={root} aria-labelledby="featured-packages-heading" className="mb-9 min-w-0">
      <div className="mb-4 flex min-h-9 items-center justify-between gap-4">
        <h2 id="featured-packages-heading" className="font-heading text-xl font-semibold sm:text-2xl">Featured packages</h2>
        {canScroll && !loading && (
          <div className="flex shrink-0 items-center">
            <Button type="button" variant="ghost" size="icon" className={arrowButtonClass} onClick={() => api?.scrollPrev()} aria-label="Previous featured packages"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></Button>
            <Button type="button" variant="ghost" size="icon" className={arrowButtonClass} onClick={() => api?.scrollNext()} aria-label="Next featured packages"><ChevronRight className="h-4 w-4" aria-hidden="true" /></Button>
          </div>
        )}
      </div>
      {loading ? (
        <div role="status" aria-label="Loading featured packages" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1].map((index) => <Skeleton key={index} className={`h-[17rem] rounded-2xl motion-reduce:animate-none sm:h-[21rem] ${index === 1 ? "hidden lg:block" : ""}`} />)}
        </div>
      ) : (
        <Carousel setApi={setApi} opts={{ align: "start", loop: true, duration: reducedMotion ? 0 : 35 }} aria-label="Featured packages" className="min-w-0">
          <CarouselContent>
            {featured.map((deal, index) => (
              <CarouselItem key={deal.id} className="basis-full lg:basis-1/2" aria-label={`${index + 1} of ${featured.length}`}>
                <div className="overflow-hidden rounded-2xl bg-forest-dark">
                  <DealCard deal={deal} variant="featured" showContents={false} compactAction imageAspectClassName="aspect-[4/3] sm:aspect-[7/4]" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
    </section>
  );
}

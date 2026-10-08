import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Deal } from "@/api/deals";
import { Button } from "@/components/ui/button";
import DealCard from "./DealCard";
import DealContents from "./DealContents";
import { cn } from "@/lib/utils";

const ROTATION_INTERVAL = 6000;

export default function DealsCarousel({
  deals,
  onImage = false,
  imageAspectClassName,
}: {
  deals: Deal[];
  onImage?: boolean;
  imageAspectClassName?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [contentFocused, setContentFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const count = deals.length;
  const activeIndex = count ? index % count : 0;
  const canRotate = count > 1;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    const visibility = () => setPageVisible(!document.hidden);
    update();
    visibility();
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.25 },
    );
    if (root.current) observer.observe(root.current);
    return () => {
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
      observer.disconnect();
    };
  }, []);

  const rotating =
    canRotate && !reducedMotion && !dragging &&
    !contentFocused && visible && pageVisible;

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(
      () => setIndex((current) => (current + 1) % count),
      ROTATION_INTERVAL,
    );
    return () => window.clearTimeout(timer);
  }, [rotating, activeIndex, count]);

  const navigate = (direction: -1 | 1) => {
    if (canRotate) setIndex((current) => (current + direction + count) % count);
  };

  return (
    <div
      ref={root}
      className="relative min-w-0"
      role="region"
      aria-label="Featured deals"
      aria-roledescription={canRotate ? "carousel" : undefined}
      onFocusCapture={(event) => {
        setContentFocused(Boolean(event.target.closest(".deal-card")));
      }}
      onBlurCapture={(event) => {
        setContentFocused(
          event.relatedTarget instanceof Element &&
          Boolean(event.relatedTarget.closest(".deal-card")) &&
          event.currentTarget.contains(event.relatedTarget),
        );
      }}
      onKeyDownCapture={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          navigate(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <div
        className="grid grid-cols-1 grid-rows-[auto_auto] touch-pan-y overflow-hidden rounded-2xl"
        aria-live="off"
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (!touch) return;
          touchStart.current = { x: touch.clientX, y: touch.clientY };
          setDragging(true);
        }}
        onTouchEnd={(event) => {
          const touch = event.changedTouches[0];
          const start = touchStart.current;
          if (touch && start) {
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
              navigate(dx > 0 ? -1 : 1);
            }
          }
          touchStart.current = null;
          setDragging(false);
        }}
        onTouchCancel={() => {
          touchStart.current = null;
          setDragging(false);
        }}
      >
        {deals.map((deal, slideIndex) => (
          <div
            key={deal.id}
            className={cn(
              "col-start-1 row-start-1 min-w-0 transition-opacity duration-700 ease-in-out motion-reduce:transition-none",
              slideIndex === activeIndex
                ? "z-10 opacity-100"
                : "pointer-events-none opacity-0",
            )}
            role="group"
            aria-label={`${slideIndex + 1} of ${count}`}
            aria-roledescription={canRotate ? "slide" : undefined}
            aria-hidden={slideIndex !== activeIndex}
            ref={(node) => {
              if (node) node.inert = slideIndex !== activeIndex;
            }}
          >
            <DealCard deal={deal} variant="featured" showContents={false} compactAction imageAspectClassName={imageAspectClassName} />
          </div>
        ))}
        {/* Blur stays mounted outside every opacity layer, so only the product
            contents crossfade without changing the backdrop filter. */}
        <div className="col-start-1 row-start-2 grid min-w-0 grid-cols-1 text-white backdrop-blur-md">
          {deals.map((deal, slideIndex) => (
            <div
              key={deal.id}
              className={cn(
                "col-start-1 row-start-1 min-w-0 transition-opacity duration-700 ease-in-out motion-reduce:transition-none",
                slideIndex === activeIndex
                  ? "z-10 opacity-100"
                  : "pointer-events-none opacity-0",
              )}
              aria-hidden={slideIndex !== activeIndex}
              ref={(node) => {
                if (node) node.inert = slideIndex !== activeIndex;
              }}
            >
              <DealContents items={deal.items} compact blurred={false} />
            </div>
          ))}
        </div>
      </div>
      {canRotate && (
        <>
          <div className={cn("pointer-events-none absolute inset-x-0 top-0 z-20", imageAspectClassName ?? "aspect-[4/5] sm:aspect-[4/3]")}>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="pointer-events-auto absolute left-3 top-1/3 h-11 w-11 -translate-y-1/2 rounded-full border-white/30 bg-card/95 text-foreground shadow-soft hover:bg-card sm:left-5 sm:top-[40%]"
              onClick={() => navigate(-1)}
              aria-label="Previous deals"
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="pointer-events-auto absolute right-3 top-1/3 h-11 w-11 -translate-y-1/2 rounded-full border-white/30 bg-card/95 text-foreground shadow-soft hover:bg-card sm:right-5 sm:top-[40%]"
              onClick={() => navigate(1)}
              aria-label="Next deals"
            >
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </Button>
          </div>
          <p
            aria-live="off"
            className={cn(
              "mt-3 text-right text-xs tabular-nums",
              onImage ? "text-white/65" : "text-muted-foreground",
            )}
          >
            <span className="sr-only">Deal </span>{activeIndex + 1} / {count}
          </p>
        </>
      )}
    </div>
  );
}

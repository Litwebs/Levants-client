import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import type { Deal } from "@/api/deals";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import DealCard from "./DealCard";

const ROTATION_INTERVAL = 6000;

export default function DealsCarousel({ deals }: { deals: Deal[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const rotationControl = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(true);
  const options = useMemo(
    () => ({
      align: "start" as const,
      loop: false,
      duration: reducedMotion ? 0 : 25,
    }),
    [reducedMotion],
  );
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [position, setPosition] = useState({ index: 0, count: 1 });

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

  useEffect(() => {
    if (!api) return;
    const update = () =>
      setPosition({
        index: api.selectedScrollSnap(),
        count: api.scrollSnapList().length,
      });
    const stop = () => setPaused(true);
    update();
    api.on("select", update).on("reInit", update).on("pointerDown", stop);
    return () => {
      api.off("select", update).off("reInit", update).off("pointerDown", stop);
    };
  }, [api]);

  const canRotate = position.count > 1;
  const rotating =
    canRotate &&
    !reducedMotion &&
    !paused &&
    !hovered &&
    visible &&
    pageVisible;
  useEffect(() => {
    if (!api || !rotating) return;
    const timer = window.setTimeout(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, ROTATION_INTERVAL);
    return () => window.clearTimeout(timer);
  }, [api, rotating, position.index]);

  const navigate = (direction: -1 | 1) => {
    setPaused(true);
    api?.scrollTo(position.index + direction, reducedMotion);
  };

  return (
    <Carousel
      ref={root}
      setApi={setApi}
      opts={options}
      aria-label="Featured deals"
      aria-roledescription={canRotate ? "carousel" : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (!rotationControl.current?.contains(event.target)) setPaused(true);
      }}
      onKeyDownCapture={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          navigate(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
    >
      <CarouselContent className="-ml-5 py-1" aria-live="off">
        {deals.map((deal, index) => (
          <CarouselItem
            key={deal.id}
            className="basis-full pl-5 sm:basis-1/2 lg:basis-1/3"
            aria-label={`${index + 1} of ${deals.length}`}
            aria-roledescription={canRotate ? "slide" : undefined}
          >
            <DealCard deal={deal} />
          </CarouselItem>
        ))}
      </CarouselContent>
      {canRotate && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Explore more packages</p>
          <div className="flex items-center gap-2">
            {!reducedMotion && (
              <Button
                ref={rotationControl}
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full"
                onClick={() => setPaused((value) => !value)}
                aria-label={
                  paused
                    ? "Start automatic rotation"
                    : "Pause automatic rotation"
                }
              >
                {paused ? <Play /> : <Pause />}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full"
              disabled={position.index === 0}
              onClick={() => navigate(-1)}
              aria-label="Previous deals"
            >
              <ArrowLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-full"
              disabled={position.index === position.count - 1}
              onClick={() => navigate(1)}
              aria-label="Next deals"
            >
              <ArrowRight />
            </Button>
          </div>
        </div>
      )}
    </Carousel>
  );
}

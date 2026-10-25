import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function DealsSkeleton({ home = false, imageAspectClassName = "aspect-[4/5] sm:aspect-[4/3]", imageSrc }: { home?: boolean; imageAspectClassName?: string; imageSrc?: string }) {
  const [loadedImage, setLoadedImage] = useState<string>();
  if (home) return (
    <div role="status" aria-label="Loading deals" className={`relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md ${imageAspectClassName}`}>
      {imageSrc && <img src={imageSrc} alt="" aria-hidden="true" onLoad={() => setLoadedImage(imageSrc)} className={cn("absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-500 motion-reduce:transition-none", loadedImage === imageSrc ? "blur-none scale-100" : "blur-xl scale-105")} />}
      {imageSrc && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />}
      <Skeleton className="absolute left-4 top-4 h-7 w-20 rounded-full bg-white/25 motion-reduce:animate-none sm:left-5 sm:top-5" />
      <div className="absolute inset-x-5 bottom-5 flex flex-col gap-4 sm:inset-x-7 sm:bottom-7">
        <Skeleton className="h-9 w-3/4 rounded-lg bg-white/25 motion-reduce:animate-none sm:h-10" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-8 w-28 rounded-lg bg-white/25 motion-reduce:animate-none" />
          <Skeleton className="h-10 w-48 rounded-xl bg-white/25 motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
  return (
    <div
      role="status"
      aria-label="Loading deals"
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={`mx-auto w-full max-w-sm overflow-hidden sm:mx-0 rounded-2xl border border-border/70 bg-card ${index > 0 ? "hidden sm:block" : ""} ${index === 2 ? "sm:hidden lg:block" : ""} ${index === 3 ? "sm:hidden xl:block" : ""}`}
        >
          <Skeleton className="aspect-[4/3] rounded-none motion-reduce:animate-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-3 w-24 motion-reduce:animate-none" />
            <Skeleton className="h-12 w-4/5 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-28 motion-reduce:animate-none" />
            <Skeleton className="h-5 w-full motion-reduce:animate-none" />
            <Skeleton className="h-8 w-24 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-20 motion-reduce:animate-none" />
            <Skeleton className="h-11 w-full rounded-xl motion-reduce:animate-none" />
            <Skeleton className="h-4 w-2/3 mx-auto motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

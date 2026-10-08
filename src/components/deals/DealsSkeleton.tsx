import { Skeleton } from "@/components/ui/skeleton";

export default function DealsSkeleton({ home = false, imageAspectClassName = "aspect-[4/5] sm:aspect-[4/3]" }: { home?: boolean; imageAspectClassName?: string }) {
  if (home)
    return (
      <div
        role="status"
        aria-label="Loading deals"
        className="overflow-hidden rounded-2xl border border-white/10 bg-forest-dark/40"
      >
        <div className={`relative overflow-hidden rounded-t-2xl ${imageAspectClassName}`}>
          <Skeleton className="absolute inset-0 rounded-none bg-white/15 motion-reduce:animate-none" />
          <Skeleton className="absolute left-5 top-5 h-7 w-20 rounded-full bg-white/20 motion-reduce:animate-none" />
          <div className="absolute inset-x-5 bottom-5 flex flex-wrap items-end justify-between gap-4 sm:inset-x-7 sm:bottom-7">
            <div className="space-y-3">
              <Skeleton className="h-8 w-48 max-w-[60vw] rounded-lg bg-white/20 motion-reduce:animate-none sm:w-64" />
              <Skeleton className="h-6 w-24 rounded-lg bg-white/20 motion-reduce:animate-none" />
            </div>
            <Skeleton className="h-9 w-40 rounded-xl bg-white/20 motion-reduce:animate-none" />
          </div>
        </div>
        <div aria-hidden="true" className="bg-white/10 px-5 py-2 backdrop-blur-md sm:px-7">
          <div className="flex min-w-0 gap-3 overflow-hidden px-1 py-1">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex shrink-0 flex-col items-center gap-1">
                <Skeleton className="h-12 w-12 rounded-lg bg-white/10 motion-reduce:animate-none sm:h-14 sm:w-14" />
                <Skeleton className="h-4 w-4 bg-white/10 motion-reduce:animate-none" />
              </div>
            ))}
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

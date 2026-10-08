import { Skeleton } from "@/components/ui/skeleton";

export default function DealsSkeleton({ home = false }: { home?: boolean }) {
  if (home)
    return (
      <div
        role="status"
        aria-label="Loading deals"
        className="grid overflow-hidden rounded-2xl border border-border/70 bg-card md:grid-cols-2"
      >
        <Skeleton className="aspect-[4/3] rounded-none motion-reduce:animate-none md:aspect-auto md:min-h-[28rem]" />
        <div aria-hidden="true" className="space-y-4 p-5 sm:p-6 lg:p-8">
          <Skeleton className="h-3 w-24 motion-reduce:animate-none" />
          <Skeleton className="h-9 w-4/5 motion-reduce:animate-none" />
          <Skeleton className="h-4 w-full motion-reduce:animate-none" />
          <Skeleton className="h-24 w-full motion-reduce:animate-none" />
          <Skeleton className="h-10 w-28 motion-reduce:animate-none" />
          <Skeleton className="h-11 w-full motion-reduce:animate-none" />
        </div>
      </div>
    );
  return (
    <div
      role="status"
      aria-label="Loading deals"
      className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
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

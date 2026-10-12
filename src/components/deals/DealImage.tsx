import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DealImage({
  src,
  className,
  alt = "",
}: {
  src?: string;
  className?: string;
  alt?: string;
}) {
  const [failed, setFailed] = useState<string>();
  const [loaded, setLoaded] = useState<string>();
  if (!src || failed === src) {
    return (
      <div
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        className={cn(
          "flex items-center justify-center text-primary/40",
          className,
        )}
      >
        <Package aria-hidden="true" className="h-10 w-10" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      width={640}
      height={480}
      onLoad={() => setLoaded(src)}
      onError={() => setFailed(src)}
      className={cn(
        "transition-opacity duration-300 ease-out motion-reduce:transition-none",
        loaded === src ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}

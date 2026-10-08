import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DealImage({
  src,
  className,
}: {
  src?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState<string>();
  if (!src || failed === src) {
    return (
      <div
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
      alt=""
      loading="lazy"
      decoding="async"
      width={640}
      height={480}
      onError={() => setFailed(src)}
      className={className}
    />
  );
}

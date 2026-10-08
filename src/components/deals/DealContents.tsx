import { useId } from "react";
import type { DealItem } from "@/api/deals";
import { resolveImageUrl } from "@/api/client";
import DealImage from "./DealImage";

export default function DealContents({ items }: { items: DealItem[] }) {
  const headingId = useId();
  if (!items.length) return null;
  return (
    <div className="mt-5">
      <h4 id={headingId} className="mb-2 text-sm font-semibold">
        What's included
      </h4>
      <ul
        aria-labelledby={headingId}
        className="grid gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2"
      >
        {items.map((item) => (
          <li
            key={item.variantId}
            className="flex min-w-0 items-center gap-3 rounded-xl bg-secondary/50 p-2"
          >
            <DealImage
              src={
                resolveImageUrl(item.variant.thumbnailImage) ??
                resolveImageUrl(item.product.thumbnailImage)
              }
              className="h-14 w-14 shrink-0 rounded-lg bg-card object-contain"
            />
            <div className="min-w-0 text-sm leading-5">
              <p className="break-words font-medium">{item.product.name}</p>
              <p className="break-words text-xs text-muted-foreground">
                {item.variant.name !== item.product.name && (
                  <>{item.variant.name} · </>
                )}
                Qty {item.quantity}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

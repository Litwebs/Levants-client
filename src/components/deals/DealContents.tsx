import { useId } from "react";
import type { DealItem } from "@/api/deals";
import { resolveImageUrl } from "@/api/client";
import DealImage from "./DealImage";

export default function DealContents({ items, compact = false, blurred = true }: { items: DealItem[]; compact?: boolean; blurred?: boolean }) {
  const headingId = useId();
  if (!items.length) return null;
  if (compact) {
    return (
      <div className={`bg-transparent px-5 py-2 sm:px-7 ${blurred ? "backdrop-blur-md" : ""}`}>
        <h4 id={headingId} className="sr-only">
          Included
        </h4>
        <ul aria-labelledby={headingId} className="flex min-w-0 gap-3 overflow-x-auto px-1 py-1">
          {items.map((item) => (
            <li
              key={item.variantId}
              className="flex shrink-0 flex-col items-center gap-1"
              title={`${item.product.name} · ${item.variant.name} · Quantity ${item.quantity}`}
            >
              <DealImage
                src={resolveImageUrl(item.variant.thumbnailImage) ?? resolveImageUrl(item.product.thumbnailImage)}
                alt={item.variant.name || item.product.name}
                className="h-12 w-12 rounded-lg bg-white/10 object-cover object-center ring-1 ring-white/15 sm:h-14 sm:w-14"
              />
              <span className="text-xs font-medium tabular-nums text-white/85">
                <span className="sr-only">Quantity </span><span aria-hidden="true">×</span>{item.quantity}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
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
              alt={item.variant.name || item.product.name}
              className="h-14 w-14 shrink-0 rounded-lg bg-card object-cover object-center"
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

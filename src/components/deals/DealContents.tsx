import { useEffect, useId, useState } from 'react';
import type { DealItem } from '@/api/deals';
import { getProductPresentation, type ProductPresentation } from '@/api/catalogProducts';
import { resolveImageUrl } from '@/api/client';
import { Badge } from '@/components/ui/badge';
import DealImage from './DealImage';
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
export default function DealContents({ items }: { items: DealItem[] }) {
  const heading = useId();
  const [details, setDetails] = useState<Record<string, ProductPresentation>>({});
  useEffect(() => {
    let active = true;
    setDetails({});
    const ids = [...new Set(items.map(item => item.product.id))];
    void Promise.all(ids.map(async id => {
      try { return [id, await getProductPresentation(id)] as const; } catch { return [id, null] as const; }
    })).then(rows => { if (active) setDetails(Object.fromEntries(rows.filter((row): row is readonly [string, ProductPresentation] => row[1] !== null))); });
    return () => { active = false; };
  }, [items]);
  if (!items.length) return null;
  return <section aria-labelledby={heading} className="mt-10 border-t border-border pt-8">
    <h2 id={heading} className="mb-5 font-heading text-2xl font-semibold">What's included</h2>
    <ul className="grid gap-4 md:grid-cols-2">{items.map(item => {
      const product = details[item.product.id];
      const variant = Array.isArray(product?.variants) ? product.variants.find(v => String(v.id ?? v._id) === item.variantId) : undefined;
      const description = text(item.variant.description) || text(variant?.description) || text(item.product.description) || text(product?.description);
      const image = resolveImageUrl(item.variant.thumbnailImage) ?? resolveImageUrl(variant?.thumbnailImage) ?? resolveImageUrl(item.product.thumbnailImage) ?? resolveImageUrl(product?.thumbnailImage);
      return <li key={item.variantId} className="flex min-w-0 items-start gap-4 rounded-2xl border border-border bg-card p-4">
        <DealImage src={image} alt={`${item.product.name} — ${item.variant.name}`} className="h-20 w-20 shrink-0 rounded-xl bg-secondary object-contain p-2 sm:h-24 sm:w-24" />
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="break-words font-semibold">{item.product.name}</h3><Badge variant="secondary">Qty {item.quantity}</Badge></div><p className="mt-1 break-words text-sm text-muted-foreground">{item.variant.name}</p><p className="mt-3 break-words text-sm leading-relaxed">{description || 'Product details are not provided for this item.'}</p></div>
      </li>;
    })}</ul>
  </section>;
}

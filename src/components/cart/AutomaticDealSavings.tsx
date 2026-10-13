import { useCart } from "@/context/CartContext";

export default function AutomaticDealSavings({ showDiscountNote = false }: { showDiscountNote?: boolean }) {
  const { automaticDeals, automaticSavings } = useCart();
  if (!automaticDeals.length) return null;
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary mb-4" aria-live="polite">
      <div className="flex items-start justify-between gap-3 font-medium">
        <span>Deal savings applied automatically</span>
        <span className="whitespace-nowrap">−£{automaticSavings.toFixed(2)}</span>
      </div>
      <ul className="mt-2 space-y-1 text-muted-foreground">
        {automaticDeals.map(({ deal, quantity }) => <li key={deal.id}>{deal.name}{quantity > 1 ? ` × ${quantity}` : ""}</li>)}
      </ul>
      {showDiscountNote ? <p className="mt-2 text-muted-foreground">Discount codes cannot be combined with deal savings.</p> : null}
    </div>
  );
}

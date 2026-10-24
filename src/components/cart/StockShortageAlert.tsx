import { useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import type { StockShortage } from "@/lib/stockShortages";

export default function StockShortageAlert({ shortages }: { shortages: StockShortage[] }) {
  const { openCart } = useCart();
  const alertRef = useRef<HTMLElement>(null);
  useEffect(() => { if (shortages.length) alertRef.current?.focus(); }, [shortages]);
  if (!shortages.length) return null;
  return <section ref={alertRef} tabIndex={-1} role="alert" aria-atomic="true" className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
    <h2 className="font-semibold">Please update your basket</h2>
    <ul className="mt-2 space-y-2 text-sm">
      {shortages.map(item => <li key={item.variantId}>
        <strong>{item.productName} — {item.variantName}:</strong>{" "}
        You requested {item.requested} {item.requested === 1 ? "unit" : "units"}, but only {item.available} {item.available === 1 ? "is" : "are"} currently available.{" "}
        {item.available > 0 ? `Reduce the quantity to ${item.available} or remove the item to continue.` : "Remove the item to continue."}
      </li>)}
    </ul>
    <p className="mt-3 text-sm text-muted-foreground">Your basket has been kept. Stock can change until checkout reserves it.</p>
    <Button onClick={openCart} className="mt-3">Review basket</Button>
  </section>;
}

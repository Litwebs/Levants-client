import type { DeliveryReductionChange } from "@/api/portalSubscriptions";
import { Link } from "react-router-dom";

const money = (minor: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(minor / 100);

export default function DeliveryReductionHistory({ changes }: { changes?: DeliveryReductionChange[] }) {
  if (!changes?.length) return null;
  return <section aria-label="One-time delivery changes" className="mt-3 space-y-3 border-t border-border/70 pt-3 text-sm">
    <h4 className="font-semibold">One-time delivery changes</h4>
    <p className="text-muted-foreground">These changes apply to this delivery. Your regular subscription stays the same.</p>
    {changes.map(change => <div key={change.operationId} className="rounded-lg bg-muted/30 p-3">
      <p className="font-medium">{money(change.creditedMinor)} added as store credit</p>
      <p className="text-xs text-muted-foreground">{new Date(change.createdAt).toLocaleString("en-GB", { timeZone: "Europe/London" })} (UK time)</p>
      <ul className="mt-2 space-y-1">
        {change.before.filter(item => item.quantity !== (change.after.find(after => after.variant === item.variant)?.quantity || 0))
          .map(item => <li key={item.variant}>{item.name}: {item.quantity} → {change.after.find(after => after.variant === item.variant)?.quantity || 0}</li>)}
      </ul>
      <p className="mt-2 text-muted-foreground">Delivery total: {money(change.originalTotalMinor)} → {money(change.revisedTotalMinor)}</p>
      {change.cancelsDelivery && <p>This delivery was cancelled because no items remain.</p>}
    </div>)}
    <Link to="/portal/credit" className="inline-block font-medium text-forest underline underline-offset-4">View store credit and history</Link>
  </section>;
}

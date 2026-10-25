import type { PortalSubscription } from "@/api/portalSubscriptions";

const money = (minor: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(minor / 100);
export default function RecurringPriceNotice({ change }: { change: PortalSubscription["recurringPriceChange"] }) {
  if (!change) return null;
  return <p role="status" className="mt-2 text-sm text-muted-foreground">
    {change.status === "applied"
      ? `Updated recurring price: ${money(change.nextAmountMinor)} per billing period, including delivery.`
      : `A recurring price update from ${money(change.previousAmountMinor)} to ${money(change.nextAmountMinor)} per billing period, including delivery, is pending. It will apply to a future unlocked, unbilled period once billing is ready.`}
    {" "}Already paid deliveries keep their original prices.
  </p>;
}

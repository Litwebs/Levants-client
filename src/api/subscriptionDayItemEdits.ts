export type ItemDayPlan = { day: number; items: Array<{ variantId: string; quantity: number }> };

export function needsItemRefundChoice(paymentState: "paid" | "unpaid" | undefined, locked: boolean, delta: number) {
  // Older servers omit paymentState: retain the settlement choice in that case.
  return !locked && delta < 0 && paymentState !== "unpaid";
}

export class DeliveryDayEditError extends Error {
  constructor(public readonly completedDays: number[], cause: unknown) {
    const message = (cause as { message?: unknown })?.message;
    const detail = typeof message === "string" ? message : "A delivery-day change did not complete.";
    super(completedDays.length ? "Changes for " + completedDays.length + " delivery day(s) were saved. " + detail +
      " Retry to continue the remaining changes." : detail);
  }
}

// A paid day and an unpaid day have different financial contracts. Submit each
// changed day with the version returned by the previous one. Never send another
// day's draft before its own operation, or continue after an uncertain outcome.
export async function saveDeliveryDayItemEdits<R extends { success: boolean; data?: { subscription?: { customerVersion: number } } }>({
  baseline, requested, changedDays, expectedVersion, send, onApplied,
}: {
  baseline: ItemDayPlan[];
  requested: ItemDayPlan[];
  changedDays: number[];
  expectedVersion: number;
  send: (payload: { deliveryDayPlans: ItemDayPlan[]; changedDeliveryDays: number[]; expectedVersion: number }) => Promise<R>;
  onApplied: (response: R) => void;
}): Promise<R[]> {
  let current = baseline;
  let version = expectedVersion;
  const results: R[] = [];
  const completedDays: number[] = [];
  for (const day of [...new Set(changedDays)].sort((a, b) => a - b)) {
    try {
      const selection = requested.find(plan => plan.day === day);
      if (!selection?.items.length) throw new Error("Please keep at least one product in each delivery.");
      const next = current.map(plan => plan.day === day ? selection : plan);
      if (!next.some(plan => plan.day === day)) throw new Error("Delivery days changed. Reload before saving.");
      const result = await send({ deliveryDayPlans: next, changedDeliveryDays: [day], expectedVersion: version });
      const nextVersion = result.data?.subscription?.customerVersion;
      if (!result.success || !Number.isSafeInteger(nextVersion)) throw new Error("Reload to confirm the saved subscription change.");
      version = nextVersion!;
      current = next;
      results.push(result);
      completedDays.push(day);
      onApplied(result);
    } catch (error) {
      throw new DeliveryDayEditError(completedDays, error);
    }
  }
  return results;
}

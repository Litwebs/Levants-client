export function recurringItemPaymentMessage(
  paymentState: "paid" | "unpaid" | undefined,
  locked: boolean,
  extraAmount?: string,
): string {
  if (locked) return "These changes apply after the locked delivery. No payment is taken now.";
  if (paymentState === "unpaid") return "Your unpaid delivery invoice is updated. No separate payment is taken when you save, and reductions do not issue a refund or store credit.";
  if (paymentState === "paid") return extraAmount
    ? `The extra ${extraAmount} is charged to your card when you save because this delivery is already paid.`
    : "For this already paid delivery, added items are charged when you save; reductions use your refund or credit choice.";
  return "For a paid delivery, added items are charged when you save. For an unpaid delivery, its invoice is updated without a separate payment.";
}

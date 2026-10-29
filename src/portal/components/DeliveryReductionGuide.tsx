/** Customer-facing guidance only: no API calls or account mutations. */
export default function DeliveryReductionGuide() {
  return <details data-tour="delivery-reduction-guide" className="text-sm">
    <summary className="cursor-pointer py-2 text-sm font-medium text-muted-foreground">How delivery-only changes work</summary>
    <div className="space-y-3 pt-2 text-muted-foreground">
      <p>Reduce or remove recurring items from one eligible paid delivery without changing your regular subscription. Future deliveries keep their regular quantities.</p>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Expand the delivery date below and choose <strong>Edit delivery</strong>. Check the cut-off shown in UK time.</li>
        <li>Use whole numbers from zero to the current quantity, or choose Remove. You cannot increase quantities or swap products here.</li>
        <li>Choose <strong>Review change</strong> to check the original total, revised total, delivery fee and store credit. Reviewing does not apply the change.</li>
        <li>Choose <strong>Confirm delivery change</strong> only when ready. Then expand that delivery for its adjusted items and history, or open Store Credit to see the credit entry.</li>
      </ol>
      <p><strong>Credit and extras:</strong> Credit uses the paid delivery's saved prices, not today's catalogue prices. It stays in your account; it is not a card or cash refund. Paid one-time add-ons stay unchanged. If no items or add-ons remain, only that delivery is cancelled and its eligible delivery fee is included in the credit. Your subscription remains active.</p>
      <p><strong>If the button is missing:</strong> New reductions require an active subscription and a confirmed, paid, unfulfilled delivery before its cut-off. Unpaid forecasts, protected deliveries and passed cut-offs are not eligible. A delivery needing payment or stock reconciliation may require help from the dairy.</p>
      <p><strong>If confirmation is interrupted:</strong> Keep using this browser and expand the delivery and choose <strong>Check result</strong>. This checks the same saved request, including after the cut-off, without issuing the same credit twice. Do not start a replacement change while its result is unknown. If checking remains unresolved, contact the dairy before making another change.</p>
      <p><strong>Stale review:</strong> If the delivery changed during review, reload it and review the current quantities and credit again. Before an adjusted delivery's cut-off, recurring product or schedule changes may be blocked to protect that adjustment. One-time add-ons are a separate purchase.</p>
    </div>
  </details>;
}

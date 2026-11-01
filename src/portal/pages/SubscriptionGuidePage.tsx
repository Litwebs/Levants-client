import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/portal/components/PortalUI";
import { usePortalToursPreference } from "@/portal/tours/PortalTour";

const sections = [
  { id: "start", title: "Set up your subscription", steps: [
    "Open My Subscriptions and choose New Subscription. Choose the available delivery days and frequency.",
    "Choose products and quantities for each selected day, then select your saved delivery address and instructions.",
    "Review the products, delivery fees, payment method and total before confirming. Each delivery day can have its own products."
  ], limit: "Only products marked as subscription eligible can repeat. Other products may still be available as one-time extras." },
  { id: "regular-order", title: "Change your regular order", steps: [
    "Open your subscription to change recurring quantities, add eligible products, or update the available delivery settings.",
    "Check the cut-off shown in UK time for each delivery day. Read which delivery the change will affect.",
    "Review any payment, refund or store credit shown, then save. Opening a preview does not apply a change."
  ], limit: "Changes cannot alter a delivery that is already protected for fulfilment. After a cut-off, eligible recurring changes may apply to a later delivery. The page shows the effective date." },
  { id: "extras", title: "Add products once, with your subscription delivery", steps: [
    "Open My Subscriptions, then View details on your active subscription.",
    "Choose Add to next delivery. Check the target delivery date and its cut-off.",
    "Choose the extras, review Charge now, then confirm payment. These products arrive once with that delivery; your regular order stays unchanged."
  ], limit: "Use this add-on flow for extras on the existing eligible subscription delivery. A separate shop checkout is a separate order and may have its own delivery fee. Paid add-ons cannot be edited or reversed through this flow; contact the dairy for help." },
  { id: "one-delivery", title: "Reduce or remove items from one delivery", steps: [
    "Expand an eligible paid delivery and choose Change This Delivery Only before its cut-off.",
    "Reduce recurring quantities using whole numbers, or remove an item. Choose Review change to check quantities, fees and store credit.",
    "Choose Confirm delivery change to apply it. Future recurring quantities and paid one-time extras stay unchanged.",
    "Expand the delivery to see the saved adjustment, or open Store Credit for its credit entry."
  ], limit: "You cannot increase quantities or swap products here. Credit uses the saved paid prices and stays in your account; it is not a cash or card refund. If no items or extras remain, only that delivery is cancelled and its eligible delivery fee is credited. Your subscription remains active." },
  { id: "pause", title: "Pause and resume", steps: [
    "Open your subscription and choose Pause. Select a resume date within the range shown.",
    "Review the affected deliveries and any available refund or store credit choice, then confirm.",
    "A dated pause resumes automatically when it ends. You can also open the paused subscription and choose Resume."
  ], limit: "You cannot edit a paused plan. Deliveries already on their way or past their cut-off stay in place. Review the confirmation for any payment needed when resuming." },
  { id: "cancel", title: "Cancel your subscription", steps: [
    "Open the subscription, choose Cancel, and read the effective date and treatment of prepaid deliveries.",
    "Review any available refund or store credit choice, then confirm only when ready."
  ], limit: "Cancellation is different from pausing. Protected deliveries may still go ahead. Cancelled subscriptions cannot be edited or resumed; create a new subscription if you want to restart." },
  { id: "payment", title: "Payments, credit and unavailable actions", steps: [
    "Check your subscription and Payments page for payment or stock messages. Future deliveries are confirmed after the required payment succeeds.",
    "If a change was interrupted, use Check result or Retry original request in the same browser. Check the original operation before starting another.",
    "If the result remains unknown or an action is unavailable, contact the dairy through Contact. Keep the order or subscription reference handy."
  ], limit: "Unpaid forecasts, passed cut-offs, protected deliveries, pending changes or payment reconciliation can prevent an action. Do not submit a replacement while the original result is unknown. Store credit is kept in your account and is separate from a card refund." }
];

export default function SubscriptionGuidePage() {
  const [toursEnabled, setToursEnabled] = usePortalToursPreference();
  const location = useLocation();
  useEffect(() => {
    if (!location.hash) return;
    const frame = requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, [location.hash]);
  return <div className="mx-auto max-w-3xl space-y-4 py-4 text-sm">
    <PageHeader title="How to use your subscription" description="What you can change, what stays fixed, and how to manage each delivery."
      action={<Button asChild size="sm" variant="outline"><Link to="/portal/subscriptions">My subscriptions</Link></Button>} />
    <nav aria-label="Guide topics" className="flex flex-wrap gap-2">
      {sections.map(section => <Button key={section.id} asChild size="sm" variant="outline"><a href={"#" + section.id}>{section.title}</a></Button>)}
    </nav>
    {sections.map(section => <Card key={section.id} id={section.id} className="scroll-mt-28">
      <CardHeader className="p-4 pb-2"><CardTitle className="font-sans text-base">{section.title}</CardTitle></CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <ol className="list-decimal space-y-2 pl-5 leading-relaxed">{section.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <p className="border-l-2 border-border pl-3 leading-relaxed text-muted-foreground">{section.limit}</p>
      </CardContent>
    </Card>)}
    <Card><CardContent className="flex items-start justify-between gap-4 p-4">
      <div><label htmlFor="optional-tours" className="font-medium">Enable optional page tours</label>
        <p className="mt-1 text-muted-foreground">Off by default. When enabled, use Take a tour on a supported portal page. Tours never open automatically. This setting applies to this browser.</p>
      </div>
      <Switch id="optional-tours" checked={toursEnabled} onCheckedChange={setToursEnabled} />
    </CardContent></Card>
    <Button asChild size="sm" variant="outline"><Link to="/contact">Contact the dairy</Link></Button>
  </div>;
}

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronRight, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { usePortalToursPreference } from "@/portal/tours/PortalTour";

type Step = { title: string; text: string; image: string };
type Guide = { id: string; title: string; note: string; steps: Step[] };
const guides: Guide[] = [
  { id: "start", title: "Start a subscription", note: "Only subscription-eligible products can repeat. Check the total before confirming.", steps: [
    { title: "Open My subscriptions", text: "Tap New Subscription.", image: "subscriptions" },
    { title: "Choose delivery days", text: "Select the days you want. Tap Continue.", image: "new-days" },
    { title: "Choose how often", text: "Pick your delivery frequency. Tap Continue.", image: "new-frequency" },
    { title: "Choose your products", text: "Add products and quantities for each delivery day.", image: "new-products" },
    { title: "Choose your address", text: "Select your delivery address and add any instructions.", image: "new-address" },
    { title: "Review and confirm", text: "Check your order, delivery fee and payment method. Confirm when ready.", image: "new-review" },
  ] },
  { id: "regular-order", title: "Change my regular order", note: "Changes apply to future eligible deliveries. Check the effective date before saving.", steps: [
    { title: "Open your subscription", text: "Tap View details on the subscription you want to change.", image: "subscriptions" },
    { title: "Change your products", text: "Adjust quantities, or tap Add products for something new.", image: "products" },
    { title: "Review before saving", text: "Check the change and any charge or credit shown. Tap Save product changes.", image: "products-review" },
  ] },
  { id: "extras", title: "Add a one-off extra", note: "Extras arrive once with the selected delivery. Your regular order stays the same. Paid extras cannot be edited here.", steps: [
    { title: "Open Deliveries", text: "In your subscription, tap Add extras.", image: "delivery" },
    { title: "Pick your extras", text: "Check the delivery date, then choose products and quantities.", image: "extras" },
    { title: "Check and pay", text: "Review Charge now and confirm payment when ready.", image: "extras" },
  ] },
  { id: "one-delivery", title: "Change just one delivery", note: "Before the cut-off, you can reduce or remove recurring items. You cannot increase or swap them here. Any credit stays in your account; paid extras stay unchanged.", steps: [
    { title: "Open the delivery", text: "Expand its date. Tap Change This Delivery Only.", image: "delivery" },
    { title: "Reduce or remove items", text: "Lower a quantity, or remove the item.", image: "reduce" },
    { title: "Review and confirm", text: "Tap Review change. Check the credit, then Confirm delivery change.", image: "reduce-review" },
  ] },
  { id: "pause", title: "Pause deliveries", note: "Deliveries past their cut-off may still arrive. You cannot edit your regular order while paused.", steps: [
    { title: "Open subscription controls", text: "Scroll to the bottom of your subscription. Tap Pause.", image: "management" },
    { title: "Choose when to resume", text: "Select a resume date and review any refund or credit choice.", image: "pause" },
    { title: "Confirm your pause", text: "Tap Pause subscription. It resumes automatically on your chosen date.", image: "pause" },
  ] },
  { id: "resume", title: "Resume deliveries", note: "Check the next delivery date and any payment shown before confirming.", steps: [
    { title: "Open your paused subscription", text: "Tap View details in My subscriptions.", image: "subscriptions" },
    { title: "Resume your plan", text: "Tap Resume subscription, then review and confirm.", image: "resume" },
  ] },
  { id: "cancel", title: "Cancel a subscription", note: "Protected deliveries may still arrive. A cancelled subscription cannot be resumed.", steps: [
    { title: "Open subscription controls", text: "Scroll to the bottom. Tap Cancel subscription.", image: "management" },
    { title: "Read and confirm", text: "Check when it stops and any refund or credit choice. Confirm only when ready.", image: "cancel" },
  ] },
];

export default function SubscriptionGuidePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [toursEnabled, setToursEnabled] = usePortalToursPreference();
  const id = location.hash.slice(1);
  const guide = guides.find(item => item.id === id);
  const current = guide?.steps[Math.min(step, guide.steps.length - 1)];
  useEffect(() => { setStep(0); setZoomed(false); }, [id]);
  const choose = (next: string) => { setStep(0); navigate({ pathname: location.pathname, hash: next }); };
  const changeStep = (next: number) => { setStep(next); document.getElementById("guide-walkthrough")?.scrollIntoView({ block: "start", behavior: "instant" }); };
  const image = current ? `/guides/subscriptions/${current.image}.png` : "";

  return <div className="mx-auto w-full max-w-2xl space-y-4 py-3 text-sm">
    <div className="flex items-start justify-between gap-3">
      <div><h1 className="font-heading text-xl font-semibold sm:text-2xl">Subscription help</h1><p className="mt-1 text-sm text-muted-foreground">Choose a task. Follow the pictures.</p></div>
      <Button asChild size="sm" variant="outline"><Link to="/portal/subscriptions">My subscriptions</Link></Button>
    </div>

    {!guide ? <nav aria-label="Subscription help topics" className="grid gap-2 sm:grid-cols-2">
      {guides.map(item => <Button key={item.id} size="sm" variant="outline" onClick={() => choose(item.id)} className="h-auto min-h-12 justify-between gap-3 whitespace-normal px-4 py-3 text-left"><span>{item.title}</span><ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" /></Button>)}
    </nav> : current && <section id="guide-walkthrough" className="scroll-mt-28 space-y-3" aria-label={guide.title}>
      <Button size="sm" variant="ghost" onClick={() => choose("")} className="-ml-2"><ArrowLeft className="h-4 w-4" />All topics</Button>
      <Card className="overflow-hidden shadow-none"><CardContent className="space-y-4 p-4 sm:p-5">
        <div><p className="text-xs font-medium text-muted-foreground">{guide.title} · Step {step + 1} of {guide.steps.length}</p>
          <h2 tabIndex={-1} className="mt-2 text-lg font-semibold" aria-live="polite">{step + 1}. {current.title}</h2>
          <p className="mt-1 leading-relaxed">{current.text}</p>
        </div>
        <button type="button" onClick={() => setZoomed(true)} className="group block w-full overflow-hidden rounded-xl border border-border bg-muted/30 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Enlarge screenshot: ${current.title}`}>
          <img key={image} src={image} alt={`Customer portal: ${current.title}`} width={390} className="mx-auto max-h-[420px] w-auto max-w-full rounded-lg object-contain" />
          <span className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ZoomIn className="h-3.5 w-3.5" />Tap to enlarge</span>
        </button>
        <div className="flex items-center justify-between gap-3">
          <Button size="sm" variant="outline" disabled={step === 0} onClick={() => changeStep(step - 1)}><ArrowLeft className="h-4 w-4" />Back</Button>
          <span className="text-xs text-muted-foreground" role="status">{step + 1} / {guide.steps.length}</span>
          {step < guide.steps.length - 1 ? <Button size="sm" onClick={() => changeStep(step + 1)}>Next<ArrowRight className="h-4 w-4" /></Button> : <Button size="sm" onClick={() => choose("")}>Done</Button>}
        </div>
        <details className="border-t border-border pt-3"><summary className="cursor-pointer font-medium">Good to know</summary><p className="mt-2 leading-relaxed text-muted-foreground">{guide.note}</p></details>
      </CardContent></Card>
      <p className="text-center text-xs text-muted-foreground">Screenshots use sample details. Your dates and prices may differ.</p>
      <Dialog open={zoomed} onOpenChange={setZoomed}><DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto p-4"><DialogHeader><DialogTitle className="text-base">{current.title}</DialogTitle></DialogHeader><img src={image} alt={`Customer portal: ${current.title}`} className="mx-auto h-auto w-full max-w-[390px]" /></DialogContent></Dialog>
    </section>}

    <details className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-medium">Payment problem or missing button?</summary><p className="mt-2 leading-relaxed text-muted-foreground">Check the cut-off and any payment message. If a change was interrupted, use Check result before trying again.</p><Button asChild size="sm" variant="outline" className="mt-3"><Link to="/contact">Contact the dairy</Link></Button></details>
    <details className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-medium">Optional page tours</summary><div className="mt-3 flex items-center justify-between gap-4"><label htmlFor="optional-tours" className="text-muted-foreground">Enable Take a tour. Off by default.</label><Switch id="optional-tours" checked={toursEnabled} onCheckedChange={setToursEnabled} /></div></details>
  </div>;
}

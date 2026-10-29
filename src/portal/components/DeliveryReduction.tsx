import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ApiError } from "@/api/client";
import { portalSubscriptionsApi, type DeliveryReductionQuote, type DeliveryReductionResult, type PortalSubscriptionDelivery } from "@/api/portalSubscriptions";
import { clearDeliveryReduction, deliveryReductionKey, readDeliveryReduction, saveDeliveryReduction, type PendingDeliveryReduction } from "@/api/deliveryReductionRetry";

const money = (minor: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(minor / 100);
const date = (value: string) => new Date(value).toLocaleString("en-GB", { timeZone: "Europe/London", dateStyle: "medium", timeStyle: "short" });
const message = (error: unknown) => error instanceof Error ? error.message : "Unable to check this delivery. Please try again.";

function validQuote(value: DeliveryReductionQuote | undefined, deliveryId: string): value is DeliveryReductionQuote {
  return Boolean(value && value.deliveryId === deliveryId && Array.isArray(value.before) && value.before.length > 0 &&
    value.before.every(item => item && typeof item.variant === "string" && typeof item.name === "string" &&
      Number.isSafeInteger(item.quantity) && item.quantity > 0 && Number.isFinite(item.unitPrice) && item.unitPrice >= 0) &&
    Array.isArray(value.after) && value.after.every(item => item && typeof item.variant === "string" && Number.isSafeInteger(item.quantity)) &&
    Number.isSafeInteger(value.expectedVersion) && value.expectedVersion >= 0 && /^[\da-f]{64}$/i.test(value.quoteToken) &&
    Number.isFinite(Date.parse(value.cutoffAt)) && Number.isFinite(Date.parse(value.scheduledDate)) &&
    [value.originalTotalMinor, value.revisedTotalMinor, value.creditedMinor, value.deliveryFeeMinor]
      .every(amount => Number.isSafeInteger(amount) && amount >= 0));
}

function definitiveRejection(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  const data = (error.body as { data?: { code?: string; staleSubscription?: boolean } })?.data;
  return error.status === 400 || error.status === 422 || (error.status === 409 &&
    (data?.staleSubscription || ["STALE_DELIVERY_QUOTE", "DELIVERY_CUTOFF_PASSED", "DELIVERY_CHANGE_UNAVAILABLE",
      "DELIVERY_STOCK_RECONCILIATION", "INVALID_DELIVERY_QUANTITIES"].includes(data?.code || "")));
}

type Props = {
  customerId: string;
  subscriptionId: string;
  delivery: PortalSubscriptionDelivery;
  onChanged: (result: DeliveryReductionResult) => Promise<void>;
};

export default function DeliveryReduction({ customerId, subscriptionId, delivery, onChanged }: Props) {
  const key = deliveryReductionKey(customerId, subscriptionId, delivery._id);
  const [pending, setPending] = useState(() => readDeliveryReduction(key));
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<DeliveryReductionQuote | null>(null);
  const [review, setReview] = useState<DeliveryReductionQuote | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<DeliveryReductionResult | null>(null);
  const busyRef = useRef(false);
  const confirming = useRef(false);
  const generation = useRef(0);

  async function load() {
    if (busyRef.current) return;
    const serial = ++generation.current;
    busyRef.current = true; setBusy(true); setError(""); setInitial(null); setReview(null);
    try {
      const response = await portalSubscriptionsApi.getDeliveryReduction(subscriptionId, delivery._id);
      if (!response.success || !validQuote(response.data, delivery._id)) throw new Error("Unable to load this delivery. Please try again.");
      if (serial !== generation.current) return;
      setInitial(response.data);
      setQuantities(Object.fromEntries(response.data.before.map(item => [item.variant, String(item.quantity)])));
    } catch (failure) { if (serial === generation.current) setError(message(failure)); }
    finally { if (serial === generation.current) { busyRef.current = false; setBusy(false); } }
  }

  function changeOpen(next: boolean) {
    if (confirming.current) return;
    setOpen(next);
    if (!next) { generation.current++; busyRef.current = false; setBusy(false); }
    if (next) {
      setSuccess(null); setError("");
      const saved = readDeliveryReduction(key);
      setPending(saved);
      if (saved) { setInitial(saved.quote); setReview(saved.quote); }
      else void load();
    }
  }

  const selection = initial?.before.map(item => ({ variant: item.variant, quantity: Number(quantities[item.variant]) })) || [];
  const valid = Boolean(initial?.before.length) && initial.before.every(item => {
    const raw = quantities[item.variant]; const quantity = Number(raw);
    return raw !== "" && Number.isSafeInteger(quantity) && quantity >= 0 && quantity <= item.quantity;
  });
  const changed = valid && initial?.before.some(item => Number(quantities[item.variant]) !== item.quantity);

  async function preview() {
    if (busyRef.current || !changed) return;
    busyRef.current = true; setBusy(true); setError("");
    const serial = ++generation.current;
    try {
      const response = await portalSubscriptionsApi.previewDeliveryReduction(subscriptionId, delivery._id, selection);
      if (serial !== generation.current) return;
      if (!response.success || !validQuote(response.data, delivery._id)) throw new Error("Unable to review this change. Please try again.");
      setReview(response.data);
    } catch (failure) { if (serial === generation.current) { setReview(null); setError(message(failure)); } }
    finally { if (serial === generation.current) { busyRef.current = false; setBusy(false); } }
  }

  async function confirm() {
    if (busyRef.current || (!pending && !review?.hasChanges)) return;
    const saved: PendingDeliveryReduction = pending || { quote: review!, request: {
      items: selection, quoteToken: review!.quoteToken, expectedVersion: review!.expectedVersion,
      operationId: crypto.randomUUID(),
    } };
    saveDeliveryReduction(key, saved); setPending(saved);
    busyRef.current = true; confirming.current = true; setBusy(true); setError("");
    let result: DeliveryReductionResult | null = null;
    try {
      const response = await portalSubscriptionsApi.confirmDeliveryReduction(subscriptionId, delivery._id, saved.request);
      if (!response.success || !response.data || response.data.deliveryId !== delivery._id ||
          !Number.isSafeInteger(response.data.creditedMinor) || response.data.creditedMinor < 0 ||
          !Number.isSafeInteger(response.data.revisedTotalMinor) || response.data.revisedTotalMinor < 0 ||
          !Number.isSafeInteger(response.data.customerVersion) || !response.data.adjustment ||
          typeof response.data.adjustment.cancelsDelivery !== "boolean") {
        throw new Error("The result could not be confirmed. Check the result again before making another change.");
      }
      result = response.data;
      clearDeliveryReduction(key); setPending(null); setSuccess(result); setReview(null);
    } catch (failure) {
      if (definitiveRejection(failure)) {
        clearDeliveryReduction(key); setPending(null); setReview(null); setInitial(null);
      }
      setError(message(failure));
    } finally { busyRef.current = false; confirming.current = false; setBusy(false); }
    // A display refresh failure must not turn a confirmed financial success
    // into another confirmation attempt or a misleading "change failed" state.
    if (result) {
      try { await onChanged(result); }
      catch { setError("Your change is saved. Refresh the page to update the delivery and your credit balance."); }
    }
  }

  if (!customerId || (!delivery.canChangeThisDelivery && !pending && !open)) return null;
  const shown = pending?.quote || review;
  const addonMinor = initial ? initial.originalTotalMinor - initial.before.reduce((sum, item) => sum + Math.round(item.unitPrice * 100) * item.quantity, 0) - initial.deliveryFeeMinor : 0;

  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild><Button size="sm" type="button" variant="outline" data-tour="delivery-reduction" aria-label={pending ? "Check delivery change" : "Change This Delivery Only"}>
      {pending ? "Check result" : "Change This Delivery Only"}
    </Button></DialogTrigger>
    <DialogContent data-tour-page="delivery-reduction" data-tour-ready={!busy && Boolean(initial || pending || success || error)} onCloseAutoFocus={event => {
      if (success && !delivery.canChangeThisDelivery) {
        const fallback = document.getElementById(`delivery-toggle-${delivery._id}`);
        if (fallback) { event.preventDefault(); fallback.focus(); }
      }
    }} className="max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-xl p-4 sm:p-6 [&>button:last-child]:right-1 [&>button:last-child]:top-1 [&>button:last-child]:min-w-8">
      <DialogHeader className="pr-8">
        <DialogTitle>{success ? "Delivery changed" : "Change this delivery only"}</DialogTitle>
        <DialogDescription>{success ? "Your regular subscription stays the same." : `Edit ${date(delivery.scheduledDate)} (UK time) only. Your regular subscription stays the same.`}</DialogDescription>
      </DialogHeader>
      {busy && <p role="status" className="text-sm text-muted-foreground">{pending ? "Checking your delivery change…" : "Loading delivery details…"}</p>}
      {error && <p data-tour="reduction-error" role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">{error}</p>}
      {success ? <div data-tour="reduction-success" className="space-y-3 text-sm" role="status">
        <p className="font-semibold text-forest">{money(success.creditedMinor)} added as store credit</p>
        <p>Revised delivery total: {money(success.revisedTotalMinor)}</p>
        {success.adjustment.cancelsDelivery && <p>This delivery was cancelled because no items remain.</p>}
        <Link data-tour="reduction-credit" className="inline-block text-forest underline underline-offset-4" to="/portal/credit">View store credit and history</Link>
        <Button size="sm" type="button" className="w-full" onClick={() => changeOpen(false)}>Done</Button>
      </div> : <>
        {pending ? <p data-tour="reduction-pending" className="rounded-lg bg-muted p-3 text-sm">Check your previous change before continuing. Checking again will not issue duplicate credit.</p> : initial && <div data-tour="reduction-quantities" className="space-y-3">
          <p data-tour="reduction-deadline" className="text-sm text-muted-foreground">Editable until {date(initial.cutoffAt)} (UK time).</p>
          {initial.before.map(item => <div key={item.variant} className="space-y-2 rounded-lg border border-border p-3">
            <label className="block break-words text-sm font-medium" htmlFor={`reduction-${delivery._id}-${item.variant}`}>{item.name}</label>
            <p className="text-xs text-muted-foreground">Currently {item.quantity} × {money(Math.round(item.unitPrice * 100))}</p>
            <div className="flex items-center gap-3">
              <input id={`reduction-${delivery._id}-${item.variant}`} type="number" inputMode="numeric" min={0} max={item.quantity} step={1}
                value={quantities[item.variant] ?? ""} disabled={busy}
                onChange={event => { setQuantities(current => ({ ...current, [item.variant]: event.target.value })); setReview(null); setError(""); }}
                className=" w-24 rounded-md border border-input bg-background px-3 text-base" />
              <Button size="sm" type="button" variant="outline" disabled={busy || quantities[item.variant] === "0"} onClick={() => {
                setQuantities(current => ({ ...current, [item.variant]: "0" })); setReview(null); setError("");
              }}>Remove</Button>
              {quantities[item.variant] === "0" && <span className="text-xs text-muted-foreground">Removed for this delivery</span>}
            </div>
          </div>)}
          {addonMinor > 0 && <p className="text-sm text-muted-foreground">Your paid one-time add-ons stay on this delivery.</p>}
          {!valid && <p className="text-sm text-destructive">Use whole numbers from zero to the current quantity.</p>}
          {!shown && <p className="text-sm">Current delivery total: {money(initial.originalTotalMinor)}</p>}
        </div>}
        {shown && <section data-tour="reduction-review" aria-label="Review delivery change" className="space-y-3 rounded-lg bg-muted/40 p-3 text-sm">
          <h3 className="font-semibold">Review your change</h3>
          {shown.before.map(item => <p key={item.variant} className="break-words">{item.name}: {item.quantity} → {shown.after.find(after => after.variant === item.variant)?.quantity || 0}</p>)}
          <dl className="space-y-2 border-t border-border pt-3">
            <div className="flex justify-between gap-3"><dt>Original delivery total</dt><dd>{money(shown.originalTotalMinor)}</dd></div>
            <div className="flex justify-between gap-3"><dt>Revised delivery total</dt><dd>{money(shown.revisedTotalMinor)}</dd></div>
            <div className="flex justify-between gap-3"><dt>Delivery fee included</dt><dd>{money(shown.deliveryFeeMinor)}</dd></div>
            <div className="flex justify-between gap-3 font-semibold text-forest"><dt>Store credit to receive</dt><dd>{money(shown.creditedMinor)}</dd></div>
          </dl>
          {shown.cancelsDelivery && <p>No items remain: this delivery will be cancelled. Eligible delivery fees are included in your credit.</p>}
          <p className="text-muted-foreground">The difference returns as store credit.</p>
        </section>}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button size="sm" type="button" variant="outline" disabled={confirming.current} onClick={() => changeOpen(false)}>Close</Button>
          {pending || review ? <Button size="sm" data-tour={pending ? "reduction-check" : "reduction-confirm"} type="button" disabled={busy || (!pending && (!valid || !review?.hasChanges))} onClick={() => void confirm()}>
            {pending ? "Check result" : "Confirm delivery change"}
          </Button> : initial ? <Button size="sm" data-tour="reduction-preview" type="button" disabled={busy || !changed} onClick={() => void preview()}>Review change</Button>
            : <Button size="sm" data-tour="reduction-reload" type="button" disabled={busy} onClick={() => void load()}>Reload delivery</Button>}
        </div>
      </>}
    </DialogContent>
  </Dialog>;
}

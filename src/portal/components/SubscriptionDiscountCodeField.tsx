import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { subscriptionCodeRejection } from "./subscriptionCodeFeedback";

type Props = {
  value: string;
  appliedCode: string;
  loading: boolean;
  rejection: ReturnType<typeof subscriptionCodeRejection>;
  onChange: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
};

export default function SubscriptionDiscountCodeField({ value, appliedCode, loading, rejection, onChange, onApply, onRemove }: Props) {
  const invalid = Boolean(rejection && value.trim().toUpperCase() === appliedCode);
  return <div className="space-y-3 border-t border-border pt-4">
    <label htmlFor="subscription-discount-code" className="text-sm font-medium">Subscription discount code <span className="font-normal text-muted-foreground">(optional)</span></label>
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input id="subscription-discount-code" aria-label="Subscription discount code" value={value} maxLength={32} autoComplete="off" autoCapitalize="characters" spellCheck={false}
        aria-invalid={invalid || undefined} aria-describedby={`subscription-code-help${rejection ? " subscription-code-error" : ""}`}
        className={`min-w-0 flex-1 ${invalid ? "border-destructive focus-visible:ring-destructive" : ""}`}
        onChange={event => onChange(event.target.value.toUpperCase())} placeholder="Enter code" />
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1 sm:flex-none" disabled={loading || value.trim().length < 3} onClick={onApply}>Apply</Button>
        {appliedCode && !rejection && <Button type="button" variant="ghost" disabled={loading} onClick={onRemove}>Remove</Button>}
      </div>
    </div>
    <p id="subscription-code-help" className="text-sm text-muted-foreground">For first-time subscribers only. One use per customer, on products in the first payment.</p>
    {rejection && <div id="subscription-code-error" role="alert" className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <div className="min-w-0 space-y-2">
        <p className="text-sm font-semibold text-foreground">{rejection.title}</p>
        <p className="text-sm text-muted-foreground">{rejection.description}</p>
        <p className="text-sm text-muted-foreground">{rejection.allowAnotherCode ? "Try another code above, or continue without this code." : "Continue without this code to review your subscription at the normal price."}</p>
        <Button type="button" variant="outline" disabled={loading} onClick={onRemove}>Continue without code</Button>
      </div>
    </div>}
  </div>;
}

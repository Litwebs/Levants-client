import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
interface QuantityStepperProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  label?: string;
  decreaseLabel?: string;
  increaseLabel?: string;
  fullWidth?: boolean;
}
const QuantityStepper: React.FC<QuantityStepperProps> = ({ quantity, onQuantityChange, min = 1, max = 99, size = 'md', disabled = false, label = 'Quantity', decreaseLabel = 'Decrease quantity', increaseLabel = 'Increase quantity', fullWidth = false }) => {
  const decrease = () => { if (quantity > min) onQuantityChange(quantity - 1); };
  const increase = () => { if (quantity < max) onQuantityChange(quantity + 1); };
  if (size === 'sm') return (
    <div role="group" aria-label={label} className={cn("inline-flex h-8 items-center rounded-lg border border-border bg-card", fullWidth && "w-full justify-between")}>
      <Button type="button" variant="ghost" size="quantity" className="h-8 w-8 rounded-lg p-0" disabled={disabled || quantity <= min} onClick={decrease} aria-label={decreaseLabel}><Minus aria-hidden="true" /></Button>
      <span aria-live="polite" aria-atomic="true" className="w-8 text-center text-sm font-medium tabular-nums">{quantity}</span>
      <Button type="button" variant="ghost" size="quantity" className="h-8 w-8 rounded-lg p-0" disabled={disabled || quantity >= max} onClick={increase} aria-label={increaseLabel}><Plus aria-hidden="true" /></Button>
    </div>
  );
  return (
    <div role="group" aria-label={label} className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card">
      <Button type="button" variant="ghost" size="quantity" disabled={disabled || quantity <= min} onClick={decrease} aria-label={decreaseLabel}><Minus aria-hidden="true" /></Button>
      <span aria-live="polite" aria-atomic="true" className={cn('text-center font-medium tabular-nums', size === 'lg' ? 'w-10 text-lg' : 'w-8 text-base')}>{quantity}</span>
      <Button type="button" variant="ghost" size="quantity" disabled={disabled || quantity >= max} onClick={increase} aria-label={increaseLabel}><Plus aria-hidden="true" /></Button>
    </div>
  );
};
export default QuantityStepper;

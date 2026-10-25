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
}
const QuantityStepper: React.FC<QuantityStepperProps> = ({ quantity, onQuantityChange, min = 1, max = 99, size = 'md', disabled = false, label = 'Quantity', decreaseLabel = 'Decrease quantity', increaseLabel = 'Increase quantity' }) => (
  <div role="group" aria-label={label} className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card">
    <Button type="button" variant="ghost" size="quantity" disabled={disabled || quantity <= min} onClick={() => { if (quantity > min) onQuantityChange(quantity - 1); }} aria-label={decreaseLabel}><Minus aria-hidden="true" /></Button>
    <span aria-live="polite" aria-atomic="true" className={cn('text-center font-medium tabular-nums', size === 'sm' ? 'w-7 text-sm' : size === 'lg' ? 'w-10 text-lg' : 'w-8 text-base')}>{quantity}</span>
    <Button type="button" variant="ghost" size="quantity" disabled={disabled || quantity >= max} onClick={() => { if (quantity < max) onQuantityChange(quantity + 1); }} aria-label={increaseLabel}><Plus aria-hidden="true" /></Button>
  </div>
);
export default QuantityStepper;

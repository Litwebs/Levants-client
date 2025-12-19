import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface QuantityStepperProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

const QuantityStepper: React.FC<QuantityStepperProps> = ({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
  size = 'md',
}) => {
  const decrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const increase = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const sizeClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
  };

  const buttonClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const iconClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textClasses = {
    sm: 'w-8 text-sm',
    md: 'w-10 text-base',
    lg: 'w-12 text-lg',
  };

  return (
    <div
      className={`inline-flex items-center ${sizeClasses[size]} bg-card border border-border rounded-xl`}
    >
      <button
        onClick={decrease}
        disabled={quantity <= min}
        className={`${buttonClasses[size]} rounded-l-xl hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
        aria-label="Decrease quantity"
      >
        <Minus className={iconClasses[size]} />
      </button>
      <span className={`${textClasses[size]} text-center font-medium`}>
        {quantity}
      </span>
      <button
        onClick={increase}
        disabled={quantity >= max}
        className={`${buttonClasses[size]} rounded-r-xl hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
        aria-label="Increase quantity"
      >
        <Plus className={iconClasses[size]} />
      </button>
    </div>
  );
};

export default QuantityStepper;

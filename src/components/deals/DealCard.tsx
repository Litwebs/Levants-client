import { useId } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import type { Deal } from '@/api/deals';
import { useCart } from '@/context/CartContext';
import { BasketButton, SavingsTag } from '@/components/products/CatalogCardControls';
import { toast } from 'sonner';
import { dealPresentation } from './dealPresentation';
import { cn } from '@/lib/utils';
import DealImage from './DealImage';
interface DealCardProps {
  deal: Deal;
  variant?: 'card' | 'featured';
  /** Retained for caller compatibility; package contents belong on the detail page. */
  showContents?: boolean;
  imageAspectClassName?: string;
  compactAction?: boolean;
  layout?: 'stacked' | 'horizontal';
}
export default function DealCard({ deal, variant = 'card', imageAspectClassName, compactAction = false, layout = 'stacked' }: DealCardProps) {
  const titleId = useId();
  const { addDeal, deals, openCart } = useCart();
  const value = dealPresentation(deal);
  const quantity = deals.find(entry => entry.deal.id === deal.id)?.quantity ?? 0;
  const soldOut = !Number.isFinite(deal.maxPackages) || deal.maxPackages <= 0 || Boolean(deal.endsAt && new Date(deal.endsAt).getTime() <= Date.now());
  const atLimit = quantity >= Math.min(99, deal.maxPackages);
  const endDate = deal.endsAt ? new Date(deal.endsAt) : null;
  const add = () => {
    if (soldOut || !value.validPrice) return;
    if (atLimit) { openCart(); return; }
    addDeal(deal, 1);
    toast.success(deal.name + ' added to your basket', { description: value.saving ? `Package deal · save ${value.saving}` : 'Package deal' });
  };
  return <article aria-labelledby={titleId} className={cn('deal-card flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-foreground shadow-soft', variant === 'card' && 'mx-auto w-full max-w-sm sm:mx-0', layout === 'horizontal' && 'md:flex-row')}>
    <div className={cn('relative shrink-0 overflow-hidden bg-secondary/60', imageAspectClassName ?? 'aspect-[4/3]', layout === 'horizontal' && 'md:aspect-auto md:min-h-72 md:w-1/2')}>
      <Link to={'/deals/' + deal.slug} tabIndex={-1} aria-hidden="true" className="absolute inset-0 block"><DealImage src={deal.imageUrl} className="h-full w-full object-contain p-4 sm:p-5" /></Link>
      {value.saving && !soldOut && <SavingsTag className="absolute left-3 top-3">Save {value.percent !== null ? `${value.percent}%` : value.saving}</SavingsTag>}
      {soldOut && <span className="absolute left-3 top-3 rounded-lg bg-card px-3 py-1.5 text-xs font-semibold">Currently unavailable</span>}
    </div>
    <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">{deal.isFeatured ? 'Featured package' : 'Package deal'}</p>
      <h3 id={titleId} className={cn('font-heading font-semibold leading-tight', variant === 'featured' ? 'text-xl sm:text-2xl' : 'text-lg')}><Link to={'/deals/' + deal.slug} title={deal.name} className="line-clamp-2 min-h-12 break-words rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{deal.name}</Link></h3>
      <p className="mt-2 line-clamp-2 min-h-10 break-words text-sm leading-5 text-muted-foreground">{deal.description}</p>
      <div className="mt-auto pt-4">
        <div className="flex flex-wrap items-baseline gap-2"><span className="text-2xl font-semibold tracking-tight text-primary">{value.price}</span>{value.original && <span className="text-sm text-muted-foreground"><span className="sr-only">Original value </span><del>{value.original}</del></span>}</div>
        <div className="mb-3 mt-1 flex min-h-5 flex-wrap justify-between gap-2 text-xs">{value.saving && <span className="font-semibold text-primary">Save {value.saving}</span>}{endDate && Number.isFinite(endDate.getTime()) && <span className="text-muted-foreground">Ends {endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}</div>
        <BasketButton compact={compactAction} disabled={soldOut || !value.validPrice} onClick={add} className="w-full" icon={quantity > 0 ? <Check aria-hidden="true" /> : undefined}>{soldOut ? 'Currently unavailable' : !value.validPrice ? 'Price unavailable' : atLimit ? 'View basket' : quantity > 0 ? 'Add another package' : 'Add package to basket'}</BasketButton>
        <p aria-live="polite" className="mt-2 min-h-4 text-center text-xs text-muted-foreground">{quantity > 0 ? `${quantity} in your basket${atLimit ? ' · maximum available' : ''}` : 'View package for full contents'}</p>
      </div>
    </div>
  </article>;
}

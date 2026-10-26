import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getDeal, type Deal } from '@/api/deals';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import DealImage from '@/components/deals/DealImage';
import DealContents from '@/components/deals/DealContents';
import { dealPresentation } from '@/components/deals/dealPresentation';
import { BasketButton } from '@/components/products/CatalogCardControls';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
export default function DealDetailPage() {
  const { slug = '' } = useParams();
  const { addDeal, deals, openCart } = useCart();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const load = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true);setError('');
    try {
      const next = await getDeal(slug);
      if (request !== sequence.current) return;
      setDeal(next);if (!next) setError('Deal not found.');
    } catch {
      if (request === sequence.current) { setDeal(null);setError('We couldn’t load this deal. Please try again.'); }
    } finally { if (request === sequence.current) setLoading(false); }
  }, [slug]);
  useEffect(() => { void load();return () => { sequence.current++; }; }, [load]);
  if (loading) return <div role="status" aria-label="Loading deal" className="container-custom flex min-h-[50vh] items-center justify-center"><Loader2 aria-hidden="true" className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none" /></div>;
  if (!deal || error) return <div className="container-custom py-16 text-center"><p role="alert" className="mb-4 text-destructive">{error || 'Deal not found.'}</p><Button type="button" variant="outline" size="touch" onClick={() => void load()}>Retry</Button><Button asChild variant="ghost" size="touch" className="ml-3"><Link to="/deals">Back to deals</Link></Button></div>;
  const value = dealPresentation(deal);
  const purchased = deals.find(entry => entry.deal.id === deal.id)?.quantity ?? 0;
  const soldOut = !Number.isFinite(deal.maxPackages) || deal.maxPackages <= 0 || Boolean(deal.endsAt && new Date(deal.endsAt).getTime() <= Date.now());
  const remaining = Math.max(0, Math.min(99, deal.maxPackages) - purchased);
  const add = () => {
    if (soldOut || !value.validPrice) return;
    if (!remaining) { openCart();return; }
    addDeal(deal, 1);toast.success(deal.name + ' added to your basket', { description: value.saving ? `Package deal · save ${value.saving}` : 'Package deal' });
  };
  const ends = deal.endsAt ? new Date(deal.endsAt) : null;
  return <div className="min-h-screen bg-background"><div className="container-custom py-8 lg:py-12">
    <Button asChild variant="ghost" size="touch" className="mb-6 -ml-3"><Link to="/deals"><ArrowLeft aria-hidden="true" />Back to deals</Link></Button>
    <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-secondary/50"><DealImage src={deal.imageUrl} alt={deal.name} className="h-full w-full object-contain p-6 sm:p-8" /></div>
      <div className="min-w-0"><div className="mb-4 flex flex-wrap gap-2"><Badge variant="secondary">Package deal</Badge>{deal.isFeatured && <Badge variant="outline">Featured</Badge>}{soldOut && <Badge variant="outline">Unavailable</Badge>}</div>
        <h1 className="break-words font-heading text-3xl font-semibold leading-tight sm:text-4xl">{deal.name}</h1>
        {deal.description && <p className="mt-4 break-words leading-relaxed text-muted-foreground">{deal.description}</p>}
        <div className="my-6 rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-baseline gap-3"><span className="text-3xl font-semibold text-primary">{value.price}</span>{value.original && <span className="text-muted-foreground"><span className="sr-only">Original value </span><del>{value.original}</del></span>}</div>{value.saving && <p className="mt-2 font-medium text-primary">You save {value.saving}{value.percent !== null ? ` (${value.percent}%)` : ''}</p>}{ends && Number.isFinite(ends.getTime()) && <p className="mt-2 text-sm text-muted-foreground">Offer ends {ends.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</p>}</div>
        <BasketButton onClick={add} disabled={soldOut || !value.validPrice} className="w-full sm:w-auto">{soldOut ? 'Currently unavailable' : !value.validPrice ? 'Price unavailable' : !remaining ? 'View basket' : 'Add package to basket'}</BasketButton>
        {!soldOut && <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">{purchased > 0 ? `${purchased} in your basket · ` : ''}{remaining} package{remaining === 1 ? '' : 's'} available to add.</p>}
      </div>
    </div>
    <DealContents items={deal.items} />
  </div></div>;
}

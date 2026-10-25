import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { CategoryFilterOptions, CatalogSortSelect } from '@/components/products/CatalogFilters';
import QuantityStepper from '@/components/ui/QuantityStepper';
import DealContents from '@/components/deals/DealContents';
import DealCard from '@/components/deals/DealCard';
import DealDetailPage from '@/pages/DealDetailPage';
import type { Deal } from '@/api/deals';
const { details, getDeal, cart } = vi.hoisted(() => ({details:vi.fn(),getDeal:vi.fn(),cart:{deals:[] as Array<{deal:Deal;quantity:number}>,addDeal:vi.fn(),openCart:vi.fn()}}));
vi.mock('@/api/catalogProducts',()=>({getProductPresentation:details}));
vi.mock('@/api/deals',()=>({getDeal}));
vi.mock('@/context/CartContext',()=>({useCart:()=>cart}));
vi.mock('sonner',()=>({toast:{success:vi.fn()}}));
const offer:Deal={id:'package',slug:'package',name:'Milk package',description:'A package of milk.',imageUrl:'https://example.com/package.png',packagePrice:8,originalValue:10,savings:2,savingsPercent:20,currency:'GBP',isFeatured:true,maxPackages:3,items:[{variantId:'milk-v',quantity:2,variant:{id:'milk-v',name:'1 litre',sku:'milk',price:5,stockQuantity:6,availableStock:6},product:{id:'milk-p',name:'Whole milk',category:'Dairy'}}]};
beforeEach(()=>{vi.clearAllMocks();cart.deals=[];details.mockResolvedValue(null);getDeal.mockResolvedValue(offer);});
afterEach(cleanup);
function Filters(){const [selected,setSelected]=useState<string[]>([]),[sort,setSort]=useState('featured');return <><CategoryFilterOptions categories={[{slug:'milk',name:'Milk'},{slug:'bread',name:'Bread'}]} selected={selected} onToggle={slug=>setSelected(values=>values.includes(slug)?values.filter(v=>v!==slug):[...values,slug])}/><CatalogSortSelect value={sort} onChange={setSort}/><output>{selected.join(',')}:{sort}</output></>;}
test('canonical categories and sorting keep selected values and native select semantics',()=>{
 render(<Filters/>);const milk=screen.getByRole('checkbox',{name:'Milk'});fireEvent.click(milk);expect(milk.getAttribute('aria-checked')).toBe('true');fireEvent.change(screen.getByRole('combobox',{name:'Sort by'}),{target:{value:'price-high'}});expect(screen.getByText('milk:price-high')).toBeTruthy();fireEvent.click(milk);expect(milk.getAttribute('aria-checked')).toBe('false');
});
test('stepper respects min/max, supports removal at zero and never submits a surrounding form',()=>{
 const update=vi.fn(),submit=vi.fn((e:React.FormEvent)=>e.preventDefault());const view=render(<form onSubmit={submit}><QuantityStepper quantity={1} onQuantityChange={update} min={0} max={1}/></form>);
 expect((screen.getByRole('button',{name:'Increase quantity'}) as HTMLButtonElement).disabled).toBe(true);fireEvent.click(screen.getByRole('button',{name:'Decrease quantity'}));expect(update).toHaveBeenCalledWith(0);expect(submit).not.toHaveBeenCalled();
 view.rerender(<QuantityStepper quantity={0} onQuantityChange={update} min={0} max={1}/>);expect((screen.getByRole('button',{name:'Decrease quantity'}) as HTMLButtonElement).disabled).toBe(true);
});
test.each(['card','featured'] as const)('%s listing keeps individual items off the card',variant=>{
 render(<MemoryRouter><DealCard deal={offer} variant={variant}/></MemoryRouter>);expect(screen.queryByText('Whole milk')).toBeNull();expect(screen.queryByRole('list')).toBeNull();expect(details).not.toHaveBeenCalled();expect(screen.getByRole('heading',{name:'Milk package'})).toBeTruthy();
});
test('detail contents uses real public variant description and image without changing the purchased quantities',async()=>{
 details.mockResolvedValue({id:'milk-p',description:'Product description',variants:[{id:'milk-v',description:'Fresh whole milk, one litre.',thumbnailImage:{url:'https://example.com/variant.jpg'}}]});
 const snapshot=JSON.stringify(offer.items);render(<DealContents items={offer.items}/>);await screen.findByText('Fresh whole milk, one litre.');expect(screen.getByText('Qty 2')).toBeTruthy();expect(screen.getByRole('img').getAttribute('src')).toBe('https://example.com/variant.jpg');expect(JSON.stringify(offer.items)).toBe(snapshot);expect(details).toHaveBeenCalledTimes(1);
});
test('missing product metadata uses honest text and image fallback',async()=>{
 details.mockRejectedValue(new Error('offline'));render(<DealContents items={offer.items}/>);await waitFor(()=>expect(details).toHaveBeenCalled());expect(screen.getByText('Product details are not provided for this item.')).toBeTruthy();expect(screen.getByRole('img',{name:'Whole milk — 1 litre'})).toBeTruthy();
});
test('late metadata for the previous contents cannot replace the current product facts',async()=>{
 let finish:(value:unknown)=>void=()=>{};details.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve})).mockResolvedValue({id:'bread',description:'Bread facts'});
 const view=render(<DealContents items={offer.items}/>);const bread=[{...offer.items[0],variantId:'bread-v',product:{id:'bread',name:'Bread',category:'Bakery'}}];view.rerender(<DealContents items={bread}/>);await screen.findByText('Bread facts');await act(async()=>finish({id:'milk-p',description:'Stale milk facts'}));expect(screen.queryByText('Stale milk facts')).toBeNull();expect(screen.getByText('Bread facts')).toBeTruthy();
});
test('detail adds one package and leaves quantity editing to the basket',async()=>{
 render(<MemoryRouter initialEntries={['/deals/package']}><Routes><Route path='/deals/:slug' element={<DealDetailPage/>}/></Routes></MemoryRouter>);await screen.findByRole('heading',{name:'Milk package'});expect(screen.queryByRole('group',{name:'Package quantity'})).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Add package to basket'}));expect(cart.addDeal).toHaveBeenCalledWith(offer,1);
});

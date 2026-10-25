import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import HomePage from '@/pages/HomePage';
import FeaturedDeals from '@/components/deals/FeaturedDeals';
import Header from '@/components/layout/Header';
import PromotionSummary from '@/components/cart/PromotionSummary';
import { freeDeliveryTerms } from '@/lib/promotionCopy';
const { list, get, fetchProducts, cart }=vi.hoisted(()=>({list:vi.fn(),get:vi.fn(),fetchProducts:vi.fn(),cart:{promotion:null as any,pricingLoading:false,pricingError:'',checkoutDeals:[],refreshPricing:vi.fn(),itemCount:0,openCart:vi.fn(),addItem:vi.fn()}}));
vi.mock('@/api/deals',()=>({listDeals:list}));
vi.mock('@/api/client',async original=>({...await original<typeof import('@/api/client')>(),default:{get,post:vi.fn()},resolveImageUrl:()=>null}));
vi.mock('@/context/CartContext',()=>({useCart:()=>cart}));
vi.mock('@/context/Products/ProductsContext',()=>({useProducts:()=>({products:[],meta:null,fetchProducts})}));
vi.mock('@/components/deals/DealsCarousel',()=>({default:()=> <div>Available offer</div>}));
const deal={id:'one',name:'Milk bundle',isFeatured:true,maxPackages:2,items:[]};
const mount=(child:React.ReactNode)=>render(<MemoryRouter>{child}</MemoryRouter>);
beforeEach(()=>{vi.clearAllMocks();localStorage.clear();get.mockResolvedValue({success:true,data:{items:[]}});list.mockResolvedValue({deals:[]});cart.promotion=null;cart.pricingLoading=false;cart.pricingError='';vi.stubGlobal('Image',class{complete=true;src='';onload=null;onerror=null;});});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
test.each([['empty',[]],['unfeatured',[{...deal,isFeatured:false}]],['out of stock',[{...deal,maxPackages:0}]],['expired',[{...deal,endsAt:'2020-01-01'}]],['future',[{...deal,startsAt:'2099-01-01'}]],['error',null]])('hero collapses for %s without hiding primary content',async(_name,deals)=>{
 if(deals===null)list.mockRejectedValue(new Error('offline'));else list.mockResolvedValue({deals});
 mount(<HomePage/>);
 await waitFor(()=>expect(screen.getByTestId('home-hero-layout').className).not.toContain('lg:grid-cols-'));
 expect(screen.queryByRole('heading',{name:'Featured Deals'})).toBeNull();
 expect(screen.getByTestId('home-hero-layout').querySelector('section')).toBeNull();
 expect(screen.getAllByRole('link').some(a=>a.getAttribute('href')==='/shop')).toBe(true);
});
test('available offers use two columns, then collapse on revalidation',async()=>{
 list.mockResolvedValue({deals:[deal]});mount(<HomePage/>);await screen.findByText('Available offer');
 expect(screen.getByTestId('home-hero-layout').className).toContain('lg:grid-cols-');
 list.mockResolvedValue({deals:[]});fireEvent(window,new Event('focus'));
 await waitFor(()=>expect(screen.queryByText('Available offer')).toBeNull());
 expect(screen.getByTestId('home-hero-layout').className).not.toContain('lg:grid-cols-');
});
test('callback replacement does not reload and latest callback receives availability',async()=>{
 let finish:(value:any)=>void=()=>{};list.mockImplementation(()=>new Promise(resolve=>{finish=resolve}));
 const first=vi.fn(),latest=vi.fn();const view=mount(<FeaturedDeals onImage onAvailabilityChange={first}/>);
 view.rerender(<MemoryRouter><FeaturedDeals onImage onAvailabilityChange={latest}/></MemoryRouter>);
 await act(async()=>finish({deals:[]}));await waitFor(()=>expect(latest).toHaveBeenCalledWith(false));
 expect(first).not.toHaveBeenCalled();expect(list).toHaveBeenCalledTimes(1);expect(view.container.innerHTML).toBe('');
});
test.each([[10,'£10'],[15,'£15'],[10.01,'£10.01']])('banner reports configured %s minimum and clears failed refresh',async(minimum,amount)=>{
 get.mockResolvedValue({success:true,data:{items:[{code:'FREE',kind:'free_delivery',minimumBasketValue:minimum}]}});
 mount(<Header/>);await screen.findByText(`Free delivery when you spend ${amount} or more on products`);
 expect(screen.queryByText(/delivery.*off$/i)).toBeNull();
 get.mockRejectedValue(new Error('offline'));fireEvent(window,new Event('focus'));
 await waitFor(()=>expect(screen.queryByText(/Free delivery when/)).toBeNull());
});
test('no-minimum and absent metadata are distinguished',()=>{
 expect(freeDeliveryTerms(0)).toBe('Free delivery');
 expect(freeDeliveryTerms(undefined)).toContain('check your basket');
});
test('summary states the threshold and only claims zero fee from the server',()=>{
 cart.promotion={campaign:{kind:'free_delivery',name:'Milk offer',minimumBasketValue:15},deliveryFee:0,discountAmount:0};
 const view=mount(<PromotionSummary/>);expect(screen.getByRole('status').textContent).toContain('£15 or more');expect(screen.getByText(/Free delivery applied/)).toBeTruthy();
 cart.promotion={...cart.promotion,deliveryFee:1};view.rerender(<MemoryRouter><PromotionSummary/></MemoryRouter>);
 expect(screen.queryByText(/Free delivery applied/)).toBeNull();
});

import { test, expect, type Page } from '@playwright/test';
import type { Deal } from '../../src/api/deals';
const deal:Deal={id:'milk',slug:'milk',name:'Featured milk pair',description:'Fresh milk',imageUrl:'/broken-fixture.jpg',packagePrice:8,originalValue:10,savings:2,savingsPercent:20,currency:'GBP',isFeatured:true,maxPackages:5,items:[{variantId:'milk-1',quantity:2,variant:{id:'milk-1',name:'1L',sku:'milk',price:5,stockQuantity:10,availableStock:10},product:{id:'milk',name:'Whole milk',category:'Dairy'}}]};
type State={offers:Deal[];minimum:number;price:number;offline?:boolean;paused?:boolean;dealError?:boolean};
async function setup(page:Page,state:State){
 await page.addInitScript(price=>{localStorage.setItem('portal-authenticated','true');localStorage.setItem('levants-dairy-cart',JSON.stringify({items:[{quantity:1,product:{id:'milk',name:'Whole milk',price,images:[],category:'Milk',stockStatus:'in-stock'},variant:{id:'milk-1',name:'1L',price,stockQuantity:30}}],deals:[]}));},state.price);
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(!path.startsWith('/api/'))return route.continue();
  if(path==='/api/deals')return route.fulfill({status:state.dealError?503:200,json:{success:!state.dealError,data:{deals:state.offers},meta:{total:state.offers.length,page:1,totalPages:1}}});
  if(path==='/api/discounts/active')return route.fulfill({json:{success:true,data:{items:state.paused||state.offline?[]:[{code:'FREE',kind:'free_delivery',minimumBasketValue:state.minimum,variants:[]}]}}});
  if(path==='/api/discounts/quote'){
   if(state.offline)return route.fulfill({status:503,json:{success:false,message:'Promotions temporarily unavailable'}});
   const body=route.request().postDataJSON();const subtotal=body.items.reduce((s:number,i:{quantity:number})=>s+i.quantity*state.price,0);
   const eligible=!state.paused&&subtotal>=state.minimum;
   return route.fulfill({json:{success:true,data:{subtotal,discountAmount:0,deliveryFee:eligible?0:1,total:subtotal+(eligible?0:1),items:[{variantId:'milk-1',price:state.price}],campaign:eligible?{id:'free',name:'Delivery offer',kind:'free_delivery',applicationMode:'automatic',code:null,endsAt:null,minimumBasketValue:state.minimum}:null}}});
  }
  if(path==='/api/products')return route.fulfill({json:{success:true,data:{items:[]},meta:{total:0,page:1,totalPages:1,categories:[]}}});
  if(path==='/api/portal/auth/me')return route.fulfill({json:{success:true,data:{customer:{_id:'customer',firstName:'Test',lastName:'Customer',email:'test@example.com',creditBalance:0,addresses:[{line1:'1 Test Street',city:'Bradford',postcode:'BD1 1AA',country:'GB',isDefault:true}]}}}});
  if(path.includes('/auth/'))return route.fulfill({status:401,json:{success:false}});
  if(path==='/api/delivery/check')return route.fulfill({json:{success:true,data:{deliverable:true,message:'We deliver to your area.'}}});
  return route.fulfill({json:{success:true,data:{}}});
 });
 await page.route('**/broken-fixture.jpg',route=>route.abort());
}
for(const width of [320,375,390,768,1024,1440])test(`empty homepage has no reserved featured column at ${width}px`,async({page},info)=>{
 await page.setViewportSize({width,height:1000});await setup(page,{offers:[],minimum:10,price:9.99});await page.goto('/');
 const hero=page.getByTestId('home-hero-layout');await expect(hero).not.toHaveClass(/lg:grid-cols-/);
 await expect(page.getByRole('heading',{name:'Featured Deals',exact:true})).toHaveCount(0);
 expect(await hero.evaluate(el=>el.children.length)).toBe(1);
 await expect(hero.getByRole('link',{name:'Shop fresh'})).toBeVisible();await expect(hero.getByRole('link',{name:'Weekly subscription'})).toBeVisible();
 await page.getByLabel('Fresh delivery starts with your postcode').fill('BD1 1AA');await hero.getByRole('button',{name:/check/i}).click();await expect(hero.getByText('We deliver to your area.')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await hero.screenshot({path:info.outputPath(`empty-hero-${width}.png`)});
});
for(const width of [390,1440]){
 test(`featured offer with failed image survives, then collapses after refresh ${width}`,async({page})=>{
  const state={offers:[deal],minimum:10,price:10};await page.setViewportSize({width,height:1000});await setup(page,state);await page.goto('/');
  await expect(page.getByRole('heading',{name:'Featured Deals',exact:true})).toBeVisible();await expect(page.getByText(deal.name,{exact:true}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:'Next deals'})).toHaveCount(0);
  state.offers=[{...deal,isFeatured:false}];await page.evaluate(()=>dispatchEvent(new Event('focus')));
  await expect(page.getByTestId('home-hero-layout')).not.toHaveClass(/lg:grid-cols-/);await expect(page.getByRole('heading',{name:'Featured Deals',exact:true})).toHaveCount(0);
 });
 test(`configured spend wording stays consistent in cart and checkout ${width}`,async({page})=>{
  const state:State={offers:[],minimum:10,price:10};await page.setViewportSize({width,height:1000});await setup(page,state);await page.goto('/shop');await page.getByRole('button',{name:'Cart',exact:true}).click();
  await expect(page.getByText('Free delivery when you spend £10 or more on products',{exact:true})).toBeVisible();await expect(page.getByTestId('promotion-summary')).toContainText('£0.00 delivery');
  await expect(page.getByText(/Add £.*more for free delivery/)).toHaveCount(0);
  await page.getByRole('link',{name:'Checkout Securely'}).click();await expect(page.getByTestId('promotion-summary')).toContainText('£10 or more');
  state.minimum=15;await page.goto('/shop');await page.getByRole('button',{name:'Cart',exact:true}).click();
  await expect(page.getByText('Free delivery when you spend £15 or more on products',{exact:true})).toBeVisible();await expect(page.getByTestId('promotion-summary')).toHaveCount(0);
  state.minimum=0;await page.evaluate(()=>dispatchEvent(new Event('focus')));await expect(page.getByTestId('promotion-summary')).toContainText('£0.00 delivery');await expect(page.getByText('Free delivery',{exact:true})).toBeVisible();
  state.offline=true;await page.evaluate(()=>dispatchEvent(new Event('focus')));await expect(page.getByTestId('promotion-summary')).toHaveCount(0);await expect(page.getByRole('alert')).toContainText('temporarily unavailable');
 });
}
test('network failure collapses the featured slot',async({page})=>{await setup(page,{offers:[],minimum:10,price:9.99,dealError:true});await page.goto('/');await expect(page.getByTestId('home-hero-layout')).not.toHaveClass(/lg:grid-cols-/);});

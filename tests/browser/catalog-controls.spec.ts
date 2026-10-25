import { test, expect, type Page } from '@playwright/test';
const origin='http://127.0.0.1:4183';
const image=new URL('/src/assets/product-milk.jpg',origin).href;
const products=[{id:'milk',name:'Whole milk',category:'Dairy',description:'Fresh whole milk from the farm.',thumbnailImage:{url:image},galleryImages:[],pricing:{min:5,max:5,currency:'GBP'},variants:[{id:'milk-v',name:'1 litre',description:'A one-litre bottle of whole milk.',price:5,currency:'GBP',stockQuantity:6,lowStock:false,thumbnailImage:{url:image}}]},{id:'bread',name:'Farm bread',category:'Bakery',description:'A freshly baked loaf.',thumbnailImage:{url:image},galleryImages:[],pricing:{min:4,max:4,currency:'GBP'},variants:[{id:'bread-v',name:'One loaf',description:'A full loaf.',price:4,currency:'GBP',stockQuantity:8,lowStock:false}]}];
const offer={id:'breakfast',slug:'breakfast',name:'A farm breakfast package with a deliberately long title',description:'Milk and bread at a package price.',imageUrl:image,packagePrice:7,originalValue:9,savings:2,savingsPercent:22,currency:'GBP',isFeatured:true,maxPackages:3,items:products.map(p=>({variantId:p.variants[0].id,quantity:1,variant:{id:p.variants[0].id,name:p.variants[0].name,sku:p.id,price:p.variants[0].price,stockQuantity:p.variants[0].stockQuantity,availableStock:p.variants[0].stockQuantity,thumbnailImage:p.thumbnailImage},product:{id:p.id,name:p.name,category:p.category,thumbnailImage:p.thumbnailImage}}))};
async function setup(page:Page,{missingImage=false,productError=false}={}){
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;
  if(!path.startsWith('/api/'))return route.continue();
  if(path==='/api/deals')return route.fulfill({json:{success:true,data:{deals:[{...offer,imageUrl:missingImage?undefined:offer.imageUrl}]},meta:{total:1,page:1,totalPages:1}}});
  if(path.startsWith('/api/deals/'))return route.fulfill({json:{success:true,data:{deal:{...offer,imageUrl:missingImage?undefined:offer.imageUrl}}}});
  if(path==='/api/products'){
   const cats=(url.searchParams.get('category')||'').split(',').filter(Boolean);let selected=products.filter(p=>!cats.length||cats.some(c=>c.toLowerCase()===p.category.toLowerCase()));
   if(url.searchParams.get('sort')==='price_asc')selected=[...selected].sort((a,b)=>a.pricing.min-b.pricing.min);
   return route.fulfill({json:{success:true,data:{items:selected},meta:{page:1,total:selected.length,totalPages:1,categories:products.map(p=>({title:p.category,subtitle:'',image:null}))}}});
  }
  if(path.startsWith('/api/products/')){const product=products.find(p=>path.endsWith('/'+p.id));return route.fulfill({status:productError?503:200,json:{success:!productError,data:product||{}}});}
  if(path==='/api/discounts/quote'){
   const body=req.postDataJSON();const subtotal=body.items.reduce((sum:number,item:{variantId:string;quantity:number})=>sum+item.quantity*(products.find(p=>p.variants[0].id===item.variantId)?.pricing.min||0),0);
   return route.fulfill({json:{success:true,data:{subtotal,discountAmount:0,deliveryFee:1,total:subtotal+1,campaign:null}}});
  }
  if(path.includes('/auth/'))return route.fulfill({status:401,json:{success:false}});
  return route.fulfill({json:{success:true,data:{}}});
 });
}
for(const width of [320,375,768,1024,1440])test(`shared catalog and illustrated detail at ${width}px`,async({page},info)=>{
 await page.setViewportSize({width,height:1000});await setup(page);await page.goto('/deals');
 const catalog=page.locator('#all-deals'),card=catalog.locator('.card-product').first();await expect(card.getByRole('heading',{name:offer.name})).toBeVisible();
 await expect(card.getByRole('listitem')).toHaveCount(0);await expect(card.getByText('Whole milk',{exact:true})).toHaveCount(0);
 expect(await card.locator('img').first().evaluate(el=>getComputedStyle(el).objectFit)).toBe('contain');
 await expect(page.getByRole('combobox',{name:'Sort by'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:info.outputPath(`deals-${width}.png`),fullPage:true});
 await card.getByRole('link').first().click();await expect(page.getByRole('heading',{level:1,name:offer.name})).toBeVisible();
 const contents=page.getByRole('region',{name:"What's included"});await expect(contents.getByRole('listitem')).toHaveCount(2);await expect(contents.getByText('A one-litre bottle of whole milk.')).toBeVisible();await expect(contents.getByRole('img').first()).toBeVisible();
 const quantity=page.getByRole('group',{name:'Package quantity'});await quantity.getByRole('button',{name:'Increase quantity'}).click();await quantity.getByRole('button',{name:'Increase quantity'}).click();await expect(quantity.getByRole('button',{name:'Increase quantity'})).toBeDisabled();
 await page.getByRole('button',{name:'Add package to basket',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('levants-dairy-cart')||'{}').deals?.[0]?.quantity)).toBe(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:info.outputPath(`detail-${width}.png`),fullPage:true});
});
for(const width of [375,1440])test(`shared category, URL, sorting and cart removal controls at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await setup(page);await page.goto('/shop');
 const filters=page.getByRole('button',{name:/^Filters/});
 if(width<1024)await filters.click();
 const scope=width<1024?page.getByRole('dialog'):page.locator('aside');await scope.getByRole('checkbox',{name:'Bakery',exact:true}).click();
 if(width<1024){await page.getByRole('button',{name:'Apply',exact:true}).click();await expect(filters).toBeFocused();}
 await expect(page).toHaveURL(/category=bakery/);await expect(page.getByRole('heading',{name:/Farm bread/}).first()).toBeVisible();
 await page.getByRole('combobox',{name:'Sort by'}).selectOption('price-low');await expect(page).toHaveURL(/sort=price-low/);
 if(width<1024){await filters.click();await page.keyboard.press('Escape');await expect(filters).toBeFocused();}
 const card=page.locator('.card-product').filter({has:page.getByRole('heading',{name:/Farm bread/})}).first();await card.getByRole('button',{name:'Add to basket',exact:true}).click();
 await page.getByRole('button',{name:'Cart',exact:true}).click();const row=page.getByRole('group',{name:'Quantity for Farm bread'});await row.getByRole('button',{name:'Decrease quantity'}).click();await expect(page.getByText('Your cart is empty',{exact:false})).toBeVisible();
});
test('missing imagery and failed metadata retain honest detail fallbacks',async({page})=>{
 await setup(page,{missingImage:true,productError:true});await page.goto('/deals/breakfast');await expect(page.getByRole('img',{name:offer.name,exact:true})).toBeVisible();await expect(page.getByText('Product details are not provided for this item.')).toHaveCount(2);await expect(page.getByRole('button',{name:'Add package to basket'})).toBeEnabled();
});

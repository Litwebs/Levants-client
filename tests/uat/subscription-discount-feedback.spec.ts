import {test,expect} from "@playwright/test";
test("existing subscriber can recover from a rejected code without starting a payment",async({page},info)=>{
 const writes:string[]=[];const previews:Array<Record<string,unknown>>=[];
 await page.addInitScript(()=>{
  localStorage.setItem("levants:portal-tour:v1:discount-ui:new-review","seen");
  sessionStorage.setItem("levants_subscription_draft",JSON.stringify({flowVersion:2,step:4,selectedVariantIds:["milk-v"],quantities:{"milk-v":1},dayQuantities:{Monday:{"milk-v":1}},frequency:"weekly",deliveryDays:["Monday"],selectedAddress:"address-1",deliveryInstructions:"Synthetic UI test only"}));
 });
 await page.route("**/api/**",async route=>{
  const r=route.request(),p=new URL(r.url()).pathname;
  const reply=(data:unknown)=>route.fulfill({json:{success:true,data,meta:{total:1,totalPages:1,page:1,pageSize:20}}});
  if(p==="/api/portal/auth/me")return reply({customer:{_id:"discount-ui",firstName:"UI",lastName:"Review",email:"ui@example.test",emailVerifiedAt:"2026-01-01",themePreference:"light"}});
  if(p==="/api/portal/subscriptions/preview"){
   const body=r.postDataJSON();previews.push(body);
   if(body.discountCode)return route.fulfill({json:{success:false,message:"Subscription codes are for first-time subscribers only, with one use per customer.",data:{quoteChanged:true}}});
   return reply({quote:{productsMinor:1200,deliveryMinor:100,discountMinor:0,firstChargeMinor:1300,renewalMinor:1300,percentOff:0,eligible:false,quoteToken:"ui-read-only",nextPaymentDate:"2026-11-02T12:00:00Z",firstDeliveryDate:"2026-11-02T00:00:00Z"}});
  }
  if(r.method()!=="GET"){writes.push(p);return route.fulfill({status:503,json:{success:false,message:"No writes allowed in UI fixture"}});}
  if(p==="/api/portal/addresses")return reply({addresses:[{_id:"address-1",line1:"1 Test Lane",city:"Bradford",postcode:"BD5 0AL",country:"United Kingdom",isDefault:true}]});
  if(p==="/api/portal/subscriptions/settings")return reply({settings:{deliveryDays:[1],cutoffDaysBefore:2,cutoffTime:"18:00"}});
  if(p==="/api/portal/subscriptions/prepared-draft")return reply({draft:null});
  if(p==="/api/portal/payments/payment-methods")return reply({paymentMethods:[{_id:"card-1",type:"card",lastFour:"4242",cardBrand:"visa",expiryMonth:12,expiryYear:2030,isDefault:true}]});
  if(p==="/api/products")return reply({items:[{id:"milk",name:"Whole milk",category:"Dairy",description:"UI test",galleryImages:[],thumbnailImage:null,isActive:true,variants:[{id:"milk-v",name:"1 litre",sku:"MILK",price:12,currency:"GBP",stockQuantity:100,availableStock:100,isSubscriptionEligible:true}],pricing:{min:12,max:12,currency:"GBP"}}]});
  return reply({});
 });
 await page.goto("/portal/subscriptions/new");
 await expect(page.getByText("Next payment: 2 November 2026.",{exact:true})).toBeVisible();
 await expect(page.getByText("£13.00 every week",{exact:true})).toBeVisible();
 const code=page.getByLabel("Subscription discount code",{exact:true});
 await code.fill("WELCOME");await page.getByRole("button",{name:"Apply",exact:true}).click();
 await expect(page.getByRole("alert").filter({hasText:"This code is for new subscribers"})).toBeVisible();
 await expect(code).toHaveAttribute("aria-invalid","true");
 await expect(page.getByText("Price not confirmed",{exact:true})).toBeVisible();
 await expect(page.getByRole("button",{name:"Retry pricing",exact:true})).toHaveCount(0);
 await expect(page.getByRole("button",{name:"Create Subscription",exact:true})).toBeDisabled();
 await page.getByRole("button",{name:"Continue without code",exact:true}).scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath("code-rejected.png"),fullPage:true});
 await page.getByRole("button",{name:"Continue without code",exact:true}).click();
 await expect(code).toHaveValue("");
 await expect(page.getByText("Next payment: 2 November 2026.",{exact:true})).toBeVisible();
 await expect(page.getByText("Price not confirmed",{exact:true})).toHaveCount(0);
 expect(previews.some(p=>p.discountCode==="WELCOME")).toBe(true);
 expect(previews.at(-1)?.discountCode).toBeUndefined();
 expect(writes).toEqual([]);
 await page.screenshot({path:info.outputPath("code-removed.png"),fullPage:true});
});

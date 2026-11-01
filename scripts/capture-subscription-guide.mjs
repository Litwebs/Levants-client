import fs from 'node:fs';
import ts from 'typescript';
import { chromium } from 'playwright';
let source=fs.readFileSync('tests/browser/portal-tours.spec.ts','utf8').split('const tour =')[0].replace(/^import .*\n/,'');
source=source.replaceAll('preferredDeliveryDay: 1','preferredDeliveryDay: 0').replaceAll('preferredDeliveryDays: [1]','preferredDeliveryDays: [0]').replaceAll('deliveryDays: [1, 4]','deliveryDays: [0, 3]');
source=source.replace('status: "scheduled", cutoffAt:', 'status: "generated", canChangeThisDelivery: true, recurringItems: [item], order: { _id: "order-1", orderId: "ORD-100", status: "paid", deliveryStatus: "ordered", total: 3, deliveryFee: 1 }, cutoffAt:');
const fixture=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source+'\nexport { api };',{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
for(let attempt=0;attempt<60;attempt++){try{await fetch('http://127.0.0.1:4183');break;}catch{await new Promise(r=>setTimeout(r,500));}}
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
await page.emulateMedia({reducedMotion:'reduce'});
const writes=await fixture.api(page);
await page.route('**/api/portal/subscriptions/*/deliveries/*/one-time-change', route=>route.fulfill({json:{success:true,data:{deliveryId:'delivery-1',scheduledDate:'2035-05-07T08:00:00.000Z',cutoffAt:'2035-05-05T18:00:00.000Z',expectedVersion:1,quoteToken:'a'.repeat(64),before:[{_id:'item-1',product:'milk',variant:'milk-v',name:'Whole milk',sku:'MILK',quantity:1,unitPrice:2}],after:[{_id:'item-1',product:'milk',variant:'milk-v',name:'Whole milk',sku:'MILK',quantity:1,unitPrice:2}],originalTotalMinor:300,revisedTotalMinor:300,creditedMinor:0,deliveryFeeMinor:100,hasChanges:false,cancelsDelivery:false}}}));
await page.addInitScript(()=>localStorage.setItem('portal-authenticated','true'));
fs.mkdirSync('public/guides/subscriptions',{recursive:true});
async function shot(name,selector='main') {
 const loc=page.locator(selector).first(); await loc.waitFor({state:'visible'});
 await page.evaluate(()=>document.fonts.ready); await loc.screenshot({style:'header, [data-tour="builder-progress"], button[aria-label="Back to top"] { visibility: hidden !important; }',path:`public/guides/subscriptions/${name}.png`,animations:'disabled'}); console.log('captured',name);
}
async function detail(){await page.goto('http://127.0.0.1:4183/portal/subscriptions/subscription-1');await page.locator('[data-tour-page="subscription-detail"][data-tour-ready="true"]').waitFor();}
await page.goto('http://127.0.0.1:4183/portal/subscriptions');
await page.locator('[data-tour="subscription-card"]').waitFor();
await shot('subscriptions','[data-tour-page="subscriptions"]');
for(let step=0;step<5;step++){
 await page.evaluate(step=>sessionStorage.setItem('levants_subscription_draft',JSON.stringify({flowVersion:2,step,selectedVariantIds:['milk-v'],quantities:{'milk-v':2},dayQuantities:{Sunday:{'milk-v':2}},frequency:'weekly',deliveryDays:['Sunday'],selectedAddress:'address-1',deliveryInstructions:'Leave by the door'})),step);
 await page.goto('http://127.0.0.1:4183/portal/subscriptions/new');
 const stages=['new-days','new-frequency','new-products','new-address','new-review'];
 const targets=['builder-days','builder-frequency','builder-selected-products','builder-address','builder-review'];
 await page.locator(`[data-tour-page="${stages[step]}"][data-tour-ready="true"]`).waitFor();
 await shot(stages[step],`[data-tour="${targets[step]}"]`);
}
await detail();await shot('products','[data-tour="subscription-products"]');
await page.getByRole('button',{name:/Increase Whole milk quantity/}).first().click();await shot('products-review','[data-tour="subscription-products"]');
await detail();

await shot('management','[data-tour="subscription-management"]');
await page.locator('[data-tour="subscription-pause"]').click();await shot('pause','[role="dialog"]');
await detail();await page.locator('[data-tour="subscription-cancel"]').click();await shot('cancel','[role="alertdialog"], [role="dialog"]');
await detail();await page.locator('[data-tour="delivery-expand"]').first().click();await shot('delivery','[data-tour="subscription-upcoming"]');
await page.getByRole('button',{name:'Change This Delivery Only',exact:true}).click();await page.locator('[data-tour-page="delivery-reduction"][data-tour-ready="true"]').waitFor();await shot('reduce','[role="dialog"]');
await page.route('**/api/portal/subscriptions/*/deliveries/*/one-time-change/preview',route=>route.fulfill({json:{success:true,data:{deliveryId:'delivery-1',scheduledDate:'2035-05-07T08:00:00.000Z',cutoffAt:'2035-05-05T18:00:00.000Z',expectedVersion:1,quoteToken:'b'.repeat(64),before:[{_id:'item-1',product:'milk',variant:'milk-v',name:'Whole milk',sku:'MILK',quantity:1,unitPrice:2}],after:[],originalTotalMinor:300,revisedTotalMinor:0,creditedMinor:300,deliveryFeeMinor:0,hasChanges:true,cancelsDelivery:true}}}));
await page.getByRole('button',{name:'Remove',exact:true}).click();await page.getByRole('button',{name:'Review change',exact:true}).click();await page.locator('[data-tour="reduction-review"]').waitFor();await shot('reduce-review','[role="dialog"]');
await page.goto('http://127.0.0.1:4183/portal/subscriptions/subscription-1/next-delivery/add-ons');await page.getByRole('button',{name:'Add once',exact:true}).first().click();await page.locator('[data-tour="add-on-selection"]').getByText('Whole milk',{exact:true}).waitFor();await shot('extras','[data-tour="add-on-selection"]');
if(writes.length) throw new Error('Unexpected writes: '+writes.join(', '));
await page.close();
page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
await page.emulateMedia({reducedMotion:'reduce'});
await fixture.api(page,{status:'paused'});
await detail();await shot('resume','[data-tour="subscription-management"]');
await browser.close();

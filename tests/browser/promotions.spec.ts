import { expect, test, type Page } from "@playwright/test";

type CampaignState = { active: boolean; kind: "free_delivery" | "percent" | "amount"; minimum: number; endsAt?: string; offline?: boolean; orders: Record<string, unknown>[] };
async function setup(page: Page, state: CampaignState) {
  await page.addInitScript(() => {
    localStorage.setItem("portal-authenticated", "true");
    localStorage.setItem("levants-dairy-cart", JSON.stringify({ items: [{quantity:1, product:{id:"milk",name:"Whole milk",price:10,images:[],category:"Milk",stockStatus:"in-stock"},variant:{id:"milk-1",name:"1L",price:10,stockQuantity:30}}], deals:[] }));
  });
  await page.route("**/api/**", async route => {
    const req = route.request(); const path = new URL(req.url()).pathname;
    if (!path.startsWith("/api/")) return route.continue();
    if (path === "/api/discounts/quote") {
      if (state.offline) return route.fulfill({status:503,json:{success:false,message:"Promotions temporarily unavailable"}});
      const body = req.postDataJSON(); const subtotal = body.items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity * 10, 0);
      const code = body.discountCode;
      if (code && code !== "SAVE2") return route.fulfill({status:400,json:{success:false,message:"Invalid discount code"}});
      const eligible = code || (state.active && subtotal >= state.minimum && (!state.endsAt || new Date(state.endsAt).getTime() > Date.now()));
      const kind = code ? "amount" : state.kind;
      const discountAmount = eligible ? kind === "amount" ? 2 : kind === "percent" ? subtotal / 10 : 0 : 0;
      const deliveryFee = eligible && kind === "free_delivery" ? 0 : 1;
      return route.fulfill({json:{success:true,data:{subtotal,discountAmount,deliveryFee,total:subtotal-discountAmount+deliveryFee,
        campaign:eligible ? {id:"campaign",name:code ? "Save two pounds" : "Weekend campaign",kind,applicationMode:code?"code":"automatic",code:code||null,endsAt:code?null:state.endsAt||null}:null}}});
    }
    if (path === "/api/deals") return route.fulfill({json:{success:true,data:{deals:[]},meta:{totalPages:1}}});
    if (path === "/api/portal/auth/me") return route.fulfill({json:{success:true,data:{customer:{_id:"customer",firstName:"Test",lastName:"Customer",email:"test@example.com",creditBalance:0,addresses:[{line1:"1 Test Street",city:"Bradford",postcode:"BD1 1AA",country:"GB",isDefault:true}]}}}});
    if (path === "/api/delivery/check") return route.fulfill({json:{success:true,data:{deliverable:true}}});
    if (path === "/api/portal/orders/checkout") { state.orders.push(req.postDataJSON()); return route.fulfill({json:{success:true,data:{orderId:"test",checkoutUrl:"/test-payment"}}}); }
    return route.fulfill({json:{success:true,data:{}}});
  });
}
const initial = (): CampaignState => ({active:true,kind:"free_delivery",minimum:10,orders:[]});
for (const width of [390, 1440]) {
  test(`automatic free delivery is consistent from cart to checkout at ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:900});const state=initial();await setup(page,state);await page.goto("/shop");await page.getByRole("button",{name:"Cart",exact:true}).click();
    await expect(page.getByTestId("promotion-summary")).toContainText("£0.00 delivery");
    await expect(page.getByText("£0.00 · FREE",{exact:true})).toBeVisible();
    await page.getByRole("link",{name:"Checkout Securely"}).click();
    const place=page.getByRole("button",{name:"Place Order - £10.00",exact:true});await expect(place).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await place.click();await expect(page).toHaveURL(/test-payment/);
    expect(state.orders).toHaveLength(1);expect(state.orders[0]).toMatchObject({expectedTotalMinor:1000,items:[{variantId:"milk-1",quantity:1}]});
  });
}
test("code replaces automatic campaign and removal restores free delivery",async({page})=>{
  const state=initial();await setup(page,state);await page.goto("/checkout");
  await expect(page.getByRole("button",{name:"Place Order - £10.00",exact:true})).toBeEnabled();
  await page.getByLabel("Discount Code",{exact:true}).fill("SAVE2");
  await expect(page.getByRole("button",{name:"Place Order - £9.00",exact:true})).toBeEnabled();
  await expect(page.getByTestId("promotion-summary")).toContainText("Save two pounds");
  await page.getByRole("button",{name:"Remove",exact:true}).click();
  await expect(page.getByRole("button",{name:"Place Order - £10.00",exact:true})).toBeEnabled();
});
test("paused campaign forces a new review before checkout",async({page})=>{
  const state=initial();await setup(page,state);await page.goto("/checkout");
  const place=page.getByRole("button",{name:"Place Order - £10.00",exact:true});await expect(place).toBeEnabled();state.active=false;
  await place.click();await expect(page.getByText("Your promotions have changed. Review the updated total, then place your order.")).toBeVisible();
  expect(state.orders).toHaveLength(0);
  await page.getByRole("button",{name:"Place Order - £11.00",exact:true}).click();await expect(page).toHaveURL(/test-payment/);
  expect(state.orders).toHaveLength(1);expect(state.orders[0].expectedTotalMinor).toBe(1100);
});
test("campaign expiry refreshes pricing without a reload",async({page})=>{
  const state={...initial(),endsAt:new Date(Date.now()+4500).toISOString()};await setup(page,state);await page.goto("/checkout");
  await expect(page.getByRole("button",{name:"Place Order - £10.00",exact:true})).toBeEnabled();
  await expect(page.getByRole("button",{name:"Place Order - £11.00",exact:true})).toBeEnabled({timeout:10000});
});
test("invalid codes and quote outages block checkout until corrected",async({page})=>{
  const state=initial();await setup(page,state);await page.goto("/checkout");
  await page.getByLabel("Discount Code",{exact:true}).fill("INVALID");
  await expect(page.getByRole("alert")).toContainText("Invalid discount code");
  await expect(page.getByRole("button",{name:/Place Order/})).toBeDisabled();
  await page.getByRole("button",{name:"Remove",exact:true}).click();
  await expect(page.getByRole("button",{name:"Place Order - £10.00",exact:true})).toBeEnabled();
  state.offline=true;await page.getByRole("button",{name:"Apply",exact:true}).click();
  await expect(page.getByRole("alert")).toContainText("temporarily unavailable");
  expect(state.orders).toHaveLength(0);state.offline=false;await page.getByRole("button",{name:"Retry",exact:true}).click();
  await expect(page.getByRole("button",{name:"Place Order - £10.00",exact:true})).toBeEnabled();
});

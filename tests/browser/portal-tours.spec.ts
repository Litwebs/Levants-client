import { expect, test, type Page } from "@playwright/test";

const address = { _id: "address-1", line1: "1 Dairy Lane", city: "Bradford", postcode: "BD5 0AL", country: "United Kingdom", isDefault: true };
const item = { _id: "item-1", product: "milk", variant: "milk-v", name: "Whole milk", sku: "MILK", quantity: 1, unitPrice: 2 };
const subscription = { _id: "subscription-1", subscriptionNumber: "SUB-100", status: "active", frequency: "weekly", preferredDeliveryDay: 1, preferredDeliveryDays: [1], upcomingDeliveryDate: "2035-05-07T08:00:00.000Z", nextDeliveryDate: "2035-05-07T08:00:00.000Z", deliveryAddress: address, items: [item], customerVersion: 1, createdAt: "2026-01-01T12:00:00.000Z", updatedAt: "2026-01-01T12:00:00.000Z" };
const delivery = { _id: "delivery-1", scheduledDate: "2035-05-07T08:00:00.000Z", status: "scheduled", cutoffAt: "2035-05-05T18:00:00.000Z", isPastCutoff: false, addOns: [] };
const order = { _id: "order-1", customer: "tour-customer", orderId: "ORD-100", status: "paid", stripePaymentIntentId: "pi_tour_fixture", amountPaid: 3, deliveryStatus: "ordered", total: 3, subtotal: 2, deliveryFee: 1, items: [{ name: "Whole milk", sku: "MILK", price: 2, quantity: 1, subtotal: 2 }], deliveryAddress: address, createdAt: "2026-01-01T12:00:00.000Z", updatedAt: "2026-01-01T12:00:00.000Z", paidAt: "2026-01-01T12:00:00.000Z" };
const product = { id: "milk", name: "Whole milk", category: "Dairy", description: "Fresh milk", galleryImages: [], thumbnailImage: null, isActive: true, variants: [{ id: "milk-v", name: "1 litre", sku: "MILK", price: 2, currency: "GBP", stockQuantity: 100, availableStock: 100, isSubscriptionEligible: true }], pricing: { min: 2, max: 2, currency: "GBP" } };
const meta = { page: 1, pageSize: 20, total: 1, totalPages: 1 };

async function api(page: Page, options: { status?: string; empty?: boolean; customerId?: string } = {}) {
  await page.addInitScript(() => localStorage.setItem("levants:portalToursEnabled", "true"));
  const writes: string[] = [];
  await page.route("**/api/**", async route => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (!pathname.startsWith("/api/")) return route.continue();
    const path = pathname.slice(4);
    const reply = (data: unknown) => route.fulfill({ json: { success: true, data, meta } });
    if (path === "/portal/auth/me") return reply({ customer: { _id: options.customerId || "tour-customer", firstName: "Tour", lastName: "Customer", email: "tour@example.com", emailVerifiedAt: "2026-01-01", themePreference: "light", creditBalance: 500 } });
    // The existing Payments page prepares Stripe on load. This is not a tour action.
    if (path.endsWith("/setup-intent")) return route.fulfill({ status: 503, json: { success: false, message: "Secure form unavailable in this fixture" } });
    // Pricing preview is a read-only POST; it does not create a subscription.
    if (request.method() === "POST" && path === "/portal/subscriptions/preview") {
      const body = request.postDataJSON();
      const lines = body.deliveryDayPlans?.flatMap((plan: { items: Array<{ quantity: number }> }) => plan.items) || body.items || [];
      const productsMinor = lines.reduce((sum: number, line: { quantity: number }) => sum + 200 * Number(line.quantity || 0), 0);
      const deliveryMinor = 100 * Math.max(1, body.frequency === "weekly" ? body.preferredDeliveryDays?.length || 1 : 1);
      return reply({ quote: { productsMinor, deliveryMinor, discountMinor: 0,
        firstChargeMinor: productsMinor + deliveryMinor, renewalMinor: productsMinor + deliveryMinor,
        percentOff: 0, eligible: false, quoteToken: "tour-read-only-preview",
        nextPaymentDate: "2035-05-14T08:00:00.000Z", firstDeliveryDate: delivery.scheduledDate } });
    }
    if (request.method() !== "GET") { writes.push(`${request.method()} ${path}`); return route.fulfill({ status: 400, json: { success: false, message: "Tours must not mutate account data" } }); }
    if (path === "/portal/addresses") return reply({ addresses: options.empty ? [] : [address] });
    if (path === "/portal/subscriptions/settings") return reply({ settings: { deliveryDays: [1, 4], cutoffDaysBefore: 2, cutoffTime: "18:00" } });
    if (path === "/portal/subscriptions/prepared-draft") return reply({ draft: null });
    if (path.endsWith("/deliveries")) return reply({ deliveries: [delivery], meta });
    if (path === "/portal/subscriptions/subscription-1") return reply({ subscription: { ...subscription, status: options.status || "active" }, cutoff: { isPastCutoff: false, cutoffAt: delivery.cutoffAt, cutoffDaysBefore: 2, cutoffTime: "18:00", deliveryDays: [1, 4] } });
    if (path === "/portal/subscriptions") return reply({ subscriptions: options.empty ? [] : [{ ...subscription, status: options.status || "active" }], meta });
    if (path === "/portal/orders") return reply({ orders: options.empty ? [] : [order], meta });
    if (path === "/portal/orders/order-1") return reply({ order });
    if (path === "/portal/payments/payment-methods") return reply({ paymentMethods: [{ _id: "card-1", type: "card", lastFour: "4242", cardBrand: "visa", expiryMonth: 12, expiryYear: 2035, isDefault: true }, { _id: "card-2", type: "card", lastFour: "4444", cardBrand: "visa", expiryMonth: 12, expiryYear: 2035, isDefault: false }] });
    if (path === "/portal/payments") return reply({ payments: [], meta });
    if (path === "/portal/credits") return reply({ balance: 500, transactions: [] });
    if (path === "/products") return reply({ items: [product] });
    return reply({});
  });
  return writes;
}

const tour = (page: Page) => page.locator('[role="dialog"][data-portal-tour-ui]');
async function checkSpotlight(page: Page) {
  const highlight = page.locator("[data-tour-highlight]");
  await expect(highlight).toBeVisible();
  for (const side of ["top", "right", "bottom", "left"]) {
    await expect(highlight).toHaveCSS(`border-${side}-width`, "0px");
  }
  await expect(highlight).toHaveCSS("outline-style", "none");
  await expect(highlight).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(highlight).toHaveCSS("box-shadow", /9999px/);
  await expect(page.locator(".portal-tour-overlay")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
}
async function checkBounds(page: Page) {
  const box = await tour(page).boundingBox();
  const size = page.viewportSize()!;
  expect(box).toBeTruthy();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(size.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(size.height + 1);
  await checkSpotlight(page);
}
async function finish(page: Page) {
  if (!await tour(page).isVisible()) await page.getByRole("button", { name: "Take a tour", exact: true }).click();
  await expect(tour(page)).toBeVisible();
  const titles: string[] = [];
  for (let i = 0; i < 30; i++) {
    await checkBounds(page);
    titles.push(await tour(page).getByRole("heading").innerText());
    const done = tour(page).getByRole("button", { name: "Finish", exact: true });
    if (await done.count()) { await done.click(); break; }
    await tour(page).getByRole("button", { name: "Next", exact: true }).click();
  }
  await expect(tour(page)).toHaveCount(0);
  return titles;
}


for (const width of [390, 1440]) {
 test(`opted-in page tours require a click, replay safely and fit ${width}px`, async ({ page }) => {
  await page.setViewportSize({width,height:844}); await page.emulateMedia({reducedMotion:"reduce"});
  const writes=await api(page);
  for(const path of ["dashboard","subscriptions","subscriptions/subscription-1","orders","orders/order-1","payments","credit","addresses","account","support","notifications"]){
   await page.goto(`/portal/${path}`);
   const launcher=page.getByRole("button",{name:"Take a tour",exact:true});
   await expect(launcher).toBeVisible();await expect(tour(page)).toHaveCount(0);
   expect((await finish(page)).length,path).toBeGreaterThan(0);
   await launcher.click();await expect(tour(page).getByRole("status")).toContainText("Step 1 of");
   await tour(page).getByRole("button",{name:"Skip",exact:true}).click();
   await expect(tour(page)).toHaveCount(0);await expect(launcher).toBeFocused();
  }
  expect(writes).toEqual([]);
 });
}
test("Back, Escape and replay preserve focus without account writes",async({page})=>{
 const writes=await api(page);await page.goto("/portal/dashboard");
 const launcher=page.getByRole("button",{name:"Take a tour",exact:true});
 await launcher.click();const first=await tour(page).getByRole("heading").innerText();
 await expect(tour(page).getByRole("button",{name:"Back",exact:true})).toBeDisabled();
 await tour(page).getByRole("button",{name:"Next",exact:true}).click();
 await tour(page).getByRole("button",{name:"Back",exact:true}).click();
 await expect(tour(page).getByRole("heading")).toHaveText(first);await page.keyboard.press("Escape");
 await expect(tour(page)).toHaveCount(0);await expect(launcher).toBeFocused();
 await page.reload();await expect(launcher).toBeVisible();await expect(tour(page)).toHaveCount(0);
 await launcher.click();await expect(tour(page).getByRole("heading")).toHaveText(first);
 expect(writes).toEqual([]);
});
test("empty collections omit absent controls",async({page})=>{
 const writes=await api(page,{empty:true});await page.goto("/portal/subscriptions");
 expect(await finish(page)).not.toContain("Open subscription details");
 await page.goto("/portal/addresses");expect(await finish(page)).not.toContain("Delete an address");
 expect(writes).toEqual([]);
});
for(const status of ["active","paused","cancelled"]){
 test(`subscription page tour reflects ${status} without applying actions`,async({page})=>{
  const writes=await api(page,{status});await page.goto("/portal/subscriptions/subscription-1");
  const titles=await finish(page);
  expect(titles.includes("Pause deliveries")).toBe(status==="active");
  expect(titles.includes("Resume deliveries")).toBe(status==="paused");
  expect(titles.includes("Cancel a subscription")).toBe(status!=="cancelled");
  expect(writes).toEqual([]);
 });
}
test("tours stay off by default",async({page})=>{
 const writes=await api(page);
 await page.addInitScript(()=>localStorage.removeItem("levants:portalToursEnabled"));
 await page.goto("/portal/dashboard");await expect(page.getByRole("heading",{name:/dashboard/i})).toBeVisible();
 await expect(page.getByRole("button",{name:"Take a tour",exact:true})).toHaveCount(0);
 await expect(tour(page)).toHaveCount(0);expect(writes).toEqual([]);
});
test("loading and failed pages do not offer an unusable tour",async({page})=>{
 await api(page);let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route("**/api/portal/subscriptions?**",async route=>{await gate;await route.fulfill({status:500,json:{success:false,message:"Unavailable"}});});
 await page.goto("/portal/subscriptions");
 await expect(page.getByRole("button",{name:"Take a tour",exact:true})).toHaveCount(0);
 release();await expect(page.getByText("Unavailable",{exact:true})).toBeVisible();
 await expect(tour(page)).toHaveCount(0);
 await expect(page.getByRole("button",{name:"Take a tour",exact:true})).toHaveCount(0);
});

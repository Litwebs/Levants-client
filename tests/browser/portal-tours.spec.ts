import { expect, test, type Page } from "@playwright/test";

const address = { _id: "address-1", line1: "1 Dairy Lane", city: "Bradford", postcode: "BD5 0AL", country: "United Kingdom", isDefault: true };
const item = { _id: "item-1", product: "milk", variant: "milk-v", name: "Whole milk", sku: "MILK", quantity: 1, unitPrice: 2 };
const subscription = { _id: "subscription-1", subscriptionNumber: "SUB-100", status: "active", frequency: "weekly", preferredDeliveryDay: 1, preferredDeliveryDays: [1], upcomingDeliveryDate: "2035-05-07T08:00:00.000Z", nextDeliveryDate: "2035-05-07T08:00:00.000Z", deliveryAddress: address, items: [item], customerVersion: 1, createdAt: "2026-01-01T12:00:00.000Z", updatedAt: "2026-01-01T12:00:00.000Z" };
const delivery = { _id: "delivery-1", scheduledDate: "2035-05-07T08:00:00.000Z", status: "scheduled", cutoffAt: "2035-05-05T18:00:00.000Z", isPastCutoff: false, addOns: [] };
const order = { _id: "order-1", customer: "tour-customer", orderId: "ORD-100", status: "paid", stripePaymentIntentId: "pi_tour_fixture", amountPaid: 3, deliveryStatus: "ordered", total: 3, subtotal: 2, deliveryFee: 1, items: [{ name: "Whole milk", sku: "MILK", price: 2, quantity: 1, subtotal: 2 }], deliveryAddress: address, createdAt: "2026-01-01T12:00:00.000Z", updatedAt: "2026-01-01T12:00:00.000Z", paidAt: "2026-01-01T12:00:00.000Z" };
const product = { id: "milk", name: "Whole milk", category: "Dairy", description: "Fresh milk", galleryImages: [], thumbnailImage: null, isActive: true, variants: [{ id: "milk-v", name: "1 litre", sku: "MILK", price: 2, currency: "GBP", stockQuantity: 100, availableStock: 100, isSubscriptionEligible: true }], pricing: { min: 2, max: 2, currency: "GBP" } };
const meta = { page: 1, pageSize: 20, total: 1, totalPages: 1 };

async function api(page: Page, options: { status?: string; empty?: boolean; customerId?: string } = {}) {
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
  test(`all portal screens have a safe replayable tour at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const writes = await api(page);
    const screens: Record<string, number> = { dashboard: 4, subscriptions: 5, "subscriptions/subscription-1": 12, "subscriptions/subscription-1/add-products": 4, "subscriptions/subscription-1/next-delivery/add-ons": 4, orders: 5, "orders/order-1": 4, payments: 4, credit: 2, addresses: 4, account: 10, support: 5, notifications: 3, "subscriptions/new": 3 };
    for (const [path, minimumSteps] of Object.entries(screens)) {
      await page.goto(`/portal/${path}`);
      expect((await finish(page)).length, path).toBeGreaterThanOrEqual(minimumSteps);
      const launcher = page.getByRole("button", { name: "Take a tour", exact: true });
      await expect(launcher).toBeEnabled();
      await launcher.click();
      await expect(tour(page).getByRole("status")).toContainText("Step 1 of");
      await tour(page).getByRole("button", { name: "Skip", exact: true }).click();
      await expect(tour(page)).toHaveCount(0);
      await expect(launcher).toBeFocused();
    }
    expect(writes).toEqual([]);
  });
}

test("first visit, Back, Escape, keyboard focus and remembered dismissal", async ({ page }) => {
  await api(page);
  await page.goto("/portal/dashboard");
  await expect(tour(page)).toBeVisible();
  const first = await tour(page).getByRole("heading").innerText();
  await expect(tour(page).getByRole("button", { name: "Back", exact: true })).toBeDisabled();
  await page.keyboard.press("Tab");
  expect(await tour(page).evaluate(element => element.contains(document.activeElement))).toBe(true);
  await tour(page).getByRole("button", { name: "Next", exact: true }).click();
  await tour(page).getByRole("button", { name: "Back", exact: true }).click();
  await expect(tour(page).getByRole("heading")).toHaveText(first);
  await page.keyboard.press("Escape");
  await expect(tour(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Take a tour", exact: true })).toBeFocused();
  await page.reload();
  await expect(page.getByRole("button", { name: "Take a tour", exact: true })).toBeEnabled();
  await expect(tour(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Take a tour", exact: true }).click();
  await expect(tour(page).getByRole("heading")).toHaveText(first);
});

test("empty collections omit absent controls and do not crash", async ({ page }) => {
  const writes = await api(page, { empty: true });
  await page.goto("/portal/subscriptions");
  const titles = await finish(page);
  expect(titles).not.toContain("Open subscription details");
  await page.goto("/portal/addresses");
  const addressTitles = await finish(page);
  expect(addressTitles).not.toContain("Delete an address");
  expect(writes).toEqual([]);
});

test("an address form has its own input tour and preserves typed values", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const writes = await api(page);
  await page.goto("/portal/addresses");
  await finish(page);
  await page.locator('[data-tour="address-add"]').click();
  await finish(page);
  await page.locator('[data-tour="address-line1"]').fill("22 New Road");
  await page.locator('[data-tour-page="address-form"]').getByRole("button", { name: "Take a tour" }).click();
  await finish(page);
  await expect(page.locator('[data-tour="address-line1"]')).toHaveValue("22 New Road");
  const replay = page.locator('[data-tour-page="address-form"]').getByRole("button", { name: "Take a tour" });
  await expect(replay).toBeFocused();
  await expect(replay).toBeInViewport();
  expect(writes).toEqual([]);
});

for (const status of ["active", "paused", "cancelled"]) {
  test(`subscription actions and nested tours match the ${status} state without applying actions`, async ({ page }) => {
    const writes = await api(page, { status });
    await page.goto("/portal/subscriptions/subscription-1");
    const titles = await finish(page);
    expect(titles.includes("Pause deliveries")).toBe(status === "active");
    expect(titles.includes("Resume deliveries")).toBe(status === "paused");
    expect(titles.includes("Cancel a subscription")).toBe(status !== "cancelled");
    if (status !== "cancelled") {
      await page.locator(`[data-tour="subscription-${status === "active" ? "pause" : "resume"}"]`).click();
      await finish(page);
      await expect(page.locator(`[data-tour-page="${status === "active" ? "pause-form" : "resume-confirmation"}"]`)).toBeVisible();
    }
    expect(writes).toEqual([]);
  });
}

test("tour waits for loaded content and stays unavailable on an API error", async ({ page }) => {
  await api(page);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/portal/subscriptions?**", async route => { await gate; await route.fulfill({ status: 500, json: { success: false, message: "Unavailable" } }); });
  await page.goto("/portal/subscriptions");
  await expect(page.getByRole("button", { name: "Take a tour", exact: true })).toBeDisabled();
  release();
  await expect(page.getByText("Unavailable", { exact: true })).toBeVisible();
  await expect(tour(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Take a tour", exact: true })).toBeDisabled();
});

test("every subscription builder stage replays its own controls without modifying the draft", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const writes = await api(page);
  await page.goto("/portal/dashboard");
  await finish(page);
  const stages = ["new-days", "new-frequency", "new-products", "new-address", "new-review"];
  for (let step = 0; step < stages.length; step++) {
    await page.evaluate(step => {
      sessionStorage.setItem("levants_subscription_draft", JSON.stringify({ flowVersion: 2, step, selectedVariantIds: ["milk-v"], quantities: { "milk-v": 2 }, dayQuantities: { Monday: { "milk-v": 2 } }, frequency: "weekly", deliveryDays: ["Monday"], selectedAddress: "address-1", deliveryInstructions: "Leave by the door" }));
    }, step);
    await page.goto("/portal/subscriptions/new");
    const scope = page.locator(`[data-tour-page="${stages[step]}"][data-tour-ready="true"]`);
    await expect(scope).toBeVisible();
    const before = await page.evaluate(() => sessionStorage.getItem("levants_subscription_draft"));
    if (step > 0) await page.getByRole("button", { name: "Take a tour", exact: true }).click();
    const titles = await finish(page);
    expect(titles.length).toBeGreaterThanOrEqual(2);
    expect(await page.evaluate(() => sessionStorage.getItem("levants_subscription_draft"))).toBe(before);
    await expect(scope).toBeVisible();
  }
  expect(writes).toEqual([]);
});

test("tour dismissal belongs to the signed-in customer", async ({ page }) => {
  const options = { customerId: "first-customer" };
  await api(page, options);
  await page.goto("/portal/dashboard");
  await finish(page);
  options.customerId = "second-customer";
  await page.reload();
  await expect(tour(page)).toBeVisible();
  await finish(page);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith("levants:portal-tour:v1:")).sort())).toEqual([
    "levants:portal-tour:v1:first-customer:dashboard",
    "levants:portal-tour:v1:second-customer:dashboard",
  ]);
});

test("tour adapts when an asynchronously rendered target disappears", async ({ page }) => {
  await api(page);
  await page.goto("/portal/subscriptions");
  await expect(tour(page)).toBeVisible();
  await tour(page).getByRole("button", { name: "Next", exact: true }).click();
  await tour(page).getByRole("button", { name: "Next", exact: true }).click();
  await expect(tour(page).getByRole("heading")).toHaveText("Delivery and pricing summary");
  await page.locator('[data-tour="subscription-card"]').evaluate(element => element.remove());
  await expect(tour(page).getByRole("heading")).toHaveText("Create another subscription");
  await finish(page);
});

test("one-time address changes get contextual help without saving the order", async ({ page }) => {
  const writes = await api(page);
  await page.route("**/api/portal/orders/order-1", route => route.fulfill({ json: { success: true, data: { order: { ...order, deliveryChangeAllowed: true, deliveryChangeCutoffAt: delivery.cutoffAt } } } }));
  await page.goto("/portal/orders/order-1");
  expect(await finish(page)).toContain("A change for this order");
  await page.locator('[data-tour="order-change-delivery"]').click();
  await page.getByRole("button", { name: "Take a tour", exact: true }).click();
  const titles = await finish(page);
  expect(titles).toContain("Choose this order's address");
  expect(titles).toContain("Save the one-time address change");
  expect(writes).toEqual([]);
});

test("cancellation help leaves the subscription confirmation untouched", async ({ page }) => {
  const writes = await api(page);
  await page.goto("/portal/subscriptions/subscription-1");
  await finish(page);
  await page.locator('[data-tour="subscription-cancel"]').click();
  expect(await finish(page)).toContain("Confirm only when certain");
  await expect(page.locator('[data-tour-page="cancel-confirmation"]')).toBeVisible();
  expect(writes).toEqual([]);
});

test("blocked tour storage keeps replay available and dismisses for the session", async ({ page }) => {
  await api(page);
  await page.addInitScript(() => {
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    Storage.prototype.getItem = function(key: string) {
      if (key.startsWith("levants:portal-tour:")) throw new DOMException("Blocked", "SecurityError");
      return get.call(this, key);
    };
    Storage.prototype.setItem = function(key: string, value: string) {
      if (key.startsWith("levants:portal-tour:")) throw new DOMException("Blocked", "SecurityError");
      return set.call(this, key, value);
    };
  });
  await page.goto("/portal/dashboard");
  await finish(page);
  await expect(page.getByRole("button", { name: "Take a tour", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Take a tour", exact: true }).click();
  await finish(page);
  await expect(tour(page)).toHaveCount(0);
});

for (const size of [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 640, height: 360 }]) {
  test(`small-screen tour keeps readable content and persistent touch controls at ${size.width}x${size.height}`, async ({ page }, info) => {
    await page.setViewportSize(size);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const writes = await api(page);
    await page.goto("/portal/subscriptions/subscription-1");
    await finish(page);
    await page.locator('[data-tour="subscription-pause"]').click();
    await expect(tour(page)).toBeVisible();
    const card = (await tour(page).boundingBox())!;
    expect(card.width).toBe(Math.min(320, size.width - 24));
    const body = tour(page).locator('[data-tour-body]');
    await expect(body).toBeVisible();
    expect(card.height).toBeLessThanOrEqual(size.height * (size.height < 480 ? 0.65 : 0.44) + 1);
    expect((await body.boundingBox())!.height).toBeGreaterThan(48);
    await checkSpotlight(page);
    await expect(tour(page).locator('details')).not.toHaveAttribute('open', '');
    await info.attach(`tour-compact-${size.width}`, { body: await page.screenshot(), contentType: "image/png" });
    await tour(page).getByText('View current details', { exact: true }).click();
    await expect(tour(page).locator('details')).toHaveAttribute('open', '');
    await checkBounds(page);
    expect((await tour(page).boundingBox())!.height).toBeLessThanOrEqual(size.height * (size.height < 480 ? 0.65 : 0.44) + 1);
    for (const label of ["Skip", "Back", "Next"]) {
      const button = tour(page).getByRole("button", { name: label, exact: true });
      await expect(button).toBeInViewport({ ratio: 1 });
      expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    expect(await tour(page).evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await body.evaluate(element => { element.scrollTop = element.scrollHeight; });
    await expect(tour(page).getByRole("button", { name: "Next", exact: true })).toBeInViewport({ ratio: 1 });
    await info.attach(`tour-phone-${size.width}`, { body: await page.screenshot(), contentType: "image/png" });
    await finish(page);
    expect(writes).toEqual([]);
  });
}

test("compact cards animate normally and respect reduced-motion preferences", async ({ page }) => {
  await api(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/portal/dashboard");
  await expect(tour(page)).toBeVisible();
  await tour(page).getByRole("button", { name: "Next", exact: true }).click();
  expect(await tour(page).evaluate(element => element.getAnimations().some(animation => animation.playState === "running"))).toBe(true);
  await expect(tour(page)).toHaveCSS("animation-name", "portal-tour-enter-alternate");
  await expect(tour(page)).toHaveCSS("transform", "none");
  await tour(page).getByRole("button", { name: "Back", exact: true }).click();
  await expect(tour(page)).toHaveCSS("animation-name", "portal-tour-enter");
  expect(await tour(page).locator('.portal-tour-step').first().evaluate(element => getComputedStyle(element).animationName)).toBe("portal-tour-step-enter");
  await checkSpotlight(page);
  await expect(page.locator("[data-tour-highlight]")).toHaveCSS("transition-duration", "0.28s, 0.28s, 0.28s, 0.28s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-tour-highlight]")).toHaveCSS("transition-duration", "0s");
  expect(await tour(page).locator('.portal-tour-step').first().evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  expect(await tour(page).evaluate(element => getComputedStyle(element).animationName)).toBe("none");
  await finish(page);
});


test("desktop overview is centred, compact and has no target outline", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await api(page);
  await page.goto("/portal/dashboard");
  await expect(tour(page)).toBeVisible();
  await expect.poll(async () => Math.abs((await tour(page).boundingBox())!.x + (await tour(page).boundingBox())!.width / 2 - 720)).toBeLessThan(2);
  const box = (await tour(page).boundingBox())!;
  expect(box.width).toBeLessThanOrEqual(360);
  expect(box.height).toBeLessThan(300);
  expect(box.y).toBeGreaterThan(200);
  await checkSpotlight(page);
  await info.attach("tour-compact-desktop", { body: await page.screenshot(), contentType: "image/png" });
  await finish(page);
});

for (const width of [320, 390, 640]) {
  test(`mobile card stays compact and its cross closes every step at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 640 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const writes = await api(page);
    await page.goto("/portal/dashboard");
    const launcher = page.getByRole("button", { name: "Take a tour", exact: true });
    for (let step = 0; step < 4; step++) {
      if (step) await launcher.click();
      await expect(tour(page)).toBeVisible();
      for (let next = 0; next < step; next++) await tour(page).getByRole("button", { name: "Next", exact: true }).click();
      const close = tour(page).getByRole("button", { name: "Skip tour", exact: true });
      // The close target must win hit testing even while the header is animated.
      await expect(close).toBeInViewport({ ratio: 1 });
      await expect.poll(() => close.evaluate(element => {
        const rect = element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
      })).toBe(true);
      if (step === 3) {
        await expect(tour(page)).toHaveCSS("transform", "none");
        const box = (await tour(page).boundingBox())!;
        expect(box.width).toBeLessThanOrEqual(320);
        expect(box.height).toBeLessThan(210);
        await checkSpotlight(page);
        await info.attach(`tour-mobile-final-${width}`, { body: await page.screenshot(), contentType: "image/png" });
      }
      await close.click();
      await expect(tour(page)).toHaveCount(0);
      await expect(launcher).toBeFocused();
      // A dismissed auto-tour must stay dismissed, while replay remains available.
      await page.waitForTimeout(600);
      await expect(tour(page)).toHaveCount(0);
    }
    expect(writes).toEqual([]);
  });
}

import { expect, test, type Page } from "@playwright/test";
import type { DeliveryReductionQuote, DeliveryReductionRequest, DeliveryReductionResult, PortalSubscriptionDelivery } from "../../src/api/portalSubscriptions";

const address = { _id: "address-1", line1: "1 Dairy Lane", city: "Bradford", postcode: "BD5 0AL", country: "United Kingdom", isDefault: true };
const item = { _id: "item-1", product: "milk-p", variant: "milk-v", name: "Whole milk", sku: "MILK", quantity: 4, unitPrice: 2.5 };
const current: PortalSubscriptionDelivery = { _id: "delivery-1", scheduledDate: "2035-05-07T08:00:00Z", status: "generated", canChangeThisDelivery: true,
  cutoffAt: "2035-05-05T21:00:00Z", isPastCutoff: false, recurringItems: [item], addOns: [],
  order: { _id: "order-1", orderId: "ORD-100", status: "paid", deliveryStatus: "ordered", total: 11, deliveryFee: 1 } };
const initial: DeliveryReductionQuote = { deliveryId: current._id, scheduledDate: current.scheduledDate, cutoffAt: current.cutoffAt!,
  expectedVersion: 3, quoteToken: "a".repeat(64), before: [item], after: [item], originalTotalMinor: 1100, revisedTotalMinor: 1100,
  creditedMinor: 0, deliveryFeeMinor: 100, hasChanges: false, cancelsDelivery: false };
const reduced: DeliveryReductionQuote = { ...initial, quoteToken: "b".repeat(64), after: [{ ...item, quantity: 2 }],
  revisedTotalMinor: 600, creditedMinor: 500, hasChanges: true };
const removed: DeliveryReductionQuote = { ...reduced, quoteToken: "c".repeat(64), after: [],
  revisedTotalMinor: 0, creditedMinor: 1100, deliveryFeeMinor: 0, cancelsDelivery: true };

// These are API-contract fixtures for the actual portal UI, not database or
// provider evidence. Every mutation outside the two reviewed endpoints fails.
async function fixture(page: Page, options: { lostResponse?: boolean; stale?: boolean; longHistory?: boolean } = {}) {
  const confirmations: DeliveryReductionRequest[] = [];
  const previews: unknown[] = [];
  const unexpected: string[] = [];
  let saved: DeliveryReductionResult | null = null;
  let initialReads = 0;
  await page.addInitScript(() => {
    for (const name of ["subscription-detail", "credit"]) localStorage.setItem(`levants:portal-tour:v1:ui-customer:${name}`, "seen");
  });
  await page.route("**/api/**", async route => {
    const request = route.request(); const pathname = new URL(request.url()).pathname;
    // Vite serves source modules under /src/api/: only mock real API requests.
    if (!pathname.startsWith("/api/")) return route.continue();
    const path = pathname.slice(4);
    const reply = (data: unknown) => route.fulfill({ json: { success: true, data } });
    if (request.method() === "GET") {
      if (path === "/portal/auth/me") return reply({ customer: { _id: "ui-customer", firstName: "UI", lastName: "Customer", email: "ui@example.com",
        emailVerifiedAt: "2026-01-01", themePreference: "light", creditBalance: saved?.creditedMinor || 0 } });
      if (path === "/portal/addresses") return reply({ addresses: [address] });
      if (path.endsWith("/one-time-change")) { initialReads++; return reply(initial); }
      if (path.endsWith("/deliveries")) {
        const values: PortalSubscriptionDelivery[] = [{ ...current,
        ...(saved ? { recurringItems: saved.adjustment.after, oneTimeChanges: [saved.adjustment], canChangeThisDelivery: false,
          status: saved.adjustment.cancelsDelivery ? "cancelled" : "generated", order: { ...current.order, total: saved.revisedTotalMinor / 100,
            deliveryFee: saved.adjustment.cancelsDelivery ? 0 : 1 } } : {}) },
      { _id: "delivery-2", scheduledDate: "2035-05-14T08:00:00Z", status: "scheduled", cutoffAt: "2035-05-12T21:00:00Z", isPastCutoff: false, addOns: [] }];
        if (options.longHistory) values.unshift(...Array.from({ length: 20 }, (_, index) => ({ _id: `past-${index}`,
          scheduledDate: new Date(Date.UTC(2035, 0, index + 1)).toISOString(), status: "delivered", canChangeThisDelivery: false })));
        const number = Number(new URL(request.url()).searchParams.get("page") || 1);
        return reply({ deliveries: values.slice((number - 1) * 10, number * 10), meta: { total: values.length, page: number, pageSize: 10 } });
      }
      if (path === "/portal/subscriptions/subscription-1") return reply({ subscription: { _id: "subscription-1", subscriptionNumber: "SUB-100", status: "active",
        frequency: "weekly", preferredDeliveryDay: 1, preferredDeliveryDays: [1], nextDeliveryDate: current.scheduledDate,
        upcomingDeliveryDate: current.scheduledDate, deliveryAddress: address, items: [item], customerVersion: saved ? 4 : 3,
        createdAt: "2026-01-01T12:00:00Z", updatedAt: "2026-01-01T12:00:00Z" },
      cutoff: { cutoffAt: current.cutoffAt, isPastCutoff: false, cutoffDaysBefore: 2, cutoffTime: "22:00", deliveryDays: [1, 4], timeZone: "Europe/London" } });
      if (path === "/portal/credits") return reply({ balance: saved?.creditedMinor || 0, transactions: saved ? [{ _id: "credit-1", type: "subscription_refund",
        amount: saved.creditedMinor, balanceAfter: saved.creditedMinor, reason: "One-time reduction for SUB-100", createdAt: saved.adjustment.createdAt }] : [] });
      return reply({});
    }
    if (path === "/portal/subscriptions/subscription-1/deliveries/delivery-1/one-time-change/preview" && request.method() === "POST") {
      const body = request.postDataJSON(); previews.push(body);
      return reply(body.items[0].quantity === 0 ? removed : reduced);
    }
    if (path === "/portal/subscriptions/subscription-1/deliveries/delivery-1/one-time-change/confirm" && request.method() === "POST") {
      const body = request.postDataJSON() as DeliveryReductionRequest; confirmations.push(body);
      if (options.stale) return route.fulfill({ status: 409, json: { success: false, message: "This delivery changed. Review it again.", data: { code: "STALE_DELIVERY_QUOTE" } } });
      const quote = body.items[0].quantity === 0 ? removed : reduced;
      saved ||= { deliveryId: current._id, creditedMinor: quote.creditedMinor, revisedTotalMinor: quote.revisedTotalMinor, customerVersion: 4,
        adjustment: { ...quote, operationId: body.operationId, createdAt: "2035-05-01T12:00:00Z", creditTransaction: "credit-1" } };
      if (options.lostResponse && confirmations.length === 1) return route.abort("failed");
      return reply(saved);
    }
    unexpected.push(`${request.method()} ${path}`);
    return route.fulfill({ status: 400, json: { success: false, message: "Unexpected account mutation" } });
  });
  return { confirmations, previews, unexpected, initialReads: () => initialReads };
}

async function open(page: Page) {
  await page.goto("/portal/subscriptions/subscription-1");
  await page.getByRole("button", { name: "Change This Delivery Only", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Change this delivery only", exact: true });
  await expect(dialog.getByRole("spinbutton", { name: item.name })).toHaveValue("4");
  return dialog;
}

async function finishReductionTour(page: Page) {
  const tour = page.locator('[role="dialog"][data-portal-tour-ui]');
  await expect(tour).toBeVisible();
  const titles: string[] = [];
  for (let count = 0; count < 15; count++) {
    const bounds = (await tour.boundingBox())!; const view = page.viewportSize()!;
    expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(view.width + 1);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(view.height + 1);
    titles.push(await tour.getByRole("heading").innerText());
    const finish = tour.getByRole("button", { name: "Finish", exact: true });
    if (await finish.count()) { await finish.click(); break; }
    await tour.getByRole("button", { name: "Next", exact: true }).click();
  }
  await expect(tour).toHaveCount(0);
  return titles;
}

for (const width of [320, 390, 1440]) {
  test(`customer guide and editor/review/success tours are read-only at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const state = await fixture(page);
    await page.goto("/portal/subscriptions/subscription-1");
    const guide = page.locator('[data-tour="delivery-reduction-guide"]');
    await guide.locator("summary").click();
    await expect(guide).toContainText("including after the cut-off");
    await expect(guide).toContainText("Paid one-time add-ons stay unchanged");
    expect(state.previews).toHaveLength(0); expect(state.confirmations).toHaveLength(0);
    await guide.locator("summary").click();
    await page.getByRole("button", { name: "Change This Delivery Only", exact: true }).click();
    const editor = page.locator('[data-tour-page="delivery-reduction"]');
    await expect(editor.getByRole("spinbutton")).toHaveValue("4");
    const launcher = editor.getByRole("button", { name: "Take a tour", exact: true });
    await launcher.click();
    expect(await finishReductionTour(page)).toContain("Review without applying a change");
    await expect(launcher).toBeFocused();
    await expect(editor.getByRole("spinbutton")).toHaveValue("4");
    expect(state.previews).toHaveLength(0); expect(state.confirmations).toHaveLength(0);
    await editor.getByRole("spinbutton").fill("2");
    await editor.getByRole("button", { name: "Review change", exact: true }).click();
    await launcher.click();
    expect(await finishReductionTour(page)).toContain("Confirm only when ready");
    expect(state.previews).toHaveLength(1); expect(state.confirmations).toHaveLength(0);
    const screenshot = await editor.screenshot({ path: info.outputPath(`delivery-guidance-${width}.png`) });
    await info.attach(`delivery-guidance-${width}`, { body: screenshot, contentType: "image/png" });
    await editor.getByRole("button", { name: "Confirm delivery change", exact: true }).click();
    await expect(editor.getByRole("heading", { name: "Delivery changed", exact: true })).toBeVisible();
    await launcher.click();
    expect(await finishReductionTour(page)).toContain("Find the store credit entry");
    expect(state.confirmations).toHaveLength(1); expect(state.unexpected).toEqual([]);
  });
}

test("recovery tour checks nothing and leaves the identical saved confirmation for explicit retry", async ({ page }) => {
  const state = await fixture(page, { lostResponse: true }); const dialog = await open(page);
  await dialog.getByRole("spinbutton").fill("2");
  await dialog.getByRole("button", { name: "Review change", exact: true }).click();
  await dialog.getByRole("button", { name: "Confirm delivery change", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await page.reload(); await page.getByRole("button", { name: "Check delivery change", exact: true }).click();
  const editor = page.locator('[data-tour-page="delivery-reduction"]');
  const before = await page.evaluate(() => JSON.stringify(Object.entries(sessionStorage)));
  await editor.getByRole("button", { name: "Take a tour", exact: true }).click();
  expect(await finishReductionTour(page)).toContain("Check the same saved request");
  expect(await page.evaluate(() => JSON.stringify(Object.entries(sessionStorage)))).toBe(before);
  expect(state.confirmations).toHaveLength(1); expect(state.initialReads()).toBe(1);
  await editor.getByRole("button", { name: "Check result", exact: true }).click();
  await expect(editor.getByRole("heading", { name: "Delivery changed", exact: true })).toBeVisible();
  expect(state.confirmations).toHaveLength(2); expect(state.confirmations[1]).toEqual(state.confirmations[0]);
  expect(state.unexpected).toEqual([]);
});

for (const width of [320, 390, 1440]) {
  test(`review, confirmation, adjusted snapshot and future quantities at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 844 });
    const state = await fixture(page); const dialog = await open(page);
    await dialog.getByRole("spinbutton", { name: item.name }).fill("2");
    await dialog.getByRole("button", { name: "Review change", exact: true }).click();
    await expect(dialog.getByRole("region", { name: "Review delivery change" })).toContainText("£5.00");
    expect(state.confirmations).toHaveLength(0);
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width); expect(box.y + box.height).toBeLessThanOrEqual(844);
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    for (const control of await dialog.locator("input, button").all()) {
      if (await control.isVisible()) {
        expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
    }
    const shot = await dialog.screenshot({ path: `test-results/delivery-reduction-review-${width}.png` });
    await info.attach(`review-${width}`, { body: shot, contentType: "image/png" });
    await dialog.getByRole("button", { name: "Confirm delivery change", exact: true }).click();
    const success = page.getByRole("dialog", { name: "Delivery changed", exact: true });
    await expect(success).toContainText("£5.00 added as store credit");
    await success.getByRole("button", { name: "Done", exact: true }).click();
    await page.locator('[data-tour="delivery-expand"]').nth(0).click();
    const adjusted = page.getByRole("region", { name: "Delivery details for 07 May 2035" });
    await expect(adjusted.getByText("Whole milk × 2", { exact: true })).toBeVisible();
    await expect(adjusted.getByRole("region", { name: "One-time delivery changes" })).toContainText("4 → 2");
    await page.locator('[data-tour="delivery-expand"]').nth(1).click();
    await expect(page.getByRole("region", { name: "Delivery details for 14 May 2035" }).getByText("Whole milk × 4", { exact: true })).toBeVisible();
    expect(state.confirmations).toHaveLength(1); expect(state.unexpected).toEqual([]);
  });
}

test("lost confirmation recovers its identical request after reload when new changes are unavailable", async ({ page }) => {
  const state = await fixture(page, { lostResponse: true }); const dialog = await open(page);
  await dialog.getByRole("spinbutton", { name: item.name }).fill("2");
  await dialog.getByRole("button", { name: "Review change", exact: true }).click();
  await dialog.getByRole("button", { name: "Confirm delivery change", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await page.reload(); await page.getByRole("button", { name: "Check delivery change", exact: true }).click();
  const recovery = page.getByRole("dialog"); await expect(recovery.getByRole("spinbutton")).toHaveCount(0);
  await recovery.getByRole("button", { name: "Check result", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Delivery changed", exact: true })).toBeVisible();
  expect(state.confirmations).toHaveLength(2); expect(state.confirmations[1]).toEqual(state.confirmations[0]);
  expect(state.initialReads()).toBe(1); expect(state.unexpected).toEqual([]);
});

test("empty delivery shows zero quantities, zero total and zero fee after confirmation", async ({ page }) => {
  const state = await fixture(page); const dialog = await open(page);
  await dialog.getByRole("button", { name: "Remove", exact: true }).click();
  await dialog.getByRole("button", { name: "Review change", exact: true }).click();
  await expect(dialog.getByRole("region", { name: "Review delivery change" })).toContainText("This delivery will be cancelled");
  await dialog.getByRole("button", { name: "Confirm delivery change", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.locator('[data-tour="delivery-expand"]').nth(0).click();
  const details = page.getByRole("region", { name: "Delivery details for 07 May 2035" });
  await expect(details).toContainText("No recurring items remain");
  await expect(details.getByText("Delivery total", { exact: true }).locator("..")).toContainText("£0.00");
  await expect(details.getByText("Delivery fee", { exact: true }).locator("..")).toContainText("£0.00");
  expect(state.unexpected).toEqual([]);
});

test("a stale preview requires another explicit review", async ({ page }) => {
  const state = await fixture(page, { stale: true }); const dialog = await open(page);
  await dialog.getByRole("spinbutton", { name: item.name }).fill("2");
  await dialog.getByRole("button", { name: "Review change", exact: true }).click();
  await dialog.getByRole("button", { name: "Confirm delivery change", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Review it again");
  await expect(dialog.getByRole("button", { name: "Check result", exact: true })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Reload delivery", exact: true }).click();
  await expect(dialog.getByRole("spinbutton", { name: item.name })).toHaveValue("4");
  expect(state.confirmations).toHaveLength(1);
});

test("keyboard focus stays in the editor and Escape restores the delivery action", async ({ page }) => {
  const state = await fixture(page); await open(page);
  const dialog = page.getByRole("dialog");
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Change This Delivery Only", exact: true })).toBeFocused();
  expect(state.confirmations).toHaveLength(0); expect(state.unexpected).toEqual([]);
});

test("refreshing the adjusted delivery preserves an unsaved recurring quantity draft", async ({ page }) => {
  const state = await fixture(page); await page.goto("/portal/subscriptions/subscription-1");
  const increase = page.getByRole("button", { name: "Increase Whole milk quantity", exact: true });
  await increase.click();
  const draft = increase.locator(".."); await expect(draft).toContainText("5");
  await page.getByRole("button", { name: "Change This Delivery Only", exact: true }).click();
  const dialog = page.getByRole("dialog"); await dialog.getByRole("spinbutton", { name: item.name }).fill("2");
  await dialog.getByRole("button", { name: "Review change", exact: true }).click();
  await dialog.getByRole("button", { name: "Confirm delivery change", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(draft).toContainText("5"); expect(state.unexpected).toEqual([]);
});

test("long-standing customers land on their upcoming delivery and can browse older/newer pages", async ({ page }) => {
  const state = await fixture(page, { longHistory: true });
  await page.goto("/portal/subscriptions/subscription-1");
  const nav = page.getByRole("navigation", { name: "Delivery history pages" });
  await expect(nav).toContainText("Page 3 of 3");
  await expect(page.getByRole("button", { name: "Change This Delivery Only", exact: true })).toBeVisible();
  await nav.getByRole("button", { name: "Older deliveries", exact: true }).click();
  await expect(nav).toContainText("Page 2 of 3");
  await expect(page.getByRole("button", { name: "Change This Delivery Only", exact: true })).toHaveCount(0);
  await nav.getByRole("button", { name: "Newer deliveries", exact: true }).click();
  await expect(nav).toContainText("Page 3 of 3");
  await expect(page.getByRole("button", { name: "Change This Delivery Only", exact: true })).toBeVisible();
  expect(state.confirmations).toHaveLength(0); expect(state.unexpected).toEqual([]);
});

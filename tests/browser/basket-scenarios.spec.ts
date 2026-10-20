import { expect, test, type Page } from "@playwright/test";
import type { Deal } from "../../src/api/deals";

type Basket = { manual: Record<string, number>; explicit: Record<string, number> };
const variants = {
  MILK: { id: "milk-standard", productId: "milk", product: "Milk", name: "Standard", price: 5 },
  OTHER_MILK: { id: "milk-other", productId: "milk", product: "Milk", name: "Other", price: 5 },
  HONEY: { id: "honey-standard", productId: "honey", product: "Honey", name: "Standard", price: 4 },
  EGGS: { id: "eggs-standard", productId: "eggs", product: "Eggs", name: "Standard", price: 2 },
};
type VariantKey = keyof typeof variants;

function deal(id: string, name: string, contents: Array<[VariantKey, number]>, packagePrice: number): Deal {
  const originalValue = contents.reduce((sum, [key, quantity]) => sum + variants[key].price * quantity, 0);
  return {
    id, slug: id, name, description: name, packagePrice, originalValue,
    savings: originalValue - packagePrice,
    savingsPercent: Math.round((originalValue - packagePrice) / originalValue * 100),
    currency: "GBP", isFeatured: false, maxPackages: 99,
    items: contents.map(([key, quantity]) => ({
      variantId: variants[key].id, quantity,
      variant: { id: variants[key].id, name: variants[key].name, sku: variants[key].id, price: variants[key].price, stockQuantity: 100, availableStock: 100 },
      product: { id: variants[key].productId, name: variants[key].product, category: "Dairy" },
    })),
  };
}

const baseDeals: Record<string, Deal> = {
  A: deal("deal-a", "Two milk", [["MILK", 2]], 8),
  B: deal("deal-b", "Milk and honey", [["MILK", 1], ["HONEY", 1]], 6),
};

async function mockApi(page: Page, state: { deals: Record<string, Deal>; failOfferCheck?: boolean; orders: unknown[] }) {
  await page.route("**/api/**", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!url.pathname.startsWith("/api/")) return route.continue();
    const path = url.pathname.slice(4);
    if (path === "/discounts/quote") {
      const payload = request.postDataJSON();
      const subtotal = payload.items.reduce((sum: number, item: {variantId:string;quantity:number}) => sum + (Object.values(variants).find(v => v.id === item.variantId)?.price || 0) * item.quantity, 0);
      return route.fulfill({json:{success:true,data:{subtotal,discountAmount:0,deliveryFee:1,total:subtotal+1,campaign:null}}});
    }
    if (path === "/deals") {
      if (state.failOfferCheck) {
        state.failOfferCheck = false;
        return route.fulfill({ status: 503, json: { success: false, message: "Offline" } });
      }
      const deals = Object.values(state.deals);
      return route.fulfill({ json: { success: true, data: { deals }, meta: { page: 1, pageSize: 100, total: deals.length, totalPages: 1 } } });
    }
    if (path.startsWith("/deals/")) {
      const item = Object.values(state.deals).find(entry => entry.slug === path.slice(7));
      return route.fulfill({ status: item ? 200 : 404, json: { success: !!item, data: { deal: item } } });
    }
    if (path === "/delivery/check") return route.fulfill({ json: { success: true, data: { deliverable: true } } });
    if (path === "/customers/guest") return route.fulfill({ json: { success: true, data: { customer: { _id: "guest-1" } } } });
    if (path === "/orders" && request.method() === "POST") {
      state.orders.push(request.postDataJSON());
      return route.fulfill({ json: { success: true, data: { orderId: `order-${state.orders.length}`, checkoutUrl: "/test-checkout" } } });
    }
    if (path.includes("/auth/")) return route.fulfill({ status: 401, json: { success: false, message: "Authentication required" } });
    return route.fulfill({ json: { success: true, data: {} } });
  });
}

function cart(basket: Basket, deals: Record<string, Deal>) {
  return {
    items: Object.entries(basket.manual).filter(([, quantity]) => quantity > 0).map(([key, quantity]) => {
      const variant = variants[key as VariantKey];
      return {
        quantity,
        product: { id: variant.productId, name: variant.product, category: "Dairy", price: variant.price, images: [], stockStatus: "in-stock" },
        variant: { id: variant.id, name: variant.name, price: variant.price, stockQuantity: 100, stockStatus: "in-stock" },
      };
    }),
    deals: Object.entries(basket.explicit).filter(([, quantity]) => quantity > 0).map(([key, quantity]) => ({ deal: deals[key], quantity })),
  };
}

async function openCheckout(page: Page, basket: Basket, deals: Record<string, Deal>) {
  await page.goto("/");
  await page.getByRole("button", { name: "Cart", exact: true }).first().waitFor();
  await page.waitForLoadState("networkidle");
  await page.evaluate(value => localStorage.setItem("levants-dairy-cart", JSON.stringify(value)), cart(basket, deals));
  await page.goto("/checkout");
  await page.getByRole("textbox", { name: "First Name" }).fill("Basket");
  await page.getByRole("textbox", { name: "Last Name" }).fill("Tester");
  await page.getByRole("textbox", { name: "Email" }).fill("basket@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator('input[name="address1"]').fill("1 Test Street");
  await page.locator('input[name="city"]').fill("Bradford");
  await page.locator('input[name="postcode"]').fill("BD1 1AA");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Payment", exact: true })).toBeVisible();
}

const combinations: Array<[string, Basket, number, Record<string, number>]> = [
  ["one milk", { manual: { MILK: 1 }, explicit: {} }, 5, {}],
  ["two milk", { manual: { MILK: 2 }, explicit: {} }, 8, { A: 1 }],
  ["three milk", { manual: { MILK: 3 }, explicit: {} }, 13, { A: 1 }],
  ["four milk", { manual: { MILK: 4 }, explicit: {} }, 16, { A: 2 }],
  ["milk and honey", { manual: { MILK: 1, HONEY: 1 }, explicit: {} }, 6, { B: 1 }],
  ["two milk and honey", { manual: { MILK: 2, HONEY: 1 }, explicit: {} }, 11, { B: 1 }],
  ["two milk and two honey", { manual: { MILK: 2, HONEY: 2 }, explicit: {} }, 12, { B: 2 }],
  ["three milk and honey", { manual: { MILK: 3, HONEY: 1 }, explicit: {} }, 14, { A: 1, B: 1 }],
  ["different milk variants", { manual: { MILK: 1, OTHER_MILK: 1 }, explicit: {} }, 10, {}],
  ["incomplete mixed deal", { manual: { HONEY: 1 }, explicit: {} }, 4, {}],
  ["explicit A", { manual: {}, explicit: { A: 1 } }, 8, { A: 1 }],
  ["explicit and automatic A", { manual: { MILK: 2 }, explicit: { A: 1 } }, 16, { A: 2 }],
  ["explicit A and automatic B", { manual: { MILK: 1, HONEY: 1 }, explicit: { A: 1 } }, 14, { A: 1, B: 1 }],
  ["explicit A with retail honey", { manual: { HONEY: 1 }, explicit: { A: 1 } }, 12, { A: 1 }],
  ["two explicit packages", { manual: {}, explicit: { A: 1, B: 1 } }, 14, { A: 1, B: 1 }],
  ["unrelated eggs", { manual: { EGGS: 1 }, explicit: { A: 1 } }, 10, { A: 1 }],
];

test("basket combinations submit the expected claims without a backend checkout", async ({ context }) => {
  for (const [name, basket, subtotal, claims] of combinations) {
    await test.step(name, async () => {
      const page = await context.newPage();
      const state = { deals: { ...baseDeals }, orders: [] as unknown[] };
      await mockApi(page, state);
      await openCheckout(page, basket, state.deals);
      await expect(page.getByRole("button", { name: `Place Order - £${(subtotal + 1).toFixed(2)}`, exact: true })).toBeVisible();
      await expect(page.getByLabel("Discount Code", { exact: true })).toHaveCount(Object.keys(claims).length ? 0 : 1);
      const posted = page.waitForRequest(req => req.method() === "POST" && new URL(req.url()).pathname === "/api/orders");
      await page.getByRole("button", { name: `Place Order - £${(subtotal + 1).toFixed(2)}`, exact: true }).click();
      const payload = (await posted).postDataJSON();
      expect(Object.fromEntries((payload.deals || []).map((entry: { dealId: string; quantity: number }) => [entry.dealId, entry.quantity]))).toEqual(
        Object.fromEntries(Object.entries(claims).map(([key, quantity]) => [state.deals[key].id, quantity])),
      );
      await page.close();
    });
  }
});

test("offer price change pauses checkout, then uses the reviewed total", async ({ page }) => {
  const state = { deals: { ...baseDeals }, orders: [] as unknown[] };
  await mockApi(page, state);
  await openCheckout(page, { manual: { MILK: 2 }, explicit: {} }, state.deals);
  state.deals.A = { ...state.deals.A, packagePrice: 7, savings: 3 };
  await page.getByRole("button", { name: "Place Order - £9.00", exact: true }).click();
  await expect(page.getByText("Your offers have been updated. Review your basket total, then place your order.")).toBeVisible();
  expect(state.orders).toHaveLength(0);
  await expect(page.getByRole("button", { name: "Place Order - £8.00", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Place Order - £8.00", exact: true }).click();
  await expect.poll(() => state.orders.length).toBe(1);
});

test("failed offer check is retryable without submitting the basket", async ({ page }) => {
  const state = { deals: { ...baseDeals }, orders: [] as unknown[], failOfferCheck: false };
  await mockApi(page, state);
  await openCheckout(page, { manual: { MILK: 2 }, explicit: {} }, state.deals);
  state.failOfferCheck = true;
  const button = page.getByRole("button", { name: "Place Order - £9.00", exact: true });
  await button.click();
  await expect(page.getByText("Could not check current offers. Please try again.")).toBeVisible();
  expect(state.orders).toHaveLength(0);
  await expect(button).toBeEnabled();
  await button.click();
  await expect.poll(() => state.orders.length).toBe(1);
});

test("reload keeps manual quantities and recalculates savings", async ({ page }) => {
  const state = { deals: { ...baseDeals }, orders: [] as unknown[] };
  await mockApi(page, state);
  await openCheckout(page, { manual: { MILK: 4 }, explicit: {} }, state.deals);
  await expect(page.getByRole("button", { name: "Place Order - £17.00", exact: true })).toBeVisible();
  await page.reload();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("levants-dairy-cart") || "{}"));
  expect(stored.items[0].quantity).toBe(4);
  expect(stored.deals).toEqual([]);
  await page.getByRole("textbox", { name: "First Name" }).fill("Basket");
  await page.getByRole("textbox", { name: "Last Name" }).fill("Tester");
  await page.getByRole("textbox", { name: "Email" }).fill("basket-reload@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator('input[name="address1"]').fill("1 Test Street");
  await page.locator('input[name="city"]').fill("Bradford");
  await page.locator('input[name="postcode"]').fill("BD1 1AA");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("button", { name: "Place Order - £17.00", exact: true })).toBeVisible();
});

test("overlapping packages expose the documented £16.50 subtotal", async ({ page }) => {
  const state = {
    deals: { ...baseDeals, C: deal("deal-c", "Three milk", [["MILK", 3]], 11.5) },
    orders: [] as unknown[],
  };
  await mockApi(page, state);
  await openCheckout(page, { manual: { MILK: 4 }, explicit: {} }, state.deals);
  await expect(page.getByRole("button", { name: "Place Order - £17.50", exact: true })).toBeVisible();
  const posted = page.waitForRequest(req => req.method() === "POST" && new URL(req.url()).pathname === "/api/orders");
  await page.getByRole("button", { name: "Place Order - £17.50", exact: true }).click();
  expect((await posted).postDataJSON().deals).toMatchObject([{ dealId: "deal-c", quantity: 1 }]);
});

for (const [name, change] of [
  ["expired", { endsAt: new Date(Date.now() - 1000).toISOString() }],
  ["future", { startsAt: new Date(Date.now() + 86400000).toISOString() }],
  ["unavailable", { maxPackages: 0 }],
] as const) test(`${name} package stays at retail price`, async ({ page }) => {
  const state = { deals: { ...baseDeals, A: { ...baseDeals.A, ...change } }, orders: [] as unknown[] };
  await mockApi(page, state);
  await openCheckout(page, { manual: { MILK: 2 }, explicit: {} }, state.deals);
  await expect(page.getByRole("button", { name: "Place Order - £11.00", exact: true })).toBeVisible();
});

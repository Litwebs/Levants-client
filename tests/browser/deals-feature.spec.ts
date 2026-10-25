import { expect, test, type Page } from "@playwright/test";
import type { Deal } from "../../src/api/deals";

const featured: Deal = {
  id: "featured-milk", slug: "featured-milk", name: "Featured milk pair",
  description: "Two fresh whole milk bottles.", imageUrl: "/src/assets/product-milk.jpg",
  packagePrice: 8, originalValue: 10, savings: 2, savingsPercent: 20,
  currency: "GBP", isFeatured: true, maxPackages: 10,
  items: [{ variantId: "milk-v", quantity: 2, variant: { id: "milk-v", name: "1 litre", sku: "MILK", price: 5, stockQuantity: 20, availableStock: 20 }, product: { id: "milk-p", name: "Whole milk", category: "Dairy" } }],
};
const ordinary: Deal = { ...featured, id: "ordinary-milk", slug: "ordinary-milk", name: "Regular milk offer", isFeatured: false };

async function api(page: Page, offers: Deal[]) {
  const requests: string[] = [];
  await page.route("**/api/**", async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.startsWith("/api/")) return route.continue();
    if (url.pathname === "/api/deals") {
      requests.push(url.search);
      // Include an ordinary offer deliberately: the Featured UI must also
      // protect its boundary when a cached API response ignores the filter.
      return route.fulfill({ json: { success: true, data: { deals: offers }, meta: { page: 1, pageSize: 100, total: offers.length, totalPages: 1 } } });
    }
    if (url.pathname.startsWith("/api/deals/")) {
      const deal = offers.find(item => url.pathname.endsWith(item.slug));
      return route.fulfill({ status: deal ? 200 : 404, json: { success: !!deal, data: { deal } } });
    }
    if (url.pathname === "/api/products") return route.fulfill({ json: { success: true, data: { items: [] }, meta: { total: 0, page: 1, totalPages: 1, categories: [] } } });
    if (url.pathname.includes("/auth/")) return route.fulfill({ status: 401, json: { success: false } });
    if (url.pathname === "/api/customers/guest") return route.fulfill({ json: { success: true, data: { customer: { _id: "guest" } } } });
    if (url.pathname === "/api/delivery/check") return route.fulfill({ json: { success: true, data: { deliverable: true } } });
    if (url.pathname === "/api/orders") return route.fulfill({ json: { success: true, data: { orderId: "package-order", checkoutUrl: "/test-checkout" } } });
    return route.fulfill({ json: { success: true, data: {} } });
  });
  return requests;
}

for (const width of [390, 1440]) {
  test(`homepage and Deals page feature only marked offers at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    const requests = await api(page, [featured, ordinary]);
    await page.goto("/");
    const section = page.locator('section[aria-labelledby="featured-deals-heading"]');
    await expect(section.getByText(featured.name, { exact: true }).first()).toBeVisible();
    await expect(section.getByText(ordinary.name, { exact: true })).toHaveCount(0);
    expect(requests.some(query => new URLSearchParams(query).get("featured") === "true")).toBe(true);
    await page.goto("/deals");
    const featuredSection = page.getByRole("region", { name: "Featured packages", exact: true });
    await expect(featuredSection.getByRole("heading", { name: featured.name, exact: true })).toBeVisible();
    await expect(featuredSection.getByRole("heading", { name: ordinary.name, exact: true })).toHaveCount(0);
    const catalog = page.locator("#all-deals");
    await expect(catalog.getByRole("heading", { name: featured.name, exact: true })).toBeVisible();
    await expect(catalog.getByRole("heading", { name: ordinary.name, exact: true })).toBeVisible();
    await expect(catalog.getByText("Whole milk · 1 litre × 2", { exact: true })).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await info.attach(`deals-${width}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });
}

test("package detail shows the full offer and one click expands its checkout quantities", async ({ page }) => {
  await api(page, [featured]);
  await page.goto(`/deals/${featured.slug}`);
  await expect(page.getByRole("heading", { name: featured.name, exact: true })).toBeVisible();
  await expect(page.getByAltText(featured.name)).toBeVisible();
  await expect(page.getByText(featured.description, { exact: true })).toBeVisible();
  await expect(page.getByText("£10.00", { exact: true })).toBeVisible();
  await expect(page.getByText("£8.00", { exact: true })).toBeVisible();
  await expect(page.getByText("You save £2.00", { exact: true })).toBeVisible();
  await expect(page.getByText("1 litre × 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add package to basket", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your Cart", exact: true })).toBeVisible();
  await page.goto("/checkout");
  await page.getByRole("textbox", { name: "First Name" }).fill("Package");
  await page.getByRole("textbox", { name: "Last Name" }).fill("Tester");
  await page.getByRole("textbox", { name: "Email" }).fill("package@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator('input[name="address1"]').fill("1 Test Street");
  await page.locator('input[name="city"]').fill("Bradford");
  await page.locator('input[name="postcode"]').fill("BD1 1AA");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const posted = page.waitForRequest(req => req.method() === "POST" && new URL(req.url()).pathname === "/api/orders");
  await page.getByRole("button", { name: "Place Order - £9.00", exact: true }).click();
  expect((await posted).postDataJSON()).toMatchObject({ items: [{ variantId: "milk-v", quantity: 2 }], deals: [{ dealId: featured.id, quantity: 1, expectedPackagePrice: 8, expectedContents: [{ variantId: "milk-v", quantity: 2 }] }] });
});

for (const width of [390, 1440]) {
  test(`homepage collapses its empty featured column after loading at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await api(page, [ordinary]);
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/deals?**", async route => { await gate; await route.fallback(); });
    await page.goto("/");
    const hero = page.locator('section[aria-labelledby="home-heading"]');
    await expect(hero.getByRole("status", { name: "Loading deals" })).toBeVisible();
    release();
    await expect(hero.getByRole("heading", { name: "Featured Deals", exact: true })).toHaveCount(0);
    await expect(hero.getByRole("status", { name: "Loading deals" })).toHaveCount(0);
    await expect(page.getByTestId("home-hero-layout")).not.toHaveClass(/lg:grid-cols-/);
    expect(await page.getByTestId("home-hero-layout").evaluate(el => el.children.length)).toBe(1);
    await expect(hero.locator("img")).toHaveCount(1);
    await page.screenshot({ path: `test-results/home-no-featured-${width}.png` });
  });
}

test("out-of-stock package details cannot add a package", async ({ page }) => {
  await api(page, [{ ...featured, maxPackages: 0 }]);
  await page.goto(`/deals/${featured.slug}`);
  await expect(page.getByRole("button", { name: "Currently unavailable", exact: true })).toBeDisabled();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("levants-dairy-cart") || "{}"));
  expect(saved.deals || []).toEqual([]);
});

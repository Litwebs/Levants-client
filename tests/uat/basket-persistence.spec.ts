import { expect, test, type Page } from "@playwright/test";

const storageKey = "levants-dairy-cart";

// This uses the real deployed UAT catalogue and API, a fresh unauthenticated
// context, and UI basket actions. It never seeds storage or submits an order.
async function savedBasket(page: Page) {
  return page.evaluate(key => {
    const value = localStorage.getItem(key);
    if (!value) return null;
    const basket = JSON.parse(value);
    return {
      items: basket.items.map((item: { variant?: { id: string }; quantity: number }) => ({
        variantId: item.variant?.id, quantity: item.quantity,
      })),
      deals: basket.deals,
    };
  }, storageKey);
}

async function addTestItem(page: Page) {
  await page.goto("/shop");
  await expect(page.getByText("UAT · Test environment · Payments use Stripe sandbox", { exact: true })).toBeVisible();
  const card = page.locator(".card-product").filter({
    has: page.getByRole("heading", { name: "TEST PRODUCT - Test Variant", exact: true }),
  });
  await expect(card).toHaveCount(1);
  await card.getByRole("button", { name: "Add to basket", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your Cart", exact: true })).toBeVisible();
  await expect.poll(() => savedBasket(page)).toMatchObject({
    items: [{ variantId: "6acaa13714b239b5efd7c64a", quantity: 1 }], deals: [],
  });
}

test("UI-added basket and changed quantity survive checkout reload and a new document", async ({ page, context }, info) => {
  await addTestItem(page);
  await page.getByRole("button", { name: "Increase quantity", exact: true }).last().click();
  const expected = { items: [{ variantId: "6acaa13714b239b5efd7c64a", quantity: 2 }], deals: [] };
  await expect.poll(() => savedBasket(page)).toEqual(expected);
  await page.getByRole("link", { name: "Checkout Securely", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByRole("heading", { name: "Your Details", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your Details", exact: true })).toBeVisible();
  await expect.poll(() => savedBasket(page)).toEqual(expected);

  await page.getByRole("textbox", { name: "First Name", exact: true }).fill("UAT");
  await page.getByRole("textbox", { name: "Last Name", exact: true }).fill("Basket QA");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("basket-qa@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator('input[name="address1"]').fill("1 Test Street");
  await page.locator('input[name="city"]').fill("Bradford");
  await page.locator('input[name="postcode"]').fill("BD5 9HB");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("button", { name: "Place Order - £25.00", exact: true })).toBeEnabled();
  await info.attach("restored-checkout", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });

  const other = await context.newPage();
  await other.goto("/shop");
  await other.getByRole("button", { name: "Cart", exact: true }).click();
  await expect(other.getByRole("heading", { name: "TEST PRODUCT", exact: true })).toBeVisible();
  await expect.poll(() => savedBasket(other)).toEqual(expected);
  await other.close();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Your Details", exact: true })).toBeVisible();
  await expect.poll(() => savedBasket(page)).toEqual(expected);
});

test("removing the UI-added basket stays empty after reload", async ({ page }) => {
  await addTestItem(page);
  await page.getByRole("button", { name: "Remove item", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your cart is empty", exact: true })).toBeVisible();
  await expect.poll(() => savedBasket(page)).toEqual({ items: [], deals: [] });
  await page.reload();
  await page.getByRole("button", { name: "Cart", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your cart is empty", exact: true })).toBeVisible();
  await expect.poll(() => savedBasket(page)).toEqual({ items: [], deals: [] });
});

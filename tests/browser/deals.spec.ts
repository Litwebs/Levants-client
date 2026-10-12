import { expect, test, type Page } from "@playwright/test";
import type { Deal } from "../../src/api/deals";

const names = [
  "Farmhouse breakfast",
  "The dairy essentials",
  "A little weekend indulgence",
  "Milk & honey collection",
  "Family favourites",
  "The cheese selection",
  "A very long package name with fresh farm favourites for all the family",
  "Cream tea collection",
];
const images = [
  "product-milk.jpg",
  "product-butter.jpg",
  "product-cream.jpg",
  "product-honey.jpg",
];
const offers: Deal[] = names.map((name, index) => ({
  id: `deal-${index}`,
  slug: `deal-${index}`,
  name,
  description:
    "A selection of farm-fresh favourites, brought together at a better price.",
  imageUrl: `/src/assets/${images[index % images.length]}`,
  packagePrice: 10,
  originalValue: 15,
  savings: 5,
  savingsPercent: 33,
  currency: "GBP",
  isFeatured: index === 0,
  maxPackages: 5,
  items: ["Whole milk", "Farmhouse butter", "Wildflower honey"].map(
    (product, i) => ({
      variantId: `product-${i}`,
      quantity: 1,
      variant: {
        id: `product-${i}`,
        name: i === 0 ? "1 litre" : "250 g",
        sku: `PRODUCT-${i}`,
        price: 5,
        stockQuantity: 30,
        availableStock: 30,
        thumbnailImage: { url: `/src/assets/${images[i === 2 ? 3 : i]}` },
      },
      product: { id: `product-${i}`, name: product, category: "Dairy" },
    }),
  ),
}));

async function api(page: Page, deals = offers) {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    // Vite also serves source modules under /src/api; only stub API requests.
    if (!url.pathname.startsWith("/api/")) return route.continue();
    if (url.pathname === "/api/deals") {
      return route.fulfill({
        json: {
          success: true,
          data: { deals },
          meta: { page: 1, pageSize: 12, total: deals.length, totalPages: 1 },
        },
      });
    }
    if (url.pathname.startsWith("/api/deals/")) {
      return route.fulfill({
        json: {
          success: true,
          data: {
            deal: deals.find((deal) => url.pathname.endsWith(deal.slug)),
          },
        },
      });
    }
    if (url.pathname === "/api/products") {
      return route.fulfill({
        json: {
          success: true,
          data: {
            items: [
              {
                id: "other",
                name: "Other product",
                category: "Other",
                description: "",
                galleryImages: [],
                variants: [],
                pricing: { min: 5, max: 5 },
              },
            ],
          },
          meta: { categories: [], total: 1, page: 1, totalPages: 1 },
        },
      });
    }
    if (url.pathname.includes("/auth/"))
      return route.fulfill({ status: 401, json: { success: false } });
    return route.fulfill({ json: { success: true, data: {} } });
  });
}
const collection = (page: Page) =>
  page.getByRole("region", { name: "Featured deals", exact: true });
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

for (const width of [
  1440, 1280, 1100, 1024, 900, 768, 640, 600, 430, 390, 375,
]) {
  test(`responsive collections at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await api(page);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().includes("401"))
        errors.push(message.text());
    });
    await page.goto("/deals");
    await expect(page.locator(".deal-card")).toHaveCount(8);
    await expect(page.locator(".deal-card img").first()).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator(".deal-card img")
          .first()
          .evaluate(
            (image: HTMLImageElement) =>
              image.complete && image.naturalWidth > 0,
          ),
      )
      .toBe(true);
    await noOverflow(page);
    const sizes = await page
      .locator(".deal-card")
      .evaluateAll((cards) =>
        cards.map((card) => card.getBoundingClientRect().width),
      );
    expect(Math.max(...sizes)).toBeLessThanOrEqual(384);
    await info.attach(`deals-${width}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
    await page.goto("/");
    await expect(collection(page).locator(".deal-card")).toHaveCount(8);
    await collection(page).scrollIntoViewIfNeeded();
    await noOverflow(page);
    const visibleCards = await collection(page).evaluate((region) => {
      const bounds = region.getBoundingClientRect();
      return Array.from(region.querySelectorAll(".deal-card")).filter(
        (card) => {
          const rect = card.getBoundingClientRect();
          return rect.left < bounds.right - 10 && rect.right > bounds.left + 10;
        },
      ).length;
    });
    expect(visibleCards).toBe(1);
    await expect(
      collection(page).locator(".deal-card").first().getByRole("list"),
    ).toBeVisible();
    await expect(
      collection(page).locator(".deal-card").first().getByRole("listitem"),
    ).toHaveCount(3);
    await page
      .locator('section[aria-labelledby="featured-deals-heading"]')
      .evaluate((section) => {
        const headerHeight =
          document.querySelector("header")?.getBoundingClientRect().height ?? 0;
        window.scrollTo(
          0,
          section.getBoundingClientRect().top + window.scrollY - headerHeight,
        );
      });
    await info.attach(`home-deals-${width}`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  });
}

for (const count of [1, 2, 3, 8]) {
  test(`${count} offers adapt without duplicates or unnecessary controls`, async ({
    page,
  }, info) => {
    await api(page, offers.slice(0, count));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    await expect(collection(page).locator(".deal-card")).toHaveCount(count);
    if (count === 1)
      await expect(
        page.getByRole("button", { name: "Next deals" }),
      ).toHaveCount(0);
    else
      await expect(
        page.getByRole("button", { name: "Next deals" }),
      ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 900 });
    if (count === 1)
      await expect(
        page.getByRole("button", { name: "Next deals" }),
      ).toHaveCount(0);
    else {
      await expect(
        page.getByRole("button", { name: "Next deals" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Next deals" }).click();
      await expect(
        page.getByRole("button", { name: "Previous deals" }),
      ).toBeEnabled();
    }
    await noOverflow(page);
    await page.goto("/deals");
    await expect(page.locator(".deal-card")).toHaveCount(count);
    await noOverflow(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    expect(
      await page
        .locator(".deal-card")
        .first()
        .evaluate((card) => card.getBoundingClientRect().width),
    ).toBeLessThan(320);
    await info.attach(`deals-count-${count}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
}

test("six-second autoplay, pause, hover and keyboard interaction", async ({
  page,
}) => {
  await page.clock.install();
  await api(page);
  await page.goto("/");
  await expect(collection(page).locator(".deal-card")).toHaveCount(8);
  await collection(page).scrollIntoViewIfNeeded();
  const previous = page.getByRole("button", { name: "Previous deals" });
  await expect(previous).toBeDisabled();
  await page.clock.runFor(6500);
  await expect(previous).toBeEnabled();
  await page.getByRole("button", { name: "Pause automatic rotation" }).click();
  await expect(
    page.getByRole("button", { name: "Start automatic rotation" }),
  ).toBeVisible();
  await previous.click();
  await expect(previous).toBeDisabled();
  await page.mouse.move(0, 0);
  await page.clock.runFor(13000);
  await expect(previous).toBeDisabled();
  await page.getByRole("button", { name: "Start automatic rotation" }).click();
  await collection(page).hover();
  await page.clock.runFor(7000);
  await expect(previous).toBeDisabled();
  await page.mouse.move(0, 0);
  await page.clock.runFor(6500);
  await expect(previous).toBeEnabled();
  await collection(page)
    .getByRole("link", { name: offers[0].name, exact: true })
    .focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("button", { name: "Start automatic rotation" }),
  ).toBeVisible();
});

test("reduced motion never autoplays and manual controls still work", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await api(page);
  await page.goto("/");
  await collection(page).scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("button", { name: /automatic rotation/ }),
  ).toHaveCount(0);
  await page.clock.runFor(14000);
  await expect(
    page.getByRole("button", { name: "Previous deals" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Next deals" }).click();
  await expect(
    page.getByRole("button", { name: "Previous deals" }),
  ).toBeEnabled();
});

test("touch swipe changes the visible package", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 850 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await api(page);
  await page.goto("/");
  await collection(page).scrollIntoViewIfNeeded();
  await collection(page)
    .locator(".deal-card img")
    .first()
    .evaluate((image) => {
      const header =
        document.querySelector("header")?.getBoundingClientRect().height ?? 0;
      window.scrollTo({
        top: image.getBoundingClientRect().top + window.scrollY - header - 24,
        behavior: "instant",
      });
    });
  const card = await collection(page)
    .locator(".deal-card img")
    .first()
    .boundingBox();
  if (!card) throw new Error("Missing deal card");
  const cdp = await context.newCDPSession(page);
  const y = card.y + 100;
  expect(
    await page.evaluate(
      ({ x, y }) =>
        Boolean(document.elementFromPoint(x, y)?.closest(".deal-card")),
      { x: 330, y },
    ),
  ).toBe(true);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 330, y }],
  });
  for (const x of [280, 220, 160, 80])
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y }],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(
    page.getByRole("button", { name: "Previous deals" }),
  ).toBeEnabled();
  await context.close();
});

test("package pricing, basket persistence and navigation", async ({ page }) => {
  await api(page);
  await page.goto("/deals");
  const card = page.getByRole("article", { name: offers[0].name });
  await expect(card.getByText("Save 33%", { exact: true })).toBeVisible();
  await expect(card.getByText("£10.00", { exact: true })).toBeVisible();
  await expect(card.locator("del")).toHaveText("£15.00");
  await expect(card.getByText("Save £5.00", { exact: true })).toBeVisible();
  await expect(card.getByText("3 products included")).toBeVisible();
  await card.getByRole("button", { name: "Add package to basket" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("levants-dairy-cart") || "{}")
            .deals?.[0]?.quantity,
      ),
    )
    .toBe(1);
  await page.reload();
  await expect(card.getByText("1 in your basket")).toBeVisible();
  await card.getByRole("button", { name: "Add another package" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("levants-dairy-cart") || "{}")
            .deals?.[0]?.quantity,
      ),
    )
    .toBe(2);
  await page.goto("/");
  await page.getByRole("link", { name: "View all deals" }).click();
  await expect(page).toHaveURL(/\/deals$/);
  await page
    .getByRole("article", { name: offers[0].name })
    .getByRole("link", { name: offers[0].name, exact: true })
    .click();
  await expect(page).toHaveURL(/\/deals\/deal-0$/);
});

test("loading, empty, error retry and failed images", async ({ page }) => {
  await api(page, []);
  await page.route("**/api/deals?*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.fulfill({ json: { success: true, data: { deals: [] } } });
  });
  await page.goto("/deals");
  await expect(
    page.getByRole("status", { name: "Loading deals" }),
  ).toBeVisible();
  await expect(page.getByText("No deals available right now")).toBeVisible();
  await page.goto("/");
  await expect(
    page.getByRole("status", { name: "Loading deals" }),
  ).toBeHidden();
  await expect(collection(page)).toHaveCount(0);
  await page.route("**/api/deals?*", (route) =>
    route.fulfill({ status: 500, json: { message: "private error" } }),
  );
  await page.goto("/deals");
  await expect(page.getByRole("alert")).toContainText("Please try again");
  await expect(page.getByText("private error")).toHaveCount(0);
  await page.route("**/api/deals?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { deals: [{ ...offers[0], imageUrl: "/missing-image.jpg" }] },
      },
    }),
  );
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.locator(".deal-card")).toHaveCount(1);
  await expect(page.locator(".deal-card img")).toHaveCount(0);
});

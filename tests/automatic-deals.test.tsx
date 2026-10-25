import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { CartProvider, useCart } from "@/context/CartContext";
import { basketOfferSignature, buildBasketOrderItems, matchBasketDeals } from "@/lib/basketDeals";
import type { Deal } from "@/api/deals";
import type { Product, ProductVariant } from "@/data/products";
import CheckoutPage from "@/pages/CheckoutPage";

const api = vi.hoisted(() => ({ listDeals: vi.fn(), getDeal: vi.fn(), checkout: vi.fn(), me: vi.fn(), checkPostcode: vi.fn(), info: vi.fn(), error: vi.fn() }));
vi.mock("@/api/deals", () => api);
vi.mock("@/context/Orders/OrdersContext", () => ({ useOrders: () => ({ customer: null, loading: false }) }));
vi.mock("@/lib/portalAuth", () => ({ isPortalLoggedIn: () => true }));
vi.mock("@/api/portalAuth", () => ({ portalAuthApi: { me: api.me } }));
vi.mock("@/api/portalOrders", () => ({ portalOrdersApi: { checkout: api.checkout } }));
vi.mock("@/api/delivery", () => ({ checkDeliveryPostcode: api.checkPostcode }));
vi.mock("sonner", () => ({ toast: { info: api.info, error: api.error } }));
const offer: Deal = {
  id: "offer", slug: "milk-pair", name: "Milk pair", description: "", packagePrice: 8,
  originalValue: 10, savings: 2, savingsPercent: 20, currency: "GBP", isFeatured: false,
  maxPackages: 10,
  items: [{ variantId: "milk", quantity: 2, variant: { id: "milk", name: "Milk", sku: "milk", price: 5, stockQuantity: 20, availableStock: 20 }, product: { id: "p", name: "Milk", category: "Milk" } }],
};
const product: Product = { id: "p", name: "Milk", price: 5, category: "Milk", shortDescription: "", longDescription: "", images: [], stockStatus: "in-stock", badges: [] };
const variant: ProductVariant = { id: "milk", name: "Milk", price: 5, stockStatus: "in-stock", stockQuantity: 20 };
const line = (quantity: number) => ({ product, variant, quantity });
beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
  api.listDeals.mockResolvedValue({ deals: [offer], meta: { totalPages: 1 } });
  api.getDeal.mockResolvedValue(offer);
  api.me.mockResolvedValue({ data: { customer: { _id: "customer-test", firstName: "Test", lastName: "Customer", email: "test@example.com", addresses: [{ line1: "1 Test Road", city: "London", postcode: "SW1A 1AA", isDefault: true }] } } });
  api.checkPostcode.mockResolvedValue({ deliverable: true });
  api.checkout.mockResolvedValue({ data: { orderId: "order-test", paidWithCredit: true } });
});
afterEach(cleanup);

test("complete manual packages receive savings, leftovers retain retail pricing", () => {
  const result = matchBasketDeals([line(5)], [offer], []);
  expect(result.automaticDeals[0].quantity).toBe(2);
  expect(result.automaticSavings).toBe(4);
  expect(25 - result.automaticSavings).toBe(21);
  expect(matchBasketDeals([line(1)], [offer], []).automaticSavings).toBe(0);
});

test("different variants in a package must all be present", () => {
  const mixed: Deal = { ...offer, packagePrice: 9, items: [offer.items[0], { ...offer.items[0], variantId: "honey", quantity: 1, variant: { ...offer.items[0].variant, id: "honey", price: 3 } }] };
  expect(matchBasketDeals([line(2)], [mixed], []).automaticDeals).toHaveLength(0);
  const honey = { product: { ...product, id: "h", price: 3 }, variant: { ...variant, id: "honey", price: 3 }, quantity: 1 };
  expect(matchBasketDeals([line(2), honey], [mixed], []).automaticSavings).toBe(4);
});

test("overlapping offers never discount the same bottle twice", () => {
  const cheaper: Deal = { ...offer, id: "better", packagePrice: 7 };
  const result = matchBasketDeals([line(2)], [offer, cheaper], []);
  expect(result.automaticDeals).toHaveLength(1);
  expect(result.automaticDeals[0].deal.id).toBe("better");
  expect(result.automaticSavings).toBe(3);
});

test("manual and explicit packages share a claim without expanding manual items again", () => {
  const explicit = [{ deal: offer, quantity: 1 }];
  const result = matchBasketDeals([line(2)], [offer], explicit);
  expect(result.checkoutDeals).toHaveLength(1);
  expect(result.checkoutDeals[0].quantity).toBe(2);
  expect(result.automaticSavings).toBe(2);
  expect(buildBasketOrderItems([line(2)], explicit)).toEqual([{ variantId: "milk", quantity: 4 }]);
});

test("expired, future and unavailable offers do not apply", () => {
  for (const change of [{ endsAt: "2000-01-01" }, { startsAt: "2099-01-01" }, { maxPackages: 0 }]) {
    expect(matchBasketDeals([line(2)], [{ ...offer, ...change }], []).automaticSavings).toBe(0);
  }
});

test("stock and API package limits include explicit packages", () => {
  const limited = { ...offer, maxPackages: 1, items: [{ ...offer.items[0], variant: { ...offer.items[0].variant, availableStock: 2 } }] };
  expect(matchBasketDeals([line(2)], [limited], [{ deal: limited, quantity: 1 }]).automaticSavings).toBe(0);
});

test("quote signatures detect price and package-content changes", () => {
  const original = basketOfferSignature([line(4)], [], [offer]);
  expect(basketOfferSignature([line(4)], [], [{ ...offer, packagePrice: 7 }])).not.toBe(original);
  expect(basketOfferSignature([line(4)], [], [{ ...offer, items: [{ ...offer.items[0], quantity: 3 }] }])).not.toBe(original);
});

let basket: ReturnType<typeof useCart>;
function Harness() { basket = useCart(); return <output>{basket.subtotal}</output>; }
test("basket updates discounts automatically when quantities change and refreshes price without manual buttons", async () => {
  render(<CartProvider><Harness /></CartProvider>);
  await act(async () => { await basket.checkOffers(); });
  act(() => basket.addItem(product, variant, 2));
  await waitFor(() => expect(basket.subtotal).toBe(8));
  expect(basket.items[0].quantity).toBe(2);
  act(() => basket.updateQuantity(product.id, 1, variant.id));
  expect(basket.automaticDeals).toHaveLength(0);
  expect(basket.subtotal).toBe(5);
  act(() => basket.updateQuantity(product.id, 2, variant.id));
  api.listDeals.mockResolvedValue({ deals: [{ ...offer, packagePrice: 7 }], meta: { totalPages: 1 } });
  let changed = false;
  await act(async () => { changed = await basket.checkOffers(); });
  expect(changed).toBe(true);
  expect(basket.subtotal).toBe(7);
  await act(async () => { expect(await basket.checkOffers()).toBe(false); });
});

test("offers on later catalogue pages also apply", async () => {
  api.listDeals.mockImplementation(async ({ page }) => ({ deals: page === 2 ? [offer] : [], meta: { totalPages: 2 } }));
  render(<CartProvider><Harness /></CartProvider>);
  await act(async () => { await basket.checkOffers(); });
  act(() => basket.addItem(product, variant, 2));
  expect(basket.subtotal).toBe(8);
  expect(api.listDeals).toHaveBeenCalledWith({ page: 2, pageSize: 100 });
});

async function mountCheckout() {
  localStorage.setItem("levants-dairy-cart", JSON.stringify({ items: [line(2)], deals: [] }));
  render(<MemoryRouter initialEntries={["/checkout"]}><CartProvider><Routes><Route path="/checkout" element={<CheckoutPage />} /><Route path="/checkout/success" element={<p>Order submitted</p>} /></Routes></CartProvider></MemoryRouter>);
  return screen.findByRole("button", { name: "Place Order - £9.00" });
}

test("checkout submits automatic deal claims without adding products a second time", async () => {
  const user = userEvent.setup();
  const submit = await mountCheckout();
  expect(screen.queryByRole("button", { name: /refresh offers|update offers/i })).toBeNull();
  await user.click(submit);
  await screen.findByText("Order submitted");
  expect(api.checkout).toHaveBeenCalledWith(expect.objectContaining({
    items: [{ variantId: "milk", quantity: 2 }],
    deals: [{ dealId: "offer", quantity: 1, expectedPackagePrice: 8, expectedContents: [{ variantId: "milk", quantity: 2 }] }],
    discountCode: undefined,
  }));
});

test("checkout pauses for review when an automatic offer changes, then accepts the reviewed price", async () => {
  const user = userEvent.setup();
  const submit = await mountCheckout();
  api.listDeals.mockResolvedValue({ deals: [{ ...offer, packagePrice: 7 }], meta: { totalPages: 1 } });
  await user.click(submit);
  await waitFor(() => expect(api.info).toHaveBeenCalled());
  expect(api.checkout).not.toHaveBeenCalled();
  await user.click(await screen.findByRole("button", { name: "Place Order - £8.00" }));
  await screen.findByText("Order submitted");
  expect(api.checkout).toHaveBeenCalledWith(expect.objectContaining({ deals: [expect.objectContaining({ expectedPackagePrice: 7 })] }));
});

test("checkout stays retryable without submitting when the offer check is offline", async () => {
  const user = userEvent.setup();
  const submit = await mountCheckout();
  api.listDeals.mockRejectedValue(new Error("Offline"));
  await user.click(submit);
  await waitFor(() => expect(api.error).toHaveBeenCalledWith("Could not check current offers. Please try again."));
  expect(api.checkout).not.toHaveBeenCalled();
  expect((screen.getByRole("button", { name: "Place Order - £9.00" }) as HTMLButtonElement).disabled).toBe(false);
});

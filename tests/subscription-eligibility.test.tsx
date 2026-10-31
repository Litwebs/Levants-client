import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductPage from "@/pages/ProductPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import ShopPage from "@/pages/ShopPage";
const { fetchProducts, fetchProductById, addItem } = vi.hoisted(() => ({ fetchProducts: vi.fn(), fetchProductById: vi.fn(), addItem: vi.fn() }));
const variant = (id: string, name: string, isSubscriptionEligible?: boolean) => ({ id, name, isSubscriptionEligible, price: 5, stockQuantity: 10 });
const products = [
  { id: "mixed", name: "Milk", variants: [variant("mixed-a", "1 litre", true), variant("mixed-b", "500ml", false)] },
  { id: "blocked", name: "Honey", variants: [variant("blocked-v", "Jar", false)] },
  { id: "historical", name: "Eggs", variants: [variant("historical-v", "Box")] },
].map(p => ({ ...p, slug: p.id, category: "Dairy", description: p.name, thumbnailImage: "", galleryImages: [], pricing: { min: 5, max: 5, currency: "gbp" } }));
vi.mock("@/context/Products/ProductsContext", () => ({
  useProducts: () => ({ products, currentProduct: products[0], fetchProductById, meta: { total: 3, totalPages: 1, categories: [] }, loading: false, error: "", fetchProducts }),
}));
vi.mock("@/context/CartContext", () => ({ useCart: () => ({ addItem }) }));
vi.mock("@/components/products/ProductCard", () => ({
  default: ({ product, lockedVariantId }: { product: { name: string; variants: Array<{ id: string; name: string }> }; lockedVariantId?: string }) =>
    <h3>{product.name} {product.variants.find(v => v.id === lockedVariantId)?.name}</h3>,
}));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
test("recurring selector filters individual variants and keeps the eligible sibling of a mixed product", async () => {
  render(<MemoryRouter><ShopPage embedded subscriptionOnly /></MemoryRouter>);
  await waitFor(() => expect(fetchProducts).toHaveBeenCalledWith(expect.objectContaining({ subscriptionEligible: true, subscriptionCards: true })));
  expect(screen.getByRole("heading", { name: "Milk 1 litre" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Eggs Box" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Milk 500ml" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Honey Jar" })).toBeNull();
});
test("ordinary shop continues to offer both eligible and ineligible variants", async () => {
  render(<MemoryRouter><ShopPage /></MemoryRouter>);
  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  expect(screen.getByRole("heading", { name: "Milk 500ml" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Milk 1 litre" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Honey Jar" })).toBeTruthy();
  expect(fetchProducts.mock.calls[0][0].subscriptionEligible).toBeUndefined();
});
test("detail eligibility follows the selected variant, including a subscription deep link", async () => {
  render(<MemoryRouter initialEntries={["/product/mixed?variant=mixed-b&order=subscription"]}>
    <Routes><Route path="/product/:id" element={<ProductPage />} /></Routes>
  </MemoryRouter>);
  await screen.findByText("Available for one-time purchases only.");
  expect(screen.queryByRole("button", { name: "Weekly subscription" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Continue to subscription" })).toBeNull();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /1 litre –/ }));
  expect(screen.getByRole("button", { name: "Weekly subscription" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Continue to subscription" })).toBeTruthy();
  await user.click(screen.getByRole("button", { name: /500ml –/ }));
  await user.click(screen.getByRole("button", { name: "Add to basket" }));
  expect(addItem).toHaveBeenCalledWith(expect.objectContaining({ id: "mixed" }), expect.objectContaining({ id: "mixed-b" }), 1);
});

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductPage from "@/pages/ProductPage";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import ShopPage from "@/pages/ShopPage";
const { fetchProducts, fetchProductById, addItem } = vi.hoisted(() => ({ fetchProducts: vi.fn(), fetchProductById: vi.fn(), addItem: vi.fn() }));
const products = [
  { id: "eligible", name: "Eligible milk", isSubscriptionEligible: true },
  { id: "ordinary", name: "One-time honey", isSubscriptionEligible: false },
  { id: "historical", name: "Historical eggs" },
].map(p => ({ ...p, slug: p.id, category: "Dairy", description: p.name, thumbnailImage: "",
  galleryImages: [], pricing: { min: 5, max: 5, currency: "gbp" },
  variants: [{ id: p.id + "-v", name: "Standard", price: 5, stockQuantity: 10 }] }));
vi.mock("@/context/Products/ProductsContext", () => ({
  useProducts: () => ({ products, currentProduct: products[1], fetchProductById, meta: { total: 3, totalPages: 1, categories: [] }, loading: false, error: "", fetchProducts }),
}));
vi.mock("@/context/CartContext", () => ({ useCart: () => ({ addItem }) }));
vi.mock("@/components/products/ProductCard", () => ({
  default: ({ product }: { product: { name: string } }) => <p>{product.name}</p>,
}));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
test("recurring selector requests eligible catalogue and defensively hides an ineligible response", async () => {
  render(<MemoryRouter><ShopPage embedded subscriptionOnly /></MemoryRouter>);
  await waitFor(() => expect(fetchProducts).toHaveBeenCalledWith(expect.objectContaining({ subscriptionEligible: true })));
  expect(screen.getByText("Eligible milk")).toBeTruthy();
  expect(screen.getByText("Historical eggs")).toBeTruthy();
  expect(screen.queryByText("One-time honey")).toBeNull();
});
test("ordinary shop continues to display subscription-ineligible products", async () => {
  render(<MemoryRouter><ShopPage /></MemoryRouter>);
  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  expect(screen.getByText("One-time honey")).toBeTruthy();
  expect(fetchProducts.mock.calls[0][0].subscriptionEligible).toBeUndefined();
});

test("ineligible product detail offers only a one-time purchase even with a subscription URL", async () => {
  render(<MemoryRouter initialEntries={["/product/ordinary?order=subscription"]}>
    <Routes><Route path="/product/:id" element={<ProductPage />} /></Routes>
  </MemoryRouter>);
  expect(screen.getByText("Available for one-time purchases only.")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Weekly subscription" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Continue to subscription" })).toBeNull();
  await userEvent.setup().click(screen.getByRole("button", { name: "Add to basket" }));
  expect(addItem).toHaveBeenCalledWith(expect.objectContaining({ id: "ordinary" }), expect.objectContaining({ id: "ordinary-v" }), 1);
});

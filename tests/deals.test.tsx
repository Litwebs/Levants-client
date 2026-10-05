import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import DealDetailPage from "@/pages/DealDetailPage";
import { CartProvider, useCart } from "@/context/CartContext";
import DealCard from "@/components/deals/DealCard";
import type { Deal } from "@/api/deals";
import { ApiError } from "@/api/client";

const { getDeal } = vi.hoisted(() => ({ getDeal: vi.fn() }));
vi.mock("@/api/deals", () => ({ getDeal }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const offer: Deal = {
  id: "deal-1",
  name: "Fresh milk offer",
  slug: "fresh-milk",
  description: "Two bottles",
  packagePrice: 8,
  originalValue: 10,
  savings: 2,
  savingsPercent: 20,
  currency: "GBP",
  isFeatured: false,
  maxPackages: 4,
  items: [
    {
      variantId: "variant-1",
      quantity: 2,
      variant: {
        id: "variant-1",
        name: "Whole milk 1L",
        sku: "MILK",
        price: 5,
        stockQuantity: 8,
        availableStock: 8,
      },
      product: { id: "product-1", name: "Whole milk", category: "Milk" },
    },
  ],
};
let basket: ReturnType<typeof useCart>;
function Basket() {
  basket = useCart();
  return (
    <output aria-label="Basket total">{basket.subtotal.toFixed(2)}</output>
  );
}
function mount(deal = offer) {
  return render(
    <MemoryRouter>
      <CartProvider>
        <DealCard deal={deal} />
        <Basket />
      </CartProvider>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
afterEach(cleanup);

describe("customer deals and basket", () => {
  test("a delayed old request cannot replace the newly opened offer", async () => {
    const user = userEvent.setup();
    let resolve!: (value: Deal) => void;
    getDeal.mockReturnValueOnce(
      new Promise<Deal>((done) => {
        resolve = done;
      }),
    );
    getDeal.mockResolvedValueOnce({
      ...offer,
      id: "deal-2",
      slug: "second-offer",
      name: "Second offer",
    });
    render(
      <MemoryRouter initialEntries={["/deals/fresh-milk"]}>
        <CartProvider>
          <Link to="/deals/second-offer">Next offer</Link>
          <Routes>
            <Route path="/deals/:slug" element={<DealDetailPage />} />
          </Routes>
        </CartProvider>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("link", { name: "Next offer" }));
    await screen.findByRole("heading", { name: "Second offer" });
    await act(async () => {
      resolve(offer);
    });
    expect(screen.getByRole("heading", { name: "Second offer" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: offer.name })).toBeNull();
  });
  test("displays real savings and adds package quantities at the offer price", async () => {
    const user = userEvent.setup();
    mount();
    expect(screen.getByText("Save 20%")).toBeTruthy();
    expect(screen.getByText("£8.00")).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Add package to basket" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Add package to basket" }),
    );
    expect(basket.deals[0].quantity).toBe(2);
    expect(screen.getByLabelText("Basket total").textContent).toBe("16.00");
    expect(
      JSON.parse(localStorage.getItem("levants-dairy-cart")!).deals[0].quantity,
    ).toBe(2);
  });
  test("clips package quantity to stock and prevents expired deals being added", async () => {
    mount();
    act(() => basket.addDeal(offer, 100));
    expect(basket.deals[0].quantity).toBe(4);
    act(() =>
      basket.addDeal({
        ...offer,
        id: "expired",
        endsAt: "2020-01-01T00:00:00Z",
      }),
    );
    expect(basket.deals).toHaveLength(1);
    act(() => basket.updateDealQuantity(offer.id, Number.NaN));
    expect(basket.deals[0].quantity).toBe(4);
  });
  test("refreshes changed price and contents while preserving edits made during the request", async () => {
    mount();
    act(() => basket.addDeal(offer, 1));
    let resolve!: (value: Deal) => void;
    getDeal.mockReturnValue(
      new Promise<Deal>((done) => {
        resolve = done;
      }),
    );
    let pending!: Promise<void>;
    act(() => {
      pending = basket.refreshDeals();
    });
    act(() => basket.updateDealQuantity(offer.id, 3));
    await act(async () => {
      resolve({ ...offer, packagePrice: 7, maxPackages: 2 });
      await pending;
    });
    expect(basket.deals[0].quantity).toBe(2);
    expect(basket.subtotal).toBe(14);
  });
  test("removes unavailable offers but retains the basket when the network fails", async () => {
    mount();
    act(() => basket.addDeal(offer));
    getDeal.mockRejectedValue(new Error("Offline"));
    await act(async () => {
      await expect(basket.refreshDeals()).rejects.toThrow("Offline");
    });
    expect(basket.deals).toHaveLength(1);
    getDeal.mockRejectedValue(new ApiError("Deal not found", 404));
    await act(async () => {
      await basket.refreshDeals();
    });
    expect(basket.deals).toHaveLength(0);
  });
  test("restores the old product-only storage format", () => {
    const product = {
      id: "product-1",
      name: "Whole milk",
      price: 5,
      images: [],
      badges: [],
      stockStatus: "in-stock",
      category: "Milk",
      shortDescription: "",
      longDescription: "",
    };
    localStorage.setItem(
      "levants-dairy-cart",
      JSON.stringify([{ product, quantity: 2 }]),
    );
    mount();
    expect(basket.items).toHaveLength(1);
    expect(basket.deals).toHaveLength(0);
    expect(basket.subtotal).toBe(10);
  });
});

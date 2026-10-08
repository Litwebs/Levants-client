import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Deal } from "@/api/deals";
import DealCard from "@/components/deals/DealCard";
import FeaturedDeals from "@/components/deals/FeaturedDeals";
import DealsPage from "@/pages/DealsPage";
import { CartProvider } from "@/context/CartContext";
import { dealPresentation } from "@/components/deals/dealPresentation";

const { listDeals } = vi.hoisted(() => ({ listDeals: vi.fn() }));
vi.mock("@/api/deals", () => ({ listDeals }));
// Layout, gestures and rotation are exercised with real Embla in the browser suite.
vi.mock("@/components/deals/DealsCarousel", () => ({
  default: () => <div>Deal collection</div>,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
const deal: Deal = {
  id: "package",
  slug: "breakfast",
  name: "Breakfast collection",
  description: "Fresh favourites.",
  packagePrice: 8,
  originalValue: 10,
  savings: 2,
  savingsPercent: 20,
  currency: "GBP",
  maxPackages: 1,
  isFeatured: true,
  items: [],
};
function mount(child: React.ReactNode) {
  return render(
    <MemoryRouter>
      <CartProvider>{child}</CartProvider>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
afterEach(cleanup);

describe("honest deal pricing", () => {
  test.each([
    { originalValue: 0 },
    { originalValue: undefined },
    { originalValue: 8 },
    { originalValue: Number.NaN },
    { savings: -1 },
    { savings: 5 },
    { packagePrice: -1 },
    { packagePrice: Number.NaN },
    { packagePrice: Infinity },
  ])("does not advertise invalid savings: %j", (changes) => {
    expect(dealPresentation({ ...deal, ...changes }).saving).toBeNull();
  });
  test("uses supplied savings and the actual currency", () => {
    expect(dealPresentation({ ...deal, currency: "EUR" })).toMatchObject({
      price: "€8.00",
      saving: "€2.00",
      percent: 20,
    });
    expect(
      dealPresentation({ ...deal, savingsPercent: 70 }).percent,
    ).toBeNull();
    expect(dealPresentation({ ...deal, currency: "invalid" }).validPrice).toBe(
      false,
    );
  });
  test("shows basket state and opens it at the inventory limit", () => {
    mount(<DealCard deal={deal} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Add package to basket" }),
    );
    expect(
      screen.getByText("1 in your basket · maximum available"),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "View basket" }));
    expect(
      JSON.parse(localStorage.getItem("levants-dairy-cart")!).deals[0].quantity,
    ).toBe(1);
  });
  test("unavailable and invalid-price cards cannot be added", () => {
    const view = mount(<DealCard deal={{ ...deal, maxPackages: 0 }} />);
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
    view.unmount();
    mount(<DealCard deal={{ ...deal, packagePrice: Number.NaN }} />);
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
    expect(screen.queryByText(/NaN/)).toBeNull();
  });
  test("broken images fall back without losing package content", () => {
    const { container } = mount(
      <DealCard deal={{ ...deal, imageUrl: "broken.jpg" }} />,
    );
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("heading", { name: deal.name })).toBeTruthy();
  });
});

describe("deal collection states", () => {
  test("loading is accessible and resolves to the real response", async () => {
    let finish!: (result: { deals: Deal[] }) => void;
    listDeals.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    mount(<DealsPage />);
    expect(screen.getByRole("status", { name: "Loading deals" })).toBeTruthy();
    await act(async () => finish({ deals: [deal] }));
    expect(screen.getByRole("heading", { name: deal.name })).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });
  test("errors are customer-safe and retry recovers", async () => {
    listDeals.mockRejectedValueOnce(new Error("private database failure"));
    listDeals.mockResolvedValueOnce({ deals: [deal] });
    mount(<DealsPage />);
    await screen.findByRole("alert");
    expect(screen.queryByText(/private database/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByRole("heading", { name: deal.name });
  });
  test("empty Deals links to the shop", async () => {
    listDeals.mockResolvedValue({ deals: [] });
    mount(<DealsPage />);
    await screen.findByText("No deals available right now");
    expect(
      screen
        .getByRole("link", { name: "Browse all products" })
        .getAttribute("href"),
    ).toBe("/shop");
  });
  test.each(["empty", "error"])(
    "Home hides the %s collection",
    async (state) => {
      if (state === "empty") listDeals.mockResolvedValue({ deals: [] });
      else listDeals.mockRejectedValue(new Error("Offline"));
      const view = mount(<FeaturedDeals />);
      await act(async () => {});
      expect(view.container.querySelector("section")).toBeNull();
    },
  );
  test("Home fetches enough offers to rotate and links to Deals", async () => {
    listDeals.mockResolvedValue({ deals: [deal] });
    mount(<FeaturedDeals />);
    await screen.findByText("Deal collection");
    expect(listDeals).toHaveBeenCalledWith({ page: 1, pageSize: 12 });
    expect(
      screen.getByRole("link", { name: "View all deals" }).getAttribute("href"),
    ).toBe("/deals");
  });
});

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { usePromotionPricing } from "@/hooks/usePromotionPricing";
const { quote } = vi.hoisted(() => ({ quote: vi.fn() }));
vi.mock("@/api/promotions", () => ({ quotePromotions: quote }));
let pricing: ReturnType<typeof usePromotionPricing>;
function Harness({ quantity = 1, hasDeals = false }) {
  pricing = usePromotionPricing([{ variantId: "milk", quantity }], hasDeals);
  return <><output>{pricing.promotion?.total ?? "pending"}</output><input aria-label="Code" value={pricing.promotionCode} onChange={e => pricing.setPromotionCode(e.target.value)} /></>;
}
const free = { subtotal: 10, discountAmount: 0, deliveryFee: 0, total: 10, campaign: { id: "free", name: "Weekend", kind: "free_delivery", applicationMode: "automatic", code: null, endsAt: null } };
beforeEach(() => { vi.clearAllMocks(); quote.mockResolvedValue(free); });
afterEach(cleanup);
test("automatic pricing loads from the server and refreshes on quantity changes", async () => {
  const { rerender } = render(<Harness />);
  await screen.findByText("10");
  quote.mockResolvedValueOnce({ ...free, subtotal: 20, total: 20 });
  rerender(<Harness quantity={2} />);
  expect(screen.getByText("pending")).toBeTruthy();
  await screen.findByText("20");
  expect(quote).toHaveBeenLastCalledWith(expect.objectContaining({ items: [{ variantId: "milk", quantity: 2 }] }));
});
test("entered codes are revalidated and removing them restores automatic pricing", async () => {
  const user = userEvent.setup(); render(<Harness />); await screen.findByText("10");
  await user.type(screen.getByLabelText("Code"), "SAVE");
  await waitFor(() => expect(quote).toHaveBeenLastCalledWith(expect.objectContaining({ discountCode: "SAVE" })));
  await user.clear(screen.getByLabelText("Code"));
  await waitFor(() => expect(quote.mock.calls.at(-1)?.[0].discountCode).toBeUndefined());
});
test("stale responses cannot overwrite a changed basket", async () => {
  let release!: (value: typeof free) => void;
  quote.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
  const { rerender } = render(<Harness />);
  await waitFor(() => expect(quote).toHaveBeenCalledTimes(1));
  rerender(<Harness quantity={2} />);
  await screen.findByText("10");
  await act(async () => release({ ...free, total: 999 }));
  expect(screen.queryByText("999")).toBeNull();
});
test("failed pricing is visible and retry recovers", async () => {
  quote.mockRejectedValueOnce(new Error("Offline")); render(<Harness />);
  await waitFor(() => expect(pricing.pricingError).toBe("Offline"));
  expect(pricing.promotion).toBeNull();
  await act(async () => { await pricing.refreshPricing(); });
  expect(pricing.pricingError).toBe(""); expect(pricing.promotion?.deliveryFee).toBe(0);
});
test("package baskets do not combine campaigns or make redundant promotion requests", async () => {
  render(<Harness hasDeals />);
  await act(async () => { await pricing.refreshPricing(); });
  expect(quote).not.toHaveBeenCalled(); expect(pricing.pricingLoading).toBe(false);
});
test("expiry refresh removes a campaign without a reload", async () => {
  quote.mockResolvedValueOnce({ ...free, campaign: { ...free.campaign, endsAt: new Date(Date.now() + 700).toISOString() } })
    .mockResolvedValue({ ...free, campaign: null, deliveryFee: 1, total: 11 });
  render(<Harness />); await screen.findByText("10"); await screen.findByText("11", {}, { timeout: 2000 });
});

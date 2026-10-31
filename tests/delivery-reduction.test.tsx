import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import DeliveryReduction from "@/portal/components/DeliveryReduction";
import DeliveryReductionHistory from "@/portal/components/DeliveryReductionHistory";
import { ApiError } from "@/api/client";
import { clearDeliveryReduction, deliveryReductionKey, readDeliveryReduction } from "@/api/deliveryReductionRetry";
import type { DeliveryReductionQuote, DeliveryReductionResult, PortalSubscriptionDelivery } from "@/api/portalSubscriptions";

const api = vi.hoisted(() => ({ getDeliveryReduction: vi.fn(), previewDeliveryReduction: vi.fn(), confirmDeliveryReduction: vi.fn() }));
vi.mock("@/api/portalSubscriptions", () => ({ portalSubscriptionsApi: api }));
const item = { product: "product", variant: "variant", name: "Whole milk 1 litre", sku: "MILK", unitPrice: 2.5, quantity: 4 };
const delivery: PortalSubscriptionDelivery = { _id: "delivery", scheduledDate: "2035-05-07T08:00:00Z", status: "generated", canChangeThisDelivery: true };
const initial: DeliveryReductionQuote = { deliveryId: delivery._id, scheduledDate: delivery.scheduledDate,
  cutoffAt: "2035-05-05T21:00:00Z", expectedVersion: 3, quoteToken: "a".repeat(64), before: [item], after: [item],
  originalTotalMinor: 1100, revisedTotalMinor: 1100, creditedMinor: 0, deliveryFeeMinor: 100, cancelsDelivery: false, hasChanges: false };
const quote: DeliveryReductionQuote = { ...initial, quoteToken: "b".repeat(64), after: [{ ...item, quantity: 2 }],
  revisedTotalMinor: 600, creditedMinor: 500, hasChanges: true };
const result: DeliveryReductionResult = { deliveryId: delivery._id, creditedMinor: 500, revisedTotalMinor: 600, customerVersion: 4,
  adjustment: { before: quote.before, after: quote.after, originalTotalMinor: 1100, revisedTotalMinor: 600, creditedMinor: 500,
    operationId: "00000000-0000-4000-8000-000000000001", createdAt: "2035-05-01T12:00:00Z", creditTransaction: "credit", cancelsDelivery: false } };
const key = deliveryReductionKey("customer", "subscription", delivery._id);
const onChanged = vi.fn();
function mount(value = delivery, customerId = "customer") {
  return render(<MemoryRouter><DeliveryReduction customerId={customerId} subscriptionId="subscription" delivery={value} onChanged={onChanged} /></MemoryRouter>);
}
async function open() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Change This Delivery Only" }));
  await screen.findByRole("spinbutton", { name: item.name });
  return user;
}
async function reviewChange() {
  const user = await open();
  fireEvent.change(screen.getByRole("spinbutton", { name: item.name }), { target: { value: "2" } });
  await user.click(screen.getByRole("button", { name: "Review change" }));
  await screen.findByRole("button", { name: "Confirm delivery change" });
  return user;
}
beforeEach(() => {
  clearDeliveryReduction(key); sessionStorage.clear(); vi.clearAllMocks();
  api.getDeliveryReduction.mockReset().mockResolvedValue({ success: true, data: initial });
  api.previewDeliveryReduction.mockReset().mockResolvedValue({ success: true, data: quote });
  api.confirmDeliveryReduction.mockReset().mockResolvedValue({ success: true, data: result });
  onChanged.mockReset().mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); clearDeliveryReduction(key); vi.restoreAllMocks(); });

test("only eligible deliveries offer the action; older server responses stay compatible", () => {
  const view = mount({ ...delivery, canChangeThisDelivery: undefined });
  expect(screen.queryByRole("button")).toBeNull();
  view.rerender(<MemoryRouter><DeliveryReduction customerId="customer" subscriptionId="subscription" delivery={{ ...delivery, canChangeThisDelivery: false }} onChanged={onChanged} /></MemoryRouter>);
  expect(screen.queryByRole("button")).toBeNull();
  expect(api.getDeliveryReduction).not.toHaveBeenCalled();
});
test("opening is read-only and unchanged quantities cannot be reviewed", async () => {
  mount(); await open();
  expect(api.getDeliveryReduction).toHaveBeenCalledWith("subscription", "delivery");
  expect(screen.getByRole("button", { name: "Review change" }).hasAttribute("disabled")).toBe(true);
  expect(api.previewDeliveryReduction).not.toHaveBeenCalled(); expect(api.confirmDeliveryReduction).not.toHaveBeenCalled();
});
test.each(["", "-1", "1.5", "5"])("rejects invalid quantity %s without requesting a credit preview", async value => {
  mount(); await open(); fireEvent.change(screen.getByRole("spinbutton", { name: item.name }), { target: { value } });
  expect(screen.getByRole("button", { name: "Review change" }).hasAttribute("disabled")).toBe(true);
  expect(api.previewDeliveryReduction).not.toHaveBeenCalled();
});
test("reviews the selected delivery and uses authoritative prices without confirming", async () => {
  mount(); await reviewChange();
  expect(api.previewDeliveryReduction).toHaveBeenCalledWith("subscription", "delivery", [{ variant: "variant", quantity: 2 }]);
  const region = screen.getByRole("region", { name: "Review delivery change" });
  expect(region.textContent).toContain("£11.00"); expect(region.textContent).toContain("£6.00"); expect(region.textContent).toContain("£5.00");
  expect(api.confirmDeliveryReduction).not.toHaveBeenCalled();
});
test("editing after review discards the previous quote", async () => {
  mount(); await reviewChange();
  fireEvent.change(screen.getByRole("spinbutton", { name: item.name }), { target: { value: "1" } });
  expect(screen.queryByRole("button", { name: "Confirm delivery change" })).toBeNull();
  expect(screen.queryByRole("region", { name: "Review delivery change" })).toBeNull();
});
test("confirmation sends only the reviewed quantities and server quote; updates delivery and credit once", async () => {
  mount(); const user = await reviewChange(); await user.click(screen.getByRole("button", { name: "Confirm delivery change" }));
  await screen.findByRole("heading", { name: "Delivery changed" });
  expect(api.confirmDeliveryReduction).toHaveBeenCalledWith("subscription", "delivery", {
    items: [{ variant: "variant", quantity: 2 }], expectedVersion: 3, quoteToken: quote.quoteToken, operationId: expect.any(String),
  });
  expect(onChanged).toHaveBeenCalledWith(result); expect(readDeliveryReduction(key)).toBeNull();
  expect(screen.getByRole("link", { name: "View store credit and history" }).getAttribute("href")).toBe("/portal/credit");
});
test("double submissions are blocked before React updates the button", async () => {
  let resolve!: (value: unknown) => void;
  api.confirmDeliveryReduction.mockReturnValue(new Promise(done => { resolve = done; }));
  mount(); await reviewChange(); const button = screen.getByRole("button", { name: "Confirm delivery change" });
  fireEvent.click(button); fireEvent.click(button);
  expect(api.confirmDeliveryReduction).toHaveBeenCalledTimes(1);
  resolve({ success: true, data: result }); await screen.findByRole("heading", { name: "Delivery changed" });
});
test("removing every item previews cancellation and return of the eligible fee", async () => {
  api.previewDeliveryReduction.mockResolvedValue({ success: true, data: { ...quote, after: [], revisedTotalMinor: 0, creditedMinor: 1100, deliveryFeeMinor: 0, cancelsDelivery: true } });
  mount(); const user = await open(); await user.click(screen.getByRole("button", { name: "Remove" }));
  await user.click(screen.getByRole("button", { name: "Review change" }));
  await screen.findByText(/this delivery will be cancelled/i);
  expect(api.previewDeliveryReduction).toHaveBeenCalledWith("subscription", "delivery", [{ variant: "variant", quantity: 0 }]);
  expect(screen.getByRole("region", { name: "Review delivery change" }).textContent).toContain("£11.00");
  expect(api.confirmDeliveryReduction).not.toHaveBeenCalled();
});
test("paid add-ons are explained and have no quantity editor in this flow", async () => {
  api.getDeliveryReduction.mockResolvedValue({ success: true, data: { ...initial, originalTotalMinor: 1350, revisedTotalMinor: 1350 } });
  mount(); await open(); expect(screen.getByText("Your paid one-time add-ons stay on this delivery.")).toBeTruthy();
  expect(screen.getAllByRole("spinbutton")).toHaveLength(1);
});
test("a later reduction starts from the adjusted quantity and reviews only the additional credit", async () => {
  api.getDeliveryReduction.mockResolvedValueOnce({ success: true, data: initial }).mockResolvedValue({ success: true,
    data: { ...quote, before: quote.after, originalTotalMinor: 600, creditedMinor: 0, hasChanges: false, expectedVersion: 4 } });
  mount(); const user = await reviewChange(); await user.click(screen.getByRole("button", { name: "Confirm delivery change" }));
  await screen.findByRole("heading", { name: "Delivery changed" }); await user.click(screen.getByRole("button", { name: "Done" }));
  await user.click(screen.getByRole("button", { name: "Change This Delivery Only" }));
  const input = await screen.findByRole("spinbutton"); expect((input as HTMLInputElement).value).toBe("2");
  api.previewDeliveryReduction.mockResolvedValueOnce({ success: true, data: { ...quote, before: quote.after, after: [{ ...item, quantity: 1 }],
    originalTotalMinor: 600, revisedTotalMinor: 350, creditedMinor: 250, expectedVersion: 4 } });
  fireEvent.change(input, { target: { value: "1" } }); await user.click(screen.getByRole("button", { name: "Review change" }));
  await screen.findByRole("button", { name: "Confirm delivery change" });
  expect(screen.getByRole("region", { name: "Review delivery change" }).textContent).toContain("£2.50");
  expect(api.confirmDeliveryReduction).toHaveBeenCalledTimes(1);
});
test("a valid zero-credit reduction can still be confirmed", async () => {
  api.previewDeliveryReduction.mockResolvedValueOnce({ success: true, data: { ...quote, creditedMinor: 0, revisedTotalMinor: 1100 } });
  api.confirmDeliveryReduction.mockResolvedValueOnce({ success: true, data: { ...result, creditedMinor: 0, revisedTotalMinor: 1100 } });
  mount(); const user = await reviewChange(); await user.click(screen.getByRole("button", { name: "Confirm delivery change" }));
  await screen.findByRole("heading", { name: "Delivery changed" }); expect(onChanged).toHaveBeenCalledTimes(1);
});
test.each([new TypeError("Network response lost"), new ApiError("Server unavailable", 503),
  new ApiError("Still processing", 409, { data: { idempotencyInProgress: true } }), new ApiError("Please sign in", 401)])(
  "uncertain confirmation keeps the exact request available after remount: %s", async failure => {
    api.confirmDeliveryReduction.mockRejectedValueOnce(failure);
    const view = mount(); const user = await reviewChange(); await user.click(screen.getByRole("button", { name: "Confirm delivery change" }));
    await screen.findByRole("alert"); const sent = api.confirmDeliveryReduction.mock.calls[0][2];
    expect(readDeliveryReduction(key)?.request).toEqual(sent);
    view.unmount(); mount({ ...delivery, canChangeThisDelivery: false, isPastCutoff: true });
    await user.click(screen.getByRole("button", { name: "Check delivery change" }));
    expect(api.getDeliveryReduction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("spinbutton")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Check result" }));
    await screen.findByRole("heading", { name: "Delivery changed" });
    expect(api.confirmDeliveryReduction.mock.calls[1][2]).toEqual(sent);
    expect(onChanged).toHaveBeenCalledTimes(1);
  });
test.each(["STALE_DELIVERY_QUOTE", "DELIVERY_CUTOFF_PASSED", "DELIVERY_STOCK_RECONCILIATION"])(
  "a definitive %s rejection requires fresh review rather than another automatic confirmation", async code => {
    api.confirmDeliveryReduction.mockRejectedValue(new ApiError("Review current delivery", 409, { data: { code } }));
    mount(); const user = await reviewChange(); await user.click(screen.getByRole("button", { name: "Confirm delivery change" }));
    await screen.findByRole("alert"); expect(readDeliveryReduction(key)).toBeNull();
    expect(screen.queryByRole("button", { name: "Check result" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Reload delivery" }));
    await screen.findByRole("spinbutton"); expect(api.confirmDeliveryReduction).toHaveBeenCalledTimes(1);
    expect(api.getDeliveryReduction).toHaveBeenCalledTimes(2);
  });
test("a malformed success response stays unconfirmed and recoverable", async () => {
  api.confirmDeliveryReduction.mockResolvedValueOnce({ success: true, data: {} });
  mount(); const user = await reviewChange(); await user.click(screen.getByRole("button", { name: "Confirm delivery change" }));
  await screen.findByRole("alert"); expect(readDeliveryReduction(key)).not.toBeNull(); expect(onChanged).not.toHaveBeenCalled();
});
test("a malformed initial response offers reload instead of rendering broken quantities", async () => {
  api.getDeliveryReduction.mockResolvedValueOnce({ success: true, data: { deliveryId: delivery._id } });
  mount(); await userEvent.click(screen.getByRole("button", { name: "Change This Delivery Only" }));
  await screen.findByRole("alert"); expect(screen.getByRole("button", { name: "Reload delivery" })).toBeTruthy();
  expect(api.confirmDeliveryReduction).not.toHaveBeenCalled();
});
test("a malformed preview cannot enable confirmation", async () => {
  api.previewDeliveryReduction.mockResolvedValueOnce({ success: true, data: { deliveryId: delivery._id } });
  mount(); const user = await open(); fireEvent.change(screen.getByRole("spinbutton", { name: item.name }), { target: { value: "2" } });
  await user.click(screen.getByRole("button", { name: "Review change" }));
  await screen.findByRole("alert"); expect(screen.queryByRole("button", { name: "Confirm delivery change" })).toBeNull();
});
test("a failed display refresh cannot reclassify a confirmed change as a failed settlement", async () => {
  onChanged.mockRejectedValue(new Error("refresh unavailable"));
  mount(); const user = await reviewChange(); await user.click(screen.getByRole("button", { name: "Confirm delivery change" }));
  await screen.findByText(/Your change is saved. Refresh the page/);
  expect(screen.getByRole("heading", { name: "Delivery changed" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Check result" })).toBeNull(); expect(readDeliveryReduction(key)).toBeNull();
});
test("a different customer cannot resume the previous customer's browser request", async () => {
  api.confirmDeliveryReduction.mockRejectedValueOnce(new TypeError("lost"));
  const view = mount(); const user = await reviewChange(); await user.click(screen.getByRole("button", { name: "Confirm delivery change" }));
  await screen.findByRole("alert"); view.unmount(); mount({ ...delivery, canChangeThisDelivery: false }, "other-customer");
  expect(screen.queryByRole("button")).toBeNull();
});
test("read failures offer reload, and closing a review never confirms it", async () => {
  api.getDeliveryReduction.mockRejectedValueOnce(new ApiError("Unable to load delivery", 503));
  mount(); const user = userEvent.setup(); await user.click(screen.getByRole("button", { name: "Change This Delivery Only" }));
  await screen.findByRole("alert"); await user.click(screen.getByRole("button", { name: "Reload delivery" }));
  await screen.findByRole("spinbutton"); await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull(); expect(api.confirmDeliveryReduction).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Change This Delivery Only" }));
});
test("a slow read can be dismissed; its stale response cannot overwrite a reopened editor", async () => {
  let resolve!: (value: unknown) => void;
  api.getDeliveryReduction.mockReturnValueOnce(new Promise(done => { resolve = done; }));
  mount(); const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Change This Delivery Only" }));
  await user.keyboard("{Escape}"); expect(screen.queryByRole("dialog")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Change This Delivery Only" }));
  await screen.findByRole("spinbutton");
  resolve({ success: true, data: { ...initial, before: [{ ...item, quantity: 9 }] } });
  await waitFor(() => expect((screen.getByRole("spinbutton") as HTMLInputElement).value).toBe("4"));
});
test("confirmation cannot be dismissed midway, and its reviewed request is already recoverable", async () => {
  let resolve!: (value: unknown) => void;
  api.confirmDeliveryReduction.mockReturnValueOnce(new Promise(done => { resolve = done; }));
  mount(); const user = await reviewChange(); await user.click(screen.getByRole("button", { name: "Confirm delivery change" }));
  expect(readDeliveryReduction(key)).not.toBeNull(); await user.keyboard("{Escape}");
  expect(screen.getByRole("dialog")).toBeTruthy();
  resolve({ success: true, data: result }); await screen.findByRole("heading", { name: "Delivery changed" });
});
test("history shows actual before/after quantities, credit and zero-value cancelled deliveries", () => {
  render(<MemoryRouter><DeliveryReductionHistory changes={[{ ...result.adjustment, after: [], revisedTotalMinor: 0, creditedMinor: 1100, cancelsDelivery: true }]} /></MemoryRouter>);
  const history = screen.getByRole("region", { name: "One-time delivery changes" });
  expect(history.textContent).toContain("Whole milk 1 litre: 4 → 0"); expect(history.textContent).toContain("£11.00 → £0.00");
  expect(history.textContent).toContain("This delivery was cancelled");
});

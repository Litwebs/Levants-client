import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import RecurringPriceNotice from "@/portal/components/RecurringPriceNotice";
afterEach(cleanup);
test("pending changes show old and proposed amounts without promising the next delivery", () => {
  render(<RecurringPriceNotice change={{ status: "queued", previousAmountMinor: 500, nextAmountMinor: 600 }} />);
  expect(screen.getByRole("status").textContent).toContain("from £5.00 to £6.00");
  expect(screen.getByRole("status").textContent).toContain("future unlocked, unbilled period");
  expect(screen.getByRole("status").textContent).toContain("Already paid deliveries keep their original prices");
});
test("provider retry remains visibly pending", () => {
  render(<RecurringPriceNotice change={{ status: "provider_pending", previousAmountMinor: 500, nextAmountMinor: 450 }} />);
  expect(screen.getByRole("status").textContent).toContain("£4.50");
  expect(screen.getByRole("status").textContent).toContain("pending");
});
test("applied changes display the confirmed recurring price", () => {
  render(<RecurringPriceNotice change={{ status: "applied", previousAmountMinor: 500, nextAmountMinor: 600 }} />);
  expect(screen.getByRole("status").textContent).toContain("Updated recurring price: £6.00");
});
test("no change produces no notice", () => {
  const { container } = render(<RecurringPriceNotice change={null} />);
  expect(container.textContent).toBe("");
});

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import DeliveryReductionGuide from "@/portal/components/DeliveryReductionGuide";

afterEach(cleanup);
test("the customer guide starts collapsed and expands without account controls", () => {
  const { container } = render(<DeliveryReductionGuide />);
  const details = container.querySelector("details")!;
  expect(details.open).toBe(false);
  fireEvent.click(screen.getByText("How delivery-only changes work"));
  expect(details.open).toBe(true);
  expect(screen.queryByRole("button")).toBeNull();
  expect(screen.queryByRole("spinbutton")).toBeNull();
  expect(screen.queryByRole("textbox")).toBeNull();
});
test("guide distinguishes a preview, confirmation, recurring plan, paid extras and credit", () => {
  const { container } = render(<DeliveryReductionGuide />);
  const text = container.textContent!;
  for (const copy of ["UK time", "Reviewing does not apply the change", "Future deliveries keep their regular quantities",
    "not a card or cash refund", "Paid one-time add-ons stay unchanged", "eligible delivery fee", "saved prices", "cannot increase quantities"])
    expect(text).toContain(copy);
});
test("guide explains recovery after cut-off and eligibility without promising an unsupported change", () => {
  const { container } = render(<DeliveryReductionGuide />);
  const text = container.textContent!;
  for (const copy of ["Check delivery change", "Check result", "same saved request", "including after the cut-off",
    "Do not start a replacement", "Unpaid forecasts", "stock reconciliation", "reload it and review", "may be blocked"])
    expect(text).toContain(copy);
});

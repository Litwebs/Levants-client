import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, test } from "vitest";
import DeliveryReductionGuide from "@/portal/components/DeliveryReductionGuide";
import SubscriptionGuidePage from "@/portal/pages/SubscriptionGuidePage";

afterEach(cleanup);
test("delivery help links to the dedicated one-delivery guide without account controls", () => {
  render(<MemoryRouter><DeliveryReductionGuide /></MemoryRouter>);
  expect(screen.getByRole("link", { name: "How delivery-only changes work" }).getAttribute("href")).toBe("/portal/subscription-guide#one-delivery");
  expect(screen.queryByRole("spinbutton")).toBeNull();
  expect(screen.queryByRole("textbox")).toBeNull();
});
test("the one-delivery guide explains credit, retained extras and confirmation without changing an order", () => {
  render(<MemoryRouter initialEntries={["/portal/subscription-guide#one-delivery"]}><SubscriptionGuidePage /></MemoryRouter>);
  expect(screen.getByRole("heading", { name: "1. Open the delivery" })).toBeTruthy();
  expect(screen.getByText(/Any credit stays in your account; paid extras stay unchanged/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Next", exact: true }));
  expect(screen.getByRole("heading", { name: "2. Reduce or remove items" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Next", exact: true }));
  expect(screen.getByRole("heading", { name: "3. Review and confirm" })).toBeTruthy();
  expect(screen.getByText("Tap Review change. Check the credit, then Confirm delivery change.")).toBeTruthy();
  expect(screen.queryByRole("spinbutton")).toBeNull();
});
test("help retains interrupted-change guidance and offers a route to support", () => {
  render(<MemoryRouter><SubscriptionGuidePage /></MemoryRouter>);
  expect(screen.getByText(/use Check result before trying again/)).toBeTruthy();
  expect(screen.getByRole("link", { name: "Contact the dairy" }).getAttribute("href")).toBe("/contact");
});

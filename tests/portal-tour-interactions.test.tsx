import React from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { PortalTourButton, PortalTourProvider } from "@/portal/tours/PortalTour";

beforeEach(() => {
  const rect = { top: 100, bottom: 150, left: 100, right: 300, width: 200, height: 50, x: 100, y: 100, toJSON: () => ({}) };
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(rect);
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear(); });

function Fixture({ customerId, ready = true, routeKey = "dashboard", mutate = () => {} }: { customerId: string; ready?: boolean; routeKey?: string; mutate?: () => void }) {
  return <PortalTourProvider customerId={customerId} routeKey={routeKey}>
    <PortalTourButton />
    <section data-tour-page="dashboard" data-tour-ready={ready}>
      <h1>Dashboard</h1>
      <input aria-label="Unsaved value" defaultValue="Keep this draft" />
      <div data-tour="dashboard-summary">Summary</div>
      <div data-tour="dashboard-subscriptions">Subscriptions</div>
      <button data-tour="new-subscription" onClick={mutate}>Create a real subscription</button>
    </section>
  </PortalTourProvider>;
}

test("auto tour supports Back, Skip and replay without invoking real actions or changing inputs", async () => {
  const user = userEvent.setup();
  const mutate = vi.fn();
  render(<Fixture customerId="unit-interactions" mutate={mutate} />);
  await screen.findByRole("dialog");
  let dialog = within(screen.getByRole("dialog"));
  expect(dialog.getByRole("heading").textContent).toBe("Your account at a glance");
  await user.click(dialog.getByRole("button", { name: "Next", exact: true }));
  expect(dialog.getByRole("heading").textContent).toBe("Account summary");
  await user.click(dialog.getByRole("button", { name: "Back", exact: true }));
  expect(dialog.getByRole("heading").textContent).toBe("Your account at a glance");
  await user.click(dialog.getByRole("button", { name: "Skip", exact: true }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(localStorage.getItem("levants:portal-tour:v1:unit-interactions:dashboard")).toBe("seen");
  await user.click(screen.getByRole("button", { name: "Take a tour", exact: true }));
  dialog = within(screen.getByRole("dialog"));
  for (let i = 0; i < 3; i++) await user.click(dialog.getByRole("button", { name: "Next", exact: true }));
  await user.click(dialog.getByRole("button", { name: "Finish", exact: true }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(mutate).not.toHaveBeenCalled();
  expect((screen.getByRole("textbox", { name: "Unsaved value" }) as HTMLInputElement).value).toBe("Keep this draft");
});

test("delayed page readiness gates auto tours and replay", async () => {
  const { rerender } = render(<Fixture customerId="unit-loading" ready={false} />);
  expect(screen.getByRole("button", { name: "Take a tour", exact: true }).hasAttribute("disabled")).toBe(true);
  expect(screen.queryByRole("dialog")).toBeNull();
  rerender(<Fixture customerId="unit-loading" ready />);
  await screen.findByRole("dialog");
});

test("Escape dismisses the tour and restores focus to its replay button", async () => {
  const user = userEvent.setup();
  render(<Fixture customerId="unit-escape" />);
  await screen.findByRole("dialog");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Take a tour", exact: true }));
});

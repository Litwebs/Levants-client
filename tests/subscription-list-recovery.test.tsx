import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import SubscriptionsPage from "@/portal/pages/SubscriptionsPage";

const { list } = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("@/api/portalSubscriptions", () => ({ portalSubscriptionsApi: { list } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

test("a failed subscription read shows retry without claiming that saved plans are empty", async () => {
  list.mockRejectedValueOnce(new Error("temporary read failure"))
    .mockResolvedValueOnce({ data: { subscriptions: [] } });
  render(<MemoryRouter><SubscriptionsPage /></MemoryRouter>);
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", expect.stringContaining("Your saved subscriptions have not been changed."));
  expect(screen.queryByText("No active subscriptions")).toBeNull();
  await userEvent.setup().click(screen.getByRole("button", { name: "Retry loading" }));
  await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
  expect(await screen.findByText("No active subscriptions")).toBeTruthy();
});

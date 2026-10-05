import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import AddressesPage from "@/portal/pages/AddressesPage";

const { updateAddress } = vi.hoisted(() => ({
  updateAddress: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/portal/context/AddressesContext", () => ({
  useAddresses: () => ({
    addresses: [
      {
        _id: "address-1",
        fullName: "Customer",
        line1: "1 Dairy Lane",
        city: "Bradford",
        postcode: "BD5 0AL",
        country: "United Kingdom",
        isDefault: true,
      },
    ],
    loading: false,
    formLoading: false,
    error: null,
    fetchAddresses: vi.fn(),
    updateAddress,
    createAddress: vi.fn(),
    deleteAddress: vi.fn(),
    setDefaultAddress: vi.fn(),
  }),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
test("editing an address preserves its default flag and submits checkbox changes", async () => {
  const user = userEvent.setup();
  render(<AddressesPage />);
  await user.click(screen.getByRole("button", { name: "Edit address" }));
  const checkbox = screen.getByRole("checkbox", {
    name: "Set as default delivery address",
  });
  expect(checkbox.getAttribute("aria-checked")).toBe("true");
  await user.click(screen.getByRole("button", { name: "Save Address" }));
  expect(updateAddress).toHaveBeenCalledWith(
    "address-1",
    expect.objectContaining({ isDefault: true }),
  );
  await user.click(screen.getByRole("button", { name: "Edit address" }));
  await user.click(
    screen.getByRole("checkbox", { name: "Set as default delivery address" }),
  );
  await user.click(screen.getByRole("button", { name: "Save Address" }));
  expect(updateAddress).toHaveBeenLastCalledWith(
    "address-1",
    expect.objectContaining({ isDefault: false }),
  );
});

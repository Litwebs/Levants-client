import { expect, test } from "vitest";
import { deliveryFeesForDraft } from "@/portal/utils/subscriptionDraftPricing";

test("an unsaved empty delivery day does not add a delivery fee to the draft", () => {
  expect(deliveryFeesForDraft([0, 6], 1)).toBe(1);
  expect(deliveryFeesForDraft([0, 0], 1)).toBe(0);
  expect(deliveryFeesForDraft([6, 6], 1)).toBe(2);
});

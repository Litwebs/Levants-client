import { test } from "node:test";
import assert from "node:assert/strict";
import { recurringItemPaymentMessage as message } from "../src/portal/utils/recurringItemPaymentMessage.ts";

test("unpaid detail banner never promises an immediate charge", () => {
  const result = message("unpaid", false);
  assert.match(result, /unpaid delivery invoice is updated/);
  assert.match(result, /No separate payment is taken when you save/);
  assert.doesNotMatch(result, /charged to your card/);
});
test("unpaid add-product preview does not promise to charge the selected amount", () => {
  const result = message("unpaid", false, "£6.00");
  assert.match(result, /No separate payment/);
  assert.doesNotMatch(result, /£6.00.*charged/);
});
test("unpaid reductions explain that they issue neither refunds nor credit", () => {
  assert.match(message("unpaid", false), /reductions do not issue a refund or store credit/);
});
test("paid additions retain the correct immediate settlement explanation", () => {
  assert.match(message("paid", false, "£6.00"), /extra £6.00 is charged to your card when you save because this delivery is already paid/);
});
test("paid detail banner retains the refund choice explanation", () => {
  assert.match(message("paid", false), /reductions use your refund or credit choice/);
});
test("cut-off takes precedence over either payment state", () => {
  for (const state of ["paid", "unpaid", undefined]) {
    const result = message(state, true, "£12.00");
    assert.match(result, /after the locked delivery/);
    assert.match(result, /No payment is taken now/);
    assert.doesNotMatch(result, /is charged/);
  }
});
test("unknown state never makes an unconditional payment promise", () => {
  assert.match(message(undefined, false), /For a paid delivery/);
  assert.match(message(undefined, false), /For an unpaid delivery/);
});
test("mixed days can describe paid and unpaid settlement independently", () => {
  assert.match(message("paid", false, "£12.00"), /£12.00 is charged/);
  assert.match(message("unpaid", false, "£6.00"), /No separate payment/);
});

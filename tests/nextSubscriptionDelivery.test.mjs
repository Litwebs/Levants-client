import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(
  readFileSync(new URL("../src/portal/utils/nextSubscriptionDelivery.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
const exports = {};
vm.runInNewContext(source, { exports });
const { getNextSubscriptionDelivery, getNextSubscriptionDeliveryDate } = exports;
const subscription = { status: "active", upcomingDeliveryDate: "2026-10-21T00:00:00.000Z", nextDeliveryDate: "2026-10-14" };
const cancelledAddOn = { _id: "refunded", status: "cancelled", scheduledDate: "2026-10-14", addOns: [{ amountMinor: 1200 }] };
const next = { _id: "next", status: "scheduled", scheduledDate: "2026-10-21", addOns: [] };

test("resumed subscription uses its outstanding delivery, not a refunded add-on slot", () => {
  assert.equal(getNextSubscriptionDelivery(subscription, [cancelledAddOn, next]), next);
  assert.equal(getNextSubscriptionDeliveryDate(subscription), subscription.upcomingDeliveryDate);
});

test("cancelled subscription has no next delivery even with stale billing metadata", () => {
  const cancelled = { ...subscription, status: "cancelled" };
  assert.equal(getNextSubscriptionDeliveryDate(cancelled), null);
  assert.equal(getNextSubscriptionDelivery(cancelled, [next, cancelledAddOn]), null);
});

test("explicitly absent outstanding delivery does not fall back to a billing date", () => {
  const empty = { ...subscription, upcomingDeliveryDate: null };
  assert.equal(getNextSubscriptionDeliveryDate(empty), null);
  assert.equal(getNextSubscriptionDelivery(empty, [next]), null);
});

test("legacy response can match a generated delivery using its billing date", () => {
  const legacy = { status: "active", nextDeliveryDate: "2026-10-21" };
  const generated = { ...next, status: "generated" };
  assert.equal(getNextSubscriptionDelivery(legacy, [cancelledAddOn, generated]), generated);
});

test("missing paginated slot and terminal slots cannot supply next-delivery add-ons", () => {
  assert.equal(getNextSubscriptionDelivery(subscription, [cancelledAddOn]), null);
  for (const status of ["cancelled", "skipped", "delivered", "failed"]) {
    assert.equal(getNextSubscriptionDelivery(subscription, [{ ...next, status }]), null);
  }
});

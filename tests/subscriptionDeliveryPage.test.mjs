import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const source = ts.transpileModule(readFileSync(new URL("../src/api/subscriptionDeliveryPage.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {}; vm.runInNewContext(source, { exports });
const select = exports.selectSubscriptionDeliveryPage;
function fixture(total = 1000) {
  const reads = [];
  const page = number => ({ deliveries: Array.from({ length: Math.min(10, total - (number - 1) * 10) }, (_, offset) => ({
    _id: String((number - 1) * 10 + offset), scheduledDate: new Date(Date.UTC(2030, 0, (number - 1) * 10 + offset + 1)).toISOString(), status: "scheduled",
  })), meta: { page: number, pageSize: 10, total } });
  return { reads, page, read: async number => { reads.push(number); return page(number); } };
}
test("locates an upcoming delivery beyond the first page with a bounded binary search", async () => {
  const f = fixture(); const result = await select(f.page(1), f.page(87).deliveries[2].scheduledDate, f.read);
  assert.equal(result.meta.page, 87); assert.ok(f.reads.length <= 8); assert.ok(!f.reads.includes(1));
});
test("the first page containing the date wins at a page boundary", async () => {
  const f = fixture(21); const result = await select(f.page(1), f.page(2).deliveries[0].scheduledDate, f.read);
  assert.equal(result.meta.page, 2);
});
test("explicit older/newer navigation and refresh preserve the selected page", async () => {
  const f = fixture(); assert.equal((await select(f.page(1), "2035-01-01", f.read, 8)).meta.page, 8);
  assert.deepEqual(f.reads, [8]);
});
test("a single page or a missing legacy date needs no extra request", async () => {
  const f = fixture(3); assert.equal((await select(f.page(1), f.page(1).deliveries[0].scheduledDate, f.read)).meta.page, 1);
  assert.equal((await select(f.page(1), null, f.read)).meta.page, 1); assert.deepEqual(f.reads, []);
});
test("a date beyond retained history falls back to the latest page", async () => {
  const f = fixture(21); assert.equal((await select(f.page(1), "2099-01-01", f.read)).meta.page, 3);
});
test("navigation is clamped when the number of pages changes", async () => {
  const f = fixture(21); assert.equal((await select(f.page(1), null, f.read, 99)).meta.page, 3);
});

const findAddOn = exports.findSubscriptionAddOnDelivery;

test("add-ons find the upcoming delivery after a long history", async () => {
  const f = fixture(35);
  const result = await findAddOn(f.page(1), f.read, new Date("2030-01-25T20:00:00Z"));
  assert.equal(result?._id, "24");
  assert.ok(!f.reads.includes(1));
});

test("add-on recovery uses the original delivery on a later page", async () => {
  const f = fixture(35);
  const pending = { deliveryId: "21", deliveryDate: "2030-01-22T00:00:00Z" };
  assert.equal((await findAddOn(f.page(1), f.read, new Date("2030-01-25T20:00:00Z"), "Europe/London", pending))?._id, "21");
  assert.equal(await findAddOn(f.page(1), f.read, new Date("2030-01-25T20:00:00Z"), "Europe/London", { ...pending, deliveryId: "missing" }), null);
});

test("add-ons keep a delivery at UK midnight during British Summer Time", async () => {
  const deliveries = [{ _id: "today", scheduledDate: "2026-07-11T23:00:00Z", status: "scheduled" }];
  const first = { deliveries, meta: { page: 1, pageSize: 20, total: 1 } };
  const result = await findAddOn(first, async () => assert.fail("No extra page expected"), new Date("2026-07-12T09:00:00Z"));
  assert.equal(result?._id, "today");
});

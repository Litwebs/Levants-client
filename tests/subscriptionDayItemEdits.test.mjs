import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const source = ts.transpileModule(readFileSync(new URL("../src/api/subscriptionDayItemEdits.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
vm.runInNewContext(source, { exports });
const { saveDeliveryDayItemEdits, needsItemRefundChoice } = exports;
const baseline = [0, 3].map(day => ({ day, items: [{ variantId: "milk", quantity: 1 }] }));
const requested = baseline.map(plan => ({ ...plan, items: [{ variantId: "milk", quantity: 2 }] }));
test("mixed paid/unpaid days receive separate operations with successive versions", async () => {
  const sent = [];
  const applied = [];
  await saveDeliveryDayItemEdits({ baseline, requested, changedDays: [3, 0], expectedVersion: 4,
    send: async payload => { sent.push(payload); return { success: true, data: { subscription: { customerVersion: payload.expectedVersion + 1 } } }; },
    onApplied: result => applied.push(result) });
  assert.deepEqual(JSON.parse(JSON.stringify(sent.map(p => p.changedDeliveryDays))), [[0], [3]]);
  assert.equal(sent[0].deliveryDayPlans[1].items[0].quantity, 1);
  assert.equal(sent[1].deliveryDayPlans[0].items[0].quantity, 2);
  assert.deepEqual(sent.map(p => p.expectedVersion), [4, 5]);
  assert.equal(applied.length, 2);
});
test("an uncertain day stops the batch and reports earlier accepted days", async () => {
  const sent = [];
  await assert.rejects(saveDeliveryDayItemEdits({ baseline, requested, changedDays: [0, 3], expectedVersion: 4,
    send: async payload => { sent.push(payload); if (sent.length === 2) throw Error("payment uncertain");
      return { success: true, data: { subscription: { customerVersion: 5 } } }; },
    onApplied: () => {} }), error => {
      assert.equal(error.completedDays.length, 1);
      assert.match(error.message, /payment uncertain/);
      return true;
    });
  assert.equal(sent.length, 2);
});
test("unpaid reductions never ask for refunds; paid reductions retain the choice", () => {
  assert.equal(needsItemRefundChoice("unpaid", false, -12), false);
  assert.equal(needsItemRefundChoice("paid", false, -12), true);
  assert.equal(needsItemRefundChoice(undefined, false, -12), true);
  assert.equal(needsItemRefundChoice("paid", true, -12), false);
  assert.equal(needsItemRefundChoice("paid", false, 12), false);
});

test("paid days can retain one aggregate settlement after the unpaid group", async () => {
  const baseline = [0, 3, 5].map(day => ({ day, items: [{ variantId: "milk", quantity: 1 }] }));
  const requested = baseline.map(plan => ({ ...plan, items: [{ variantId: "milk", quantity: 2 }] }));
  const sent = [];
  await saveDeliveryDayItemEdits({ baseline, requested, changedDays: [0, 3, 5], groups: [[0], [3, 5]], expectedVersion: 1,
    send: async payload => { sent.push(payload); return { success: true, data: { subscription: { customerVersion: payload.expectedVersion + 1 } } }; },
    onApplied: () => {} });
  assert.equal(sent.length, 2);
  assert.deepEqual(sent[1].changedDeliveryDays, [3, 5]);
  assert.equal(sent[0].deliveryDayPlans[1].items[0].quantity, 1);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(readFileSync(new URL("../src/api/deliveryReductionRetry.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const item = { product: "p", variant: "v", name: "Milk", sku: "MILK", quantity: 4, unitPrice: 2.5 };
const pending = () => ({ quote: { deliveryId: "delivery", scheduledDate: "2035-05-07T08:00:00Z", cutoffAt: "2035-05-05T21:00:00Z",
  expectedVersion: 3, quoteToken: "b".repeat(64), before: [item], after: [{ ...item, quantity: 2 }], originalTotalMinor: 1100,
  revisedTotalMinor: 600, creditedMinor: 500, deliveryFeeMinor: 100, cancelsDelivery: false, hasChanges: true },
request: { operationId: "00000000-0000-4000-8000-000000000001", expectedVersion: 3, quoteToken: "b".repeat(64), items: [{ variant: "v", quantity: 2 }] } });

function load(storage = new Map(), disabled = false) {
  const exports = {};
  vm.runInNewContext(source, { exports, sessionStorage: {
    getItem: key => { if (disabled) throw Error("restricted"); return storage.get(key); },
    setItem: (key, value) => { if (disabled) throw Error("restricted"); storage.set(key, value); },
    removeItem: key => { if (disabled) throw Error("restricted"); storage.delete(key); },
  } });
  return exports;
}
test("reload recovers the exact reviewed request, quote and operation ID", () => {
  const storage = new Map(); const api = load(storage); const key = api.deliveryReductionKey("customer", "subscription", "delivery");
  api.saveDeliveryReduction(key, pending());
  assert.deepEqual(JSON.parse(JSON.stringify(load(storage).readDeliveryReduction(key))), pending());
});
test("customer, subscription and delivery each scope the pending confirmation", () => {
  const storage = new Map(); const api = load(storage); const key = api.deliveryReductionKey("customer", "subscription", "delivery");
  api.saveDeliveryReduction(key, pending()); const recovered = load(storage);
  for (const ids of [["other", "subscription", "delivery"], ["customer", "other", "delivery"], ["customer", "subscription", "other"]]) {
    assert.equal(recovered.readDeliveryReduction(recovered.deliveryReductionKey(...ids)), null);
  }
});
test("restricted storage retains recovery in memory and clears it after success", () => {
  const api = load(new Map(), true); const key = api.deliveryReductionKey("customer", "subscription", "delivery");
  api.saveDeliveryReduction(key, pending()); assert.deepEqual(api.readDeliveryReduction(key), pending());
  api.clearDeliveryReduction(key); assert.equal(api.readDeliveryReduction(key), null);
});
test("a successful clear also removes the pending request across reloads", () => {
  const storage = new Map(); const api = load(storage); const key = api.deliveryReductionKey("customer", "subscription", "delivery");
  api.saveDeliveryReduction(key, pending()); api.clearDeliveryReduction(key);
  assert.equal(storage.size, 0); assert.equal(load(storage).readDeliveryReduction(key), null);
});
test("malformed storage is ignored without crashing the customer screen", () => {
  for (const value of ["not-json", "null", "{}", JSON.stringify({ request: null, quote: { before: [] } }),
    JSON.stringify({ ...pending(), quote: { ...pending().quote, before: [null] } }),
    JSON.stringify({ ...pending(), request: { ...pending().request, expectedVersion: 20 } }),
    JSON.stringify({ ...pending(), quote: { ...pending().quote, creditedMinor: "500" } })]) {
    const storage = new Map([["key", value]]); assert.equal(load(storage).readDeliveryReduction("key"), null);
  }
});

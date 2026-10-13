import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = ts.transpileModule(readFileSync(new URL('../src/api/subscriptionAddOnRetry.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function load(storage = new Map(), blocked = false) {
  const exports = {};
  vm.runInNewContext(source, { exports, sessionStorage: {
    getItem: key => storage.get(key),
    setItem: (key, value) => { if (blocked) throw Error('storage unavailable'); storage.set(key, value); },
    removeItem: key => storage.delete(key),
  } });
  return exports;
}
const pending = { operationId: 'original', deliveryId: 'sunday', deliveryDate: '2026-10-11',
  items: [{ variantId: 'eggs', productName: 'Eggs', variantName: 'Box', unitPrice: 3, quantity: 2 }] };
test('reload restores the exact operation, delivery and selected quantities', () => {
  const storage = new Map();
  load(storage).savePendingAddOn('sub', pending);
  assert.equal(JSON.stringify(load(storage).readPendingAddOn('sub')), JSON.stringify(pending));
  assert.equal(load(storage).readPendingAddOn('other-sub'), null);
});
test('only confirmed unpaid outcomes allow replacing a purchase ID', () => {
  const api = load();
  for (const outcome of ['unknown', undefined, 'processing']) {
    assert.equal(api.canReplaceAddOnAttempt({ data: { paymentOutcome: outcome } }), false);
  }
  for (const outcome of ['declined', 'not_started']) {
    assert.equal(api.canReplaceAddOnAttempt({ data: { paymentOutcome: outcome } }), true);
  }
  assert.equal(api.canReplaceAddOnAttempt(null), false);
});
test('clearing a confirmed purchase permits a new purchase', () => {
  const api = load(); api.savePendingAddOn('sub', pending); api.clearPendingAddOn('sub');
  assert.equal(api.readPendingAddOn('sub'), null);
});
test('unavailable storage fails before a payment request can be sent', () => {
  assert.throws(() => load(new Map(), true).savePendingAddOn('sub', pending), /storage unavailable/);
});
test('invalid saved state cannot silently become a new payment operation', () => {
  const api = load(new Map([['portal:add-on-purchase:sub', '{}']]));
  assert.throws(() => api.readPendingAddOn('sub'), /support review/);
});

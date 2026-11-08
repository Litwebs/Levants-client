import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../src/portal/pages/NewSubscriptionPage.tsx", import.meta.url), "utf8");
const start = source.indexOf("// Load a fresh SetupIntent");
const end = source.indexOf("// Fetch addresses", start);
const effect = source.slice(start, end);
const flush = () => new Promise(resolve => setImmediate(resolve));

function mount(overrides = {}) {
  const state = {};
  let cleanup;
  const context = {
    showNewForm: false, savedMethods: [], methodsLoading: false,
    step: 4, steps: Array(5), setupClientSecret: null, setupAttempt: 0,
    portalPaymentsApi: { createSetupIntent: async () => ({
      success: true, data: { publishableKey: "pk_test_fixture", clientSecret: "fixture" },
    }) },
    loadStripe: async () => ({ ready: true }),
    ...overrides,
    useEffect: callback => { cleanup = callback(); },
    setSetupLoading: value => { state.loading = value; },
    setSetupError: value => { state.error = value; },
    setStripePromise: value => { state.stripe = value; },
    setSetupClientSecret: value => { state.secret = value; },
  };
  vm.runInNewContext(effect, context);
  return { state, unmount: () => cleanup?.() };
}

test("setup waits for saved payment methods before requesting a new session", async () => {
  let calls = 0;
  mount({ methodsLoading: true, portalPaymentsApi: { createSetupIntent: async () => { calls++; } } });
  await flush();
  assert.equal(calls, 0);
});
test("network failure exposes a recoverable error and a fresh attempt can load", async () => {
  const failed = mount({ portalPaymentsApi: { createSetupIntent: async () => { throw new TypeError("Failed to fetch"); } } });
  await flush();
  assert.match(failed.state.error, /Please try again/);
  assert.equal(failed.state.loading, false);
  assert.equal(failed.state.secret, null);
  const retry = mount({ setupAttempt: 1 });
  await flush();
  assert.equal(retry.state.error, null);
  assert.equal(retry.state.secret, "fixture");
  assert.equal(retry.state.loading, false);
});
test("an unsuccessful response cannot initialize the form", async () => {
  const result = mount({ portalPaymentsApi: { createSetupIntent: async () => ({
    success: false, data: { publishableKey: "pk_test_fixture", clientSecret: "fixture" },
  }) } });
  await flush();
  assert.ok(result.state.error);
  assert.equal(result.state.secret, null);
});
test("Stripe rejection and unavailable Stripe both expose retry instead of a blank form", async () => {
  for (const loadStripe of [async () => { throw new Error("Blocked"); }, async () => null]) {
    const result = mount({ loadStripe });
    await flush();
    assert.ok(result.state.error);
    assert.equal(result.state.loading, false);
    assert.equal(result.state.stripe, null);
  }
});
test("an obsolete request cannot overwrite the payment form", async () => {
  let resolve;
  const result = mount({ loadStripe: () => new Promise(done => { resolve = done; }) });
  await flush();
  result.unmount();
  resolve({ ready: true });
  await flush();
  assert.equal(result.state.secret, undefined);
  assert.equal(result.state.stripe, undefined);
});

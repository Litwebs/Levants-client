import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import vm from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(readFileSync(new URL("../src/api/subscriptionMutationRetry.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function load(storage = new Map(), disabled = false) {
  const exports = {};
  vm.runInNewContext(source, { exports, crypto: { randomUUID }, sessionStorage: {
    get length() { return storage.size; },
    key: index => [...storage.keys()][index],
    getItem: key => { if (disabled) throw Error("restricted"); return storage.get(key); },
    setItem: (key, value) => { if (disabled) throw Error("restricted"); storage.set(key, value); },
    removeItem: key => storage.delete(key),
  } });
  return exports.withSubscriptionMutationRetry;
}

test("lost response and page reload retain the original operation", async () => {
  const storage = new Map();
  let original;
  await assert.rejects(load(storage)("put:sub:items", { quantity: 4, expectedVersion: 2 }, async body => {
    original = body.operationId; throw Error("lost response");
  }));
  const recovered = await load(storage)("put:sub:items", { expectedVersion: 2, quantity: 4 }, async body => body.operationId);
  assert.equal(recovered, original);
  assert.equal(storage.size, 0);
});

test("a different target cannot reuse a pending payment ID", async () => {
  const storage = new Map(); const run = load(storage); let original;
  await assert.rejects(run("put:sub1:items", { quantity: 4 }, async body => { original = body.operationId; throw Error("lost"); }));
  const next = await run("put:sub2:items", { quantity: 4 }, async body => body.operationId);
  assert.notEqual(next, original);
});

test("restricted storage still preserves retries in the current page", async () => {
  const run = load(new Map(), true); let original;
  await assert.rejects(run("put:sub:items", { quantity: 4 }, async body => { original = body.operationId; throw Error("lost"); }));
  assert.equal(await run("put:sub:items", { quantity: 4 }, async body => body.operationId), original);
});

test("success clears the retry and explicit operation IDs remain authoritative", async () => {
  const run = load(); const send = async body => body.operationId;
  const first = await run("put:sub:items", { quantity: 4 }, send);
  assert.notEqual(await run("put:sub:items", { quantity: 4 }, send), first);
  assert.equal(await run("put:sub:items", { operationId: "explicit" }, send), "explicit");
});

test("reload after a partial commit retains the original payload and version", async () => {
  const storage = new Map();
  let original;
  await assert.rejects(load(storage)("put:sub:items", { quantity: 4, expectedVersion: 2 }, async body => {
    original = body; throw Error("collection restoration pending");
  }));
  const recovered = await load(storage)("put:sub:items", { quantity: 4, expectedVersion: 3 }, async body => body);
  assert.equal(recovered.operationId, original.operationId);
  assert.equal(recovered.expectedVersion, 2);
  assert.equal(storage.size, 0);
});

test("a definitive stale-version rejection allows a new operation after refresh", async () => {
  const storage = new Map();
  const run = load(storage);
  let original;
  await assert.rejects(run("put:sub:items", { quantity: 4, expectedVersion: 2 }, async body => {
    original = body.operationId;
    throw Object.assign(Error("stale"), { body: { data: { staleSubscription: true } } });
  }));
  const recovered = await run("put:sub:items", { quantity: 4, expectedVersion: 3 }, async body => body);
  assert.notEqual(recovered.operationId, original);
  assert.equal(recovered.expectedVersion, 3);
});

test("operations saved by the previous portal retain their ID and version", async () => {
  const storage = new Map();
  storage.set('portal:subscription-mutation:put:sub:items:{"expectedVersion":2,"quantity":4}', "legacy-operation");
  const recovered = await load(storage)("put:sub:items", { quantity: 4, expectedVersion: 3 }, async body => body);
  assert.equal(recovered.operationId, "legacy-operation");
  assert.equal(recovered.expectedVersion, 2);
  assert.equal(storage.size, 0);
});

test("corrupt saved state cannot silently create a different financial operation", async () => {
  const storage = new Map();
  storage.set('portal:subscription-mutation:v2:put:sub:items:{"quantity":4}', "corrupt");
  let sent = false;
  await assert.rejects(load(storage)("put:sub:items", { quantity: 4 }, async () => { sent = true; }), /needs confirmation/);
  assert.equal(sent, false);
});


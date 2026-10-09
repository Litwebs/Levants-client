import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import vm from "node:vm";
import ts from "typescript";
const source = ts.transpileModule(readFileSync(new URL("../src/api/subscriptionCreationRetry.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function load(storage = new Map(), disabled = false) {
  const exports = {};
  vm.runInNewContext(source, { exports, crypto: { randomUUID }, sessionStorage: {
    getItem: key => { if (disabled) throw Error("unavailable"); return storage.get(key); },
    setItem: (key, value) => { if (disabled) throw Error("unavailable"); storage.set(key, value); },
    removeItem: key => storage.delete(key),
  } });
  return exports.withSubscriptionCreationRetry;
}
test("creation keeps its operation across a lost response and page reload", async () => {
  const storage = new Map(); let original;
  await assert.rejects(load(storage)("c", { quantity: 3, addressId: "home" }, async body => {
    original = body.operationId; throw Error("accepted response lost");
  }));
  assert.equal(await load(storage)("c", { addressId: "home", quantity: 3 }, async body => body.operationId), original);
  assert.equal(storage.size, 0);
});
test("edited drafts cannot replace an unconfirmed creation", async () => {
  const storage = new Map();
  await assert.rejects(load(storage)("c", { quantity: 3 }, async () => { throw Error("lost"); }));
  let sent = false;
  await assert.rejects(load(storage)("c", { quantity: 4 }, async () => { sent = true; }), /earlier subscription/);
  assert.equal(sent, false);
});
test("another account has its own creation attempt", async () => {
  const storage = new Map(); let original;
  await assert.rejects(load(storage)("c1", { quantity: 3 }, async body => { original = body.operationId; throw Error("lost"); }));
  assert.notEqual(await load(storage)("c2", { quantity: 3 }, async body => body.operationId), original);
});
test("blocked or corrupt storage never starts payment", async () => {
  for (const run of [load(new Map(), true), load(new Map([["portal:subscription-creation:c", "invalid-json"]]))]) {
    let sent = false;
    await assert.rejects(run("c", { quantity: 3 }, async () => { sent = true; }));
    assert.equal(sent, false);
  }
});
test("confirmed success permits a new subscription", async () => {
  const run = load(); const send = async body => body.operationId;
  assert.notEqual(await run("c", { quantity: 3 }, send), await run("c", { quantity: 3 }, send));
});

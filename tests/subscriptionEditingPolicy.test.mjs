import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync(new URL("../src/portal/utils/subscriptionEditingPolicy.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } });
const { canModifySubscription } = await import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"));
test("editing is available only for active subscriptions without scheduled cancellation", () => {
  assert.equal(canModifySubscription({ status: "active" }), true);
  assert.equal(canModifySubscription({ status: "active", isCancellationScheduled: false }), true);
});
for (const state of [null, undefined, { status: "paused" }, { status: "cancelled" }, { status: "active", isCancellationScheduled: true }]) {
  test("blocks editing for " + JSON.stringify(state), () => assert.equal(canModifySubscription(state), false));
}

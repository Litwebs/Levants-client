import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { stripTypeScriptTypes } from "node:module";

const source = readFileSync(new URL("../src/api/client.ts", import.meta.url), "utf8")
  .replace('import { apiBaseUrl as API_BASE_URL } from "@/lib/environment";', 'const API_BASE_URL = "https://api.example.test/api";')
  .replaceAll("export default api;", "globalThis.client = api;")
  .replaceAll("export ", "");
const code = stripTypeScriptTypes(source);

function setup(responses) {
  const requests = [];
  const context = {
    Headers, FormData, URLSearchParams,
    fetch: async (url, options) => {
      requests.push({ url, headers: new Headers(options.headers) });
      assert.equal(options.credentials, "include");
      const next = responses.shift();
      assert.ok(next, "Unexpected extra request");
      return new Response(JSON.stringify(next.body || {}), {
        status: next.status, headers: { "Content-Type": "application/json" },
      });
    },
  };
  vm.runInNewContext(code, context);
  return { client: context.client, requests };
}
test("expired-session payment setup retries after refresh without requiring extra CORS headers", async () => {
  const { client, requests } = setup([
    { status: 401 }, { status: 200 },
    { status: 200, body: { success: true, data: { clientSecret: "fixture" } } },
  ]);
  const result = await client.post("/portal/payments/payment-methods/setup-intent");
  assert.equal(result.data.clientSecret, "fixture");
  assert.equal(requests.length, 3);
  assert.ok(requests[1].url.endsWith("/portal/auth/refresh"));
  assert.equal(requests[0].url, requests[2].url);
  assert.equal(requests[2].headers.has("x-auth-retry"), false);
});
test("an unsuccessful refresh leaves the original authentication error", async () => {
  const { client, requests } = setup([{ status: 401 }, { status: 401 }]);
  await assert.rejects(client.post("/portal/payments/payment-methods/setup-intent"), error => error.status === 401);
  assert.equal(requests.length, 2);
});
test("a second unauthorized response stops after one retry", async () => {
  const { client, requests } = setup([{ status: 401 }, { status: 200 }, { status: 401 }]);
  await assert.rejects(client.post("/portal/payments/payment-methods/setup-intent"), error => error.status === 401);
  assert.equal(requests.length, 3);
});

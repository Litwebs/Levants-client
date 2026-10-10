import { test } from "node:test";
import assert from "node:assert/strict";
import { validateUatConfig } from "./uat-policy.mjs";
test("UAT rejects absent, production, insecure and alternate API endpoints", () => {
  for (const value of [undefined, "https://api.levantsdairy.co.uk/api", "http://uat-api.levantsdairy.co.uk/api", "https://example.com/api"]) {
    assert.throws(() => validateUatConfig({ VITE_API_BASE_URL: value }));
  }
  validateUatConfig({ VITE_API_BASE_URL: "https://uat-api.levantsdairy.co.uk/api" });
});
test("browser configuration rejects private provider credentials", () => {
  for (const value of ["sk_test_synthetic", "sk_live_synthetic", "whsec_synthetic", "-----BEGIN PRIVATE KEY-----"]) {
    assert.throws(() => validateUatConfig({ VITE_API_BASE_URL: "https://uat-api.levantsdairy.co.uk/api", VITE_ACCIDENTAL_SECRET: value }));
  }
});

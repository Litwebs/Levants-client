import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const client = fileURLToPath(new URL("..", import.meta.url));
const server = process.env.LEVANTS_SERVER_DIR || resolve(client, "../Levants-server/server");
const dist = mkdtempSync(join(tmpdir(), "levants-basket-e2e-"));
const env = { ...process.env, VITE_API_BASE_URL: "/api", DEALS_CLIENT_DIST: dist, DEALS_REAL_STRIPE: "0", SWC_NATIVE_BINDING_CACHE: process.env.SWC_NATIVE_BINDING_CACHE || join(tmpdir(), "levants-basket-swc") };
function run(cwd, script, args) {
  const result = spawnSync(process.execPath, [join(cwd, script), ...args], { cwd, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
run(client, "node_modules/vitest/vitest.mjs", ["run", "tests/automatic-deals.test.tsx", "tests/deals.test.tsx"]);
run(client, "node_modules/vite/bin/vite.js", ["build", "--outDir", dist]);
run(server, "node_modules/jest/bin/jest.js", ["--runInBand", "--no-watchman", "--config", "Tests/Deals/jest.baskets.config.cjs", "--testPathPatterns=Tests/Deals/(deals.basket-abuse|deals.checkout-packages|deals.credit-compensation|deals.checkout).e2e.test.js"]);
run(server, "node_modules/jest/bin/jest.js", ["--runInBand", "--no-watchman", "--config", "IntegrationTests/Deals/jest.config.cjs"]);
console.log("Basket scenarios passed. Browser screenshots: Levants-server/server/deals-integration-artifacts");

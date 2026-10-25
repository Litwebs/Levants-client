import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const client = fileURLToPath(new URL("..", import.meta.url));
function run(script, args) {
  const result = spawnSync(process.execPath, [join(client, script), ...args], {
    cwd: client, env: { ...process.env, VITE_API_BASE_URL: "/api" }, stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
run("node_modules/vitest/vitest.mjs", ["run", "tests/automatic-deals.test.tsx", "tests/deals.test.tsx"]);
run("node_modules/@playwright/test/cli.js", ["test", "--config=playwright.baskets.config.ts", ...process.argv.slice(2)]);

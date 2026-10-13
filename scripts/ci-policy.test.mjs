import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const source = readFileSync(new URL('../.github/workflows/deals.yml', import.meta.url), 'utf8');
const guard = "github.event_name == 'workflow_dispatch' || github.ref == 'refs/heads/main' || github.base_ref == 'main'";
test('feature work uses PR checks without duplicate feature push runs', () => {
  assert.match(source, /on:\n  pull_request:\n  push:\n    branches: \[main\]\n  workflow_dispatch:/);
  assert.ok(!source.includes('branches: [feat/customer-deals'));
});
test('all browser installation, execution and artifacts are restricted to main or manual runs', () => {
  for (const step of source.split(/\n      - /).slice(1)) {
    if (/playwright install|test:deals:browser|actions\/upload-artifact/.test(step)) assert.ok(step.includes(guard), step);
  }
});
test('quick unit and build checks remain enabled and obsolete duplicate workflow is removed', () => {
  assert.ok(source.includes('run: npm run test:deals\n'));
  assert.ok(source.includes('run: npm run build\n'));
  assert.equal(existsSync(new URL('../.github/workflows/deals-ci.yml', import.meta.url)), false);
});

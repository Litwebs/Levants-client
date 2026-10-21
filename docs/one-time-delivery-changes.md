# One-time delivery changes: customer UI

Feature branch: `feature/one-time-delivery-credit`, based on storefront UAT `f4ff1fe0193f30946f0855b43f7585bde41e046f`.
Backend contract: Litwebs/Levants-server PR #65, implementation checkpoint `65a3d3210b6bcaf94640430056436b4f562ccc1c`.

This batch implements the customer interface. Backend acceptance, staff views, guide/tour updates, paired real-API end-to-end acceptance and UAT rollout remain separate completion steps. No merge or deployment is included.

## Customer flow

- Each eligible paid delivery offers **Change This Delivery Only**. Eligibility comes from the server; older responses without that flag keep the existing portal behaviour.
- The editor loads saved delivery quantities and prices. Customers can reduce whole-number quantities or remove recurring items. Paid one-time add-ons remain separate.
- **Review change** requests a server-authoritative quote. The review shows before/after quantities, original and revised delivery totals, the retained fee and eligible store credit. Editing a quantity discards the previous quote.
- Removing all recurring items cancels that delivery only when the backend quote says no items remain. The review explains the fee treatment before confirmation.
- **Confirm delivery change** sends the selected quantities, quoted version/token and a unique operation ID. A synchronous guard prevents double submissions.
- Success updates the account and delivery data, shows the actual credit/revised total and links to store-credit history. Background refresh preserves unsaved recurring-product/address drafts.
- Delivery details use the funded recurring snapshots, including an explicit empty list and a zero total/fee. The future plan remains visible at its normal quantities. Adjustment history shows the actual before/after quantities, credit and UK timestamp.
- The page explains the current backend restriction on regular product/schedule edits before an adjusted delivery's cut-off.

## Recovery and stale state

The reviewed confirmation is saved before submission under a session-storage key scoped to customer, subscription and delivery. Its body includes the original operation ID, quantities, token and version. A memory fallback retains it in the current page if browser storage is unavailable; cross-reload recovery then depends on browser storage availability.

Network/server failures, sign-in failures and in-progress responses retain that complete request. **Check delivery change** is available even if a fresh adjustment is no longer eligible. **Check result** resubmits the identical request, allowing the backend to replay a committed success even after cut-off. Recovery never obtains a replacement quote or silently creates a different operation.

Definitive stale-version/quote, cut-off, invalid-quantity or inventory-reconciliation responses discard the unusable review and require an explicit reload and new review. A successful settlement followed by a display-refresh failure stays a success and asks the customer to refresh the page.

Read-only requests can be dismissed; their late responses cannot overwrite a reopened editor. A confirmation in flight stays open, and the already-saved request supports recovery if the browser is reloaded. Existing dialog keyboard/focus handling is retained, with a focus fallback to the delivery header when cancellation removes its action. Controls use 44px minimum touch targets and a bounded, scrollable mobile dialog.

## Verification

- `tests/delivery-reduction.test.tsx`: customer interaction cases for eligibility, read-only opening, validation, preview invalidation, exact confirmation, double submission, full removal, add-ons, further reductions, zero credit, lost-response recovery after remount/cut-off, account isolation, stale responses, malformed envelopes, display-refresh failure and keyboard/slow-read behaviour.
- `tests/deliveryReductionRetry.test.mjs`: five isolated recovery-storage cases, including page reload, account/subscription/delivery isolation, restricted storage, confirmed cleanup and corrupt data. These run the actual transpiled TypeScript module.
- `tests/browser/delivery-reduction.spec.ts`: eight API-fixture browser cases covering 320/390/1440px review bounds and touch targets, actual portal delivery snapshots/future quantities, full removal with £0 total/fee, exact request recovery after reload, stale review, keyboard focus and preservation of an unsaved recurring quantity draft.
- `.github/workflows/delivery-reduction-ui.yml`: normal type checking, scoped lint, feature component/storage tests, production build, Chromium browser cases and retained evidence. Existing validation workflows and test commands are unchanged.

Browser fixtures exercise the real portal UI and HTTP client with intercepted API responses. They do not prove database transactions, provider behaviour or deployed server/storefront compatibility. Paired real-API acceptance is still required before rollout.

Local verification limitations must remain explicit in the PR: this workspace's native Rollup parser fails during build, default Vitest runs can report all cases and then stall on teardown (also reproduced by an unchanged address test), and Chromium downloads arrive as invalid archives. A version-matched official Rollup WASM parser can validate the local build without modifying source, lockfiles, dependency declarations, scripts or CI. Normal CI build/component/browser results remain required. No test timeout, assertion or existing test selection is weakened to bypass these issues.

## Manual UAT acceptance after paired deployment

Use an authorised customer fixture with an editable, confirmed paid delivery and recorded inventory consumption. Verify review/confirmation on desktop and phone, actual account credit/history, adjusted delivery items, preserved add-ons, future normal quantities and staff records. Exercise a lost response, a stale preview and crossing the UK cut-off. Confirm that closing the editor/review makes no financial change. Reconcile the actual ledger/order/stock data and test full removal separately. Record the exact deployed server and storefront revisions with the results.

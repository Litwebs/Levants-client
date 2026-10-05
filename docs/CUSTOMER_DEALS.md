# Customer deals

This storefront integrates with the customer-deals API in the paired
`Litwebs/Levants-server` feature branch. Deploy that server first.

Customers discover offers in **Current Deals** on the homepage, in the **Deals**
navigation item, at `/deals`, and at `/deals/:slug`. Featured offers receive
priority. Cards show package price, current retail value, savings and optional
expiry. The layout uses the existing storefront components and styles.

The basket stores packages separately from normal products. Checkout sends their
expanded variant quantities and price/content expectations to the server, which
validates pricing, expiry and stock. Discount codes cannot be combined with deal
packages; store credit remains supported. **Refresh offers** at checkout reloads
changed offers and removes unavailable ones while preserving the basket if the
network fails. Old product-only basket storage remains compatible.

Run `npm ci`, `npm run test:deals`,
`npx tsc --noEmit -p tsconfig.app.json` and `npm run build`. The storefront
PR workflow runs those checks plus lint on the deals implementation. The full
legacy storefront lint baseline still has unrelated errors; the deals lint gate
is scoped explicitly.

Component tests cover adding packages, quantity limits, expiry, saved baskets,
changed prices/content, stock refresh, network failure and out-of-order requests.
The address-form regression test verifies preservation and changes to the default
address checkbox.

The paired server GitHub Actions workflow runs the actual API, admin and storefront
with an isolated MongoDB replica set and real Stripe test-mode payments. Its deals
browser suite covers desktop/mobile creation and discovery, basket/checkout display,
admin edit/schedule/deactivate/reactivate/archive persistence, fully funded store
credit, and guest/signed-in purchases through storefront checkout and hosted Stripe
Checkout. Signed webhooks and browser reconciliation must consume stock exactly
once. Screenshots and failure traces are uploaded as `deals-e2e-diagnostics`.

CI captures the image-upload provider boundary and email transport and substitutes
geocoding. Real production image-provider credentials, email delivery and deployed
environment configuration require a deployment smoke test. Require green checks
on both PRs before release; deploy the server before this storefront.

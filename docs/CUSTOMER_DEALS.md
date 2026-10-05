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

Run `npm ci`, `npm run test:deals` and `npm run build`. Component interaction
tests cover adding packages, quantity limits, expiry, saved baskets, changed
prices, stock refresh and network failure. Before release, review desktop/mobile
layouts and complete a guest and signed-in Stripe test-mode checkout against the
paired server. Browser visual verification was blocked in the implementation
environment. Existing baseline TypeScript errors are unchanged.

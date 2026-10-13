# Automated deal basket scenarios

Run from `Levants-client`:

```sh
npm run test:deals:baskets
```

The runner builds this checkout into a temporary directory, runs component tests,
runs the server's checkout/abuse tests, and runs Chromium against that build,
the real Express API, and an isolated MongoDB replica set. It expects the sibling
`Levants-server/server` checkout; set `LEVANTS_SERVER_DIR` to override its location.
Install dependencies in both repositories and install Playwright Chromium first.

No production database is used. Stripe, Resend/email, Google geocoding, and the
external site-status service are mocked. Tests exercise the application's actual
order creation, authentication, discounts, credit, transactions, and stock
reservation code. They do not charge a card or send customer emails.

Browser screenshots are saved under
`Levants-server/server/deals-integration-artifacts/`, including on failure.

## Scenario coverage

| Customer possibility | Automated coverage |
| --- | --- |
| One item, below a deal's required quantity | Browser combination: one milk |
| Exactly one single-variant package | Browser combination: exact milk pair |
| Complete package plus leftover retail items | Browser combination: milk pair with leftover; mobile viewport |
| Multiple copies of a package | Browser combination: repeated milk pairs |
| Exactly one mixed-product package | Browser combination: exact mixed package |
| Overlapping packages with a leftover | Browser combination: overlap with leftover milk |
| Repeated mixed-product packages | Browser combination: repeated mixed packages |
| Two different automatic packages | Browser combination: two different automatic packages |
| Similar product but the wrong variant | Browser combination: different milk variants; guest/account API rejection |
| Incomplete mixed-product package | Browser combination: missing milk; guest/account API rejection for missing honey |
| Explicit package only | Browser combination: explicit package alone |
| Explicit plus automatically matched copy of the same deal | Browser combination: one combined claim, exact underlying quantities |
| Explicit plus a different automatic deal | Browser combination: explicit plus different automatic package |
| Attempt to reuse products already inside an explicit package | Browser combination: explicit contents cannot be reassigned |
| Several explicit packages | Browser combination: multiple explicit packages |
| Explicit mixed package plus unmatched manual item | Browser combination: explicit mixed package plus manual milk |
| Additional unrelated products | Browser combination: unrelated product stays retail |
| Add products through the actual product page | Browser interaction tests at 390px and 1440px |
| Increase/decrease quantity to gain/lose eligibility | Browser interaction tests and component tests |
| Remove a product from a mixed package | Browser interaction: removing a mixed-package component |
| Remove the last item | Browser interaction: empty drawer and empty persisted basket |
| Reload the website | Browser reload: original quantities retained; automatic packages not persisted twice |
| Expired, future, inactive, archived or unavailable deal | Browser eligibility matrix and guest/account API rejection matrix |
| Package price changes before payment | Browser pauses for review, creates no order, then accepts reviewed price |
| Package contents change before payment | Same browser review check; forged fingerprint rejected by API |
| Deal deactivated before payment | Browser removes savings and requests review |
| Connection fails during offer checking | Browser blocks submission and retries after reconnection |
| Discount code combined with savings | Browser hides code field; guest/account API rejects forged stacking |
| Partial account credit plus savings | Browser creates correct adjustment and preserves credit until payment |
| Credit covers the whole order | Browser settles locally, deducts credit and avoids Stripe Checkout |
| Guest tries to spend account credit | API rejects request and preserves balance |
| Account tries to choose another customer's credit | Authenticated API rejects customer ID injection |
| Stock disappears between offer check and order POST | Browser/API rejects with no order or stranded reservation |
| Two customers try to buy the final package | Concurrent API requests: exactly one order and one reservation |
| Fake price, final total or discount amount | Both guest and authenticated API rejection tests |
| Excessive, zero, negative or fractional quantities | Both API rejection matrices |
| Duplicate deal claims or overlapping use of the same unit | Both API rejection matrices; no Stripe session or stranded stock |
| Stripe fails while creating checkout | Existing real API regression verifies transaction rollback |
| Payment cancelled or fails after checkout creation | Existing API regression verifies reservation release |
| Payment success replayed | Existing browser/API regression verifies stock/credit settlement only once |
| Credit settlement fails | Existing compensation regression restores credit and releases stock |
| Offer exists on a later catalogue page | Component test confirms automatic matching includes it |

Every successful browser combination checks the saved order's total, discount,
underlying variant quantities, unique deal claims and reserved stock, rather
than relying on the displayed subtotal alone.

## Current overlap policy

Automatic matching chooses the largest saving **per package** first and never
uses a unit twice. It does not guarantee the globally cheapest basket. The
browser test `overlap limitation` records this explicitly: four £5 milk bottles
with a three-for-£11.50 offer and two-for-£8 offer currently cost £16.50 before
delivery, although two pairs would cost £16.00. This is documented behavior,
not a test asserting an optimal-price guarantee.

Two existing real Stripe hosted-card/refund tests remain opt-in and are skipped
by this runner. The default suite needs no real provider credentials. It proves
application behavior using provider mocks, not live provider delivery.

The server's existing GitHub integration workflow discovers these browser tests
automatically. Its `client-storefront` checkout is pinned to a specific client
commit. When publishing this feature, advance that pin to the client commit
containing automatic basket savings; testing the older storefront against these
new expectations will fail. The local runner always builds the current client
checkout and does not depend on that workflow pin.

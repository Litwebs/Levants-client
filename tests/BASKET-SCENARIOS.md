# Independent storefront basket tests

From `Levants-client`:

```sh
npm run test:deals:baskets
npm run test:deals:baskets -- --headed
npm run test:deals:full
```

This command uses only this repository. It runs the basket component tests,
then starts Vite on port 4183 and runs Playwright in Chromium. Playwright
supplies local API responses through request routing; it does not contact the
backend repository, a database, or Stripe.

The browser suite checks the 16 milk/honey/explicit-package combinations,
submitted deal claims, stale-price review, failed offer-check retry, reload,
expired and future offers, unavailable stock, and the documented overlapping
offer result. The component suite checks offer matching, quantities, stock
limits, price and content signatures, and checkout payload construction.

`test:deals:full` also runs type checking, every deals component test and the
complete independent browser suite. `npm run test:deals:browser -- --headed`
shows the complete browser suite in Chromium.

The merchandising browser tests verify that only marked Featured offers appear
on the homepage and in the Deals page's featured section, while the full
catalog includes ordinary active offers. They check the original value, price,
savings, images and contents, package details, unavailable packages, and a
real button click that expands an explicit package into its component
quantities in the submitted checkout request. Carousel tests exercise desktop,
tablet and mobile widths, touch, keyboard navigation and reduced motion.

Backend order validation, persistence, reservations, credit, and admin deal
management have separate commands in `Levants-server/server`. The storefront
browser suite verifies the request it would send; it does not assert that a
backend accepted or saved an order.

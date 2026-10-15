# Customer portal guided tours

Storefront feature, based on UAT. The walkthroughs explain existing controls; they never invoke account or payment actions. There is no backend migration or new dependency.

## Customer behavior

- First visits offer a tour after the signed-in customer's page is ready.
- **Take a tour** replays the current page or open address/pause/resume/cancel form.
- The subscription builder shares first-visit history across its five stages; replay always explains the stage currently displayed.
- Back/Next move through explanations; Skip, Finish and Escape close the tour. Keyboard focus returns to the launch control. The underlying form cannot be clicked during the tour.
- Absent/hidden controls are omitted. A disappearing target moves the tour to the next available step.
- Cut-off and pause policy steps quote the current UI notice rather than maintaining a second set of business rules.
- Completion/dismissal uses `levants:portal-tour:v1:<customer>:<page>` in localStorage. This is per customer and browser, not synchronized between devices. If storage is blocked, an in-memory session fallback prevents immediate reopening. Replay always remains available. Increment the version when materially changed guidance should be offered again.

## Extending a tour

Add content in `src/portal/tours/definitions.ts`. Add stable `data-tour` anchors to actual controls, and a `data-tour-page` / `data-tour-ready` scope to the ready page or form. No CSS selectors based on layout, label text or list indexes are used. Dialog scopes take precedence over their background page. Never attach a mutation handler to tour navigation.

## Verification

CI runs `npm run test:deals`, `npm run typecheck`, targeted ESLint, `npm run build`, and Playwright browser regressions. New browser coverage uses real portal pages with mocked API responses, records unexpected writes, checks mobile/desktop card bounds, walks every page and builder stage, verifies replay, customer history, keyboard/Escape, loading/error/empty states, disappearing targets and nested forms. Secure Stripe fields remain provider-owned; a fixture simulates their unavailability and verifies saved-card/history guidance. Existing financial retry tests remain unchanged.

Before UAT acceptance, check a signed-in customer on a phone and desktop: complete/skip/replay tours, review active and paused subscriptions, open an address form, verify live cut-off wording, and confirm Finish never saves an entered draft. Verify the normal forms still work after closing their tour. Deploy only after the feature PR is approved for UAT.

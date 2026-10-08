# Storefront component catalog

Open `/component-catalog` while running the storefront in development mode.
The route is omitted from production builds, matching the internal purpose of
the server repo's admin Component Lab.

This catalog follows the server catalog's central rule: examples render the
real components used by pages. `ComponentCatalogPage.tsx` contains interactive
stories for the storefront's form controls, selection controls, buttons,
surfaces, and feedback. It reads the storefront's live colour tokens rather
than copying the admin theme.

`src/components/common/FormControls.tsx` adapts the server's `Input` and
`Select` APIs (label, hint, error, icons, sizes, native props) and adds a
matching `Textarea`. It delegates to the storefront's existing UI primitives
and keeps labels, hints, and errors connected through `htmlFor`,
`aria-describedby`, and `aria-invalid`. Shared `.form-control` styling in
`src/index.css` also covers the existing `.input-field` native controls.

When changing a shared control, update its catalog story and inspect the
contact, checkout, and portal forms at desktop and mobile sizes.

# Storefront component ownership and catalog migration

The storefront and admin are separate React builds in separate repositories. They do not share a runtime component package or an admin-controlled styling API. Admin `client/src/components/common/Button/Button.tsx` and `Select/Select.tsx` use CSS modules; the storefront adapts their semantic contracts through its own existing primitives and CSS variables. Import across repository roots is unsupported.

## Authoritative configuration

- Visual properties are developer-controlled: `src/index.css` owns CSS variables and field surfaces; `tailwind.config.ts` maps tokens; `ui/button.tsx` owns action variants and sizes. The interactive component catalog edits local React state to preview props. It does not save site styles to the server.
- Business Info supplies runtime branding/contact data through `BusinessInfoContext`. Product/category records, public deal availability/prices and public promotion terms remain backend-owned. These are business content, not a second theme system.
- Buttons adapt admin primary/secondary/outline/ghost/danger semantics to storefront default/secondary/outline/ghost/destructive. Common field controls retain the admin value-based `onChange(value)` contract and native keyboard behavior. Checkbox uses the existing storefront Radix primitive.

## Canonical inventory and consumers

| Concern | Source / configurable contract | Migrated consumers |
|---|---|---|
| Actions | `components/ui/button.tsx`: variants, native disabled/type, `asChild`; `touch` and `quantity` sizes provide 44px targets | Shop/Deals filters, retry/clear/apply, deal detail, product entry and checkout actions; existing portal controls remain on the same primitive |
| Basket action | `components/products/CatalogCardControls.tsx`: `BasketButton` is a thin Button adapter with icon/compact props; no duplicate pricing or click behavior | ProductCard, DealCard, ProductPage, DealDetailPage |
| Fields | `components/common/FormControls.tsx`: labeled Input/Select/Textarea, options, errors, hints, value callbacks; CSS field tokens | Catalog sort and product variant select, saved checkout address; existing forms/catalog |
| Category and sort | `components/products/CatalogFilters.tsx`: `CategoryFilterOptions(categories, selected, onToggle)` and `CatalogSortSelect(value, onChange)` | Shared ShopPage path serves both Shop and Deals; same desktop and mobile controls preserve existing state/URL handlers |
| Selection | `components/ui/checkbox.tsx`: checked/disabled/onCheckedChange with labeled 44px filter rows | Shared catalog categories, component catalog; existing unrelated forms retained |
| Editable quantity | `components/ui/QuantityStepper.tsx`: quantity/callback, min/max/disabled/size, group and button labels, polite quantity announcement; buttons never submit forms | ProductCard, ProductPage, cart products/packages, DealDetailPage; existing CartPage and subscription editors inherit the same implementation |
| Filter drawer | `components/ui/sheet.tsx`: existing Radix focus trap/Escape/overlay; shared 44px close target | Shop/Deals filter drawer, with explicit return to its opening button |
| Media | `components/deals/DealImage.tsx`: src/alt/frame class, load/error handling and accessible missing-image fallback | DealCard, DealContents, DealDetailPage, ProductCard. Package art is contained in fixed frames; product photography keeps its intentional default cover variant |
| Pricing | `components/deals/dealPresentation.ts`: existing verified display formatting and honest savings | DealCard, DealDetailPage, Deals listing mapper; no pricing calculation changes |
| Package contents | `components/deals/DealContents.tsx`: items from the selected package, explicit item descriptions/image fallbacks | Detail page only. No product/variant/quantity lists on grid or featured cards |
| Status / feedback | Existing Badge, Skeleton, toast and live-region primitives | Detail availability, quantities, loading/error, component catalog; existing business handlers retained |

## Data and interaction boundaries

Deal contents may read the existing public `/products/:id` endpoint through `api/catalogProducts.ts` for descriptions and image fallbacks. Deduplicated product IDs are read once per displayed contents set; stale responses are ignored and failed reads get honest fallback text. These reads never replace the package's purchased product identities, quantities, prices, stock or payment data. No backend, inventory, payment or subscription rules were changed.

Cart quantity uses `min=0` to preserve the existing decrement-to-remove operation. Product/detail entry uses `min=1`. Package and stock maxima remain bounded. Read-only `/portal/orders` keeps its existing shared Button/Select controls and receives no quantity editor.

The component catalog includes a “Catalog controls & media” story with real filter/sort/stepper/adapted-action/image controls, disabled bounds and missing media. Its action is a development-only local preview and never creates a basket or API write.

## Verification

Component coverage exercises filters, native sorting, quantity bounds/removal, non-submitting buttons, hidden listing contents, real metadata/fallbacks and stale responses. Browser coverage exercises Shop/Deals URL synchronization, mobile focus trap/Escape/return, cart and checkout entry, package bounds and persistence, contained images, missing metadata, and 320/375/768/1024/1440px captures. Existing carousel, reduced-motion, swipe, promotion and subscription regressions remain part of final release checks.

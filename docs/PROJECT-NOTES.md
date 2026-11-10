# Dorm Drop SLO — Big move. Soft landing.

An English-language, browser-local concept website for Cal Poly dorm essentials. The art direction combines editorial typography, forest green, warm ivory, a pale lime accent, and a coordinated set of generated product photographs.

## Main customer journey

1. Choose one of three fixed kits: First Night ($132), First Week ($183), All Set ($239). Alternatively start an independent custom kit in the live 3D room builder. Product-gallery details can also add an individual item to the custom builder; fixed packages are never loaded into that builder.
2. Make an arrival plan on one page. Review the kit, choose representative housing, an example meeting point, date and pickup window. The optional Roommate Planner expands in this page. Assignments apply immediately and can be skipped again. Only a fan or rug already in the kit can be excluded; other checklist items are planning notes, not purchases.
3. Review and confirm a demo order. No payment, address, email or external order is required. A first name personalizes the thank-you page and dashboard.
4. Open My move-in for the frozen order, illustrative pickup map, example buddy, simulated local chat, arrival check-in and collection confirmation.

This replaces the previous separate cart, roommate and pickup screens with a combined arrival-plan step. Existing cart/pickup routes remain aliases. Mobile screens have a fixed price/action bar, including a separate continuation button for the 3D builder. Empty or fully covered custom kits cannot be confirmed. A valid sample date is required.

## Products and imagery

Three generated package photographs, a twelve-product atlas and two individual storage photographs provide catalogue tiles, larger product details, 3D-sidebar thumbnails, shared-item previews and order contents. The builder keeps actual interactive room geometry, with colors and items changing live.

Asset paths, generation method and prompt briefs are recorded in `IMAGE-DIRECTION.md`. The original generated bedroom visual remains as a lifestyle image. Product styling, furniture, prices and service arrangements are illustrative, not actual inventory or a campus partnership.

## State and privacy

Choices and demo orders stay in browser local storage. Confirmed orders retain their own item, price, pickup and roommate snapshots when a later draft is changed. Roommate share links contain only names and checklist assignments, without checkout names, pickup data or order details. Links are snapshots, not live collaboration; no invitation or message is sent. All buddy replies and arrival status changes are simulated.

## Implementation

- `index.html`, `site.js`, `site.css`: storefront, product details, planning and demo arrival journey.
- `commerce.js`: validated catalog state, fixed kits, shared-item exclusions and order snapshots.
- `products.js`, `products.css`: product art mapping and photography atlas.
- `room.html`, `app.js`, `room-polish.css`: origin-checked embedded builder. Poster mode provides a read-only 3D marketing preview without modifying saved selections.
- `catalog.js`, `room-model.js`: fourteen products, six colors and representative housing meshes.
- Vendored Three.js 0.180.0 modules and MIT license: no external runtime CDN.

There is no actual payment processor, fulfillment, inventory system, campus integration or backend. The schematic map is not for navigation.

## Validation

`npm run check` checks all six application modules. `npm test` covers fixed/custom separation, optional roommate exclusions, frozen order data, empty/invalid checkout input, saved-state normalization, new storage/color persistence through checkout and planner snapshot privacy.

Browser checks covered both complete purchase paths, product details and gallery filters, single-product transfer to 3D, live items/color/housing changes, combined planning, automatic price changes, optional-plan skip, a fully covered kit, empty-kit continuation, invalid dates, confirmation, saved-order reload, simulated buddy chat, check-in and collection. The Roommate Planner remains open while selections change and collapses when skipped. At 375 px content width, the landing page, ordering path and dashboard had no horizontal overflow; the fixed mobile continuation controls completed the purchase path. The testing browser disables WebGL, so visual 3D checks used the SVG projection fallback.

## Housing model revision

The bedroom models now use plausible furniture-scale proportions, carpet, painted walls, a door and outlet plates, horizontal mini-blinds, wood bed frames, desks with drawer units, two-position-style chairs, and freestanding wardrobes. Duvets and pillows have rounded geometry; WebGL uses procedural wood, carpet, and fabric maps. The vector fallback retains the detailed geometry, neutral daylight palette, and contact shadows.

The apartment option represents a private bedroom within a Cerro Vista apartment, with a desk, wardrobe, and under-bed dresser. The shared option is a representative residence-hall triple with one standard bed, two bunked beds, three desks and wardrobes, and a context mini-fridge. Models are inspired by university furnishing guides rather than exact measured reconstructions of a particular assigned room. Furniture and contextual staging are excluded from kit pricing.

Existing saved room values `single` and `shared` migrate to `cerro` and `dorm` while preserving item/color choices.

Soft purple and blush pink are available in the custom builder, alongside the original four colors. A two-tier bamboo shoe rack and six-shelf hanging closet organizer are optional custom extras in both housing models. Selecting the organizer opens the wardrobe doors, and the Closet camera offers a closer view. The three fixed packages keep their original contents and totals.

Primary reference sources consulted:
- https://housing.calpoly.edu/student-housing/residence-halls-and-apartments/cerro-vista-apartments
- https://content-calpoly-edu.s3.amazonaws.com/housing/1/images/UH_Room-Config-2026-Cerro-new-2.pdf
- https://housing.calpoly.edu/student-housing/residence-halls-and-apartments/ytt
- https://content-calpoly-edu.s3.amazonaws.com/housing/1/documents/UH_Room-Config-ytt-2024.pdf

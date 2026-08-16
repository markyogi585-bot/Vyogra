# VOYAGR 2026 Native-App Redesign Matrix

## Product Interaction Contract

VOYAGR is a **package-first travel product**. A guest must be able to discover routes, inspect a package, and start selecting dates without encountering an account wall. Authentication belongs at the point where a protected action is required: booking issuance, saving a route, payment, profile data, or traveler history. On compact viewports, context-changing controls open as spring-driven bottom sheets; desktop turns the same systems into anchored drawers or side panels rather than changing their underlying route or API contract.

| System | Native 2026 rule | Interaction outcome |
|---|---|---|
| Visual language | Violet action color, coral commerce accent, ink typography, luminous canvas, translucent surfaces, and high-radius cards | Traveler surfaces feel like one coherent mobile product rather than separate marketing pages |
| Motion | Short spring transitions, press feedback, drag-dismiss sheets, and reduced-motion fallbacks | Motion signals hierarchy and state change without delaying tasks |
| Navigation | Glass top bar, five-action mobile dock, safe-area padding, role-aware admin sidebar | Every primary action remains reachable and has a visible exit path |
| Content | Photo-led route cards, compact service widgets, high-information booking panels | Packages and trip status take precedence over decorative illustration |
| Trust | Explicit loading, empty, permission, and verification explanations | Guests understand why a booking ID suffix or sign-in is needed |

## Traveler Surface Matrix

| Route or surface | Primary job | Native layout pattern | Connected action contract |
|---|---|---|---|
| `/` Home | Start route discovery | Photo hero, smart search strip, service grid, live campaign rail, route card carousel | Search opens Explore; campaigns use live widget data; booking ID opens access flow |
| `/app` Travel desk | Re-enter travel tools | Hero card, six service tiles, offer rail, floating dock | Tiles route to Explore, Trips, Wallet, Wishlist, Support, and Account |
| `/explore` | Search and compare packages | Search header, filter chips, mobile filter sheet, photo card grid/list | Search/filter state drives catalog; cards open package detail |
| `/package/:id` | Evaluate a package | Immersive gallery, quick facts, section tabs, sticky booking rail | Book opens auth/date flow; gallery, itinerary, map, and support actions remain local or routed |
| `/checkout` | Issue a traveler booking | Progressive traveler/payment panel with terms and invoice summary | `commerce.checkoutIssue` persists booking, invoice, terms, and access grant |
| `/access` and `/access/:code` | Enter an admin-issued trip without account login | Clear verification card, suffix entry, booking portal | `bookingAccess.open` validates booking code plus contact suffix |
| `/trips` and `/trips/live` | Manage and track issued bookings | State tabs, booking cards, document and live-status controls | Booking history and latest check-in query typed APIs; loading/empty/error states stay explicit |
| `/wallet`, `/account`, `/wishlist`, `/notifications`, `/support`, `/review` | Money, identity, saved routes, messages, help, and feedback | Profile-command panels, action rows, nested cards, bottom sheets where state changes | Auth gates protected actions; no fabricated review content or financial status is shown |

## Administrative Surface Matrix

| Route or workspace | Operator job | Native administration pattern | Connected action contract |
|---|---|---|---|
| `/admin/tools` | See operations state | Desktop command sidebar, metric panels, mobile stacked command cards | Role-aware destinations and typed status panels |
| Package builder | Draft and publish packages | Stepper with editable day cards, media slots, price panels, publish footer | Blueprint persistence saves itinerary, terms, translations, and revisions transactionally |
| Manual booking | Create an offline/agent booking | Guided traveler, pricing, coupon, terms, payment, and issue panel | Booking, party, invoice, access grant, and audit event persist together |
| Traveler record | Support a traveler | Identity header, booking/payment/document tabs, action drawer | Permission-gated message, document, suspension, and audit operations |
| Invoices and budget | Control financial operations | Dense readable ledger cards, tax split, margin model, share/download actions | Invoice and budget procedures provide the source of truth; sensitive actions stay role-gated |
| Growth and broadcasts | Run offers and updates | Campaign control panels, audience chips, preview drawer, schedule state | Daily deal, flash sale, coupon, and broadcast mutations write audited data |
| Live trip operations and media | Publish operational updates | Trip selector, check-in composer, location/media stream, storage state | Operators publish only for authorized bookings; media uses secure storage contracts |
| System, audit, analytics | Govern platform controls | System status rows, immutable event timeline, analysis panels | Super-admin boundaries and audit history are shown explicitly |

## Completion Criteria

The redesigned product is considered complete only when every visible primary card, tab, dock item, and call-to-action has a destination, sheet, or typed mutation; every destructive or permissioned action supplies an explanation and state feedback; traveler and administrator layouts are usable at phone and desktop widths; Hindi and English labels stay aligned with persisted locale; and production build, test, and type-check results remain clean.

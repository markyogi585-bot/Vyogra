# VOYAGR Platform Upgrade Checklist

## Scope Mapping

- [x] Map the attached specification into traveler, booking, account, and admin routes.
- [x] Keep the Monsoon Modern design language consistent across all new surfaces.
- [x] Keep all new flows frontend-only and clearly label simulated integrations.

## Traveler Experience

- [x] Add package listing/search route with filters, sorting, grid/list toggle, and result states.
- [x] Expand package detail flow with gallery, overview, itinerary, inclusions, hotels, reviews, and map sections.
- [x] Add date and traveler selector before booking.
- [x] Add booking form with traveler details, add-ons, payment summary, and confirmation state.
- [x] Add authentication sheet with login/register tabs, phone OTP, email, Google, and Apple entry points.
- [x] Add offers, trending routes, and richer category navigation to the homepage.

## User Account

- [x] Add profile dashboard with quick actions, loyalty card, settings, and support links.
- [x] Add My Trips with upcoming, ongoing, completed, and cancelled states.
- [x] Add ticket/document actions, trip tracking, chat support, cancellation policy, and review entry.
- [x] Add wishlist route with named lists, sharing, and price-drop notification states.
- [x] Add reviews UI with rating, tags, helpful votes, photos, and moderation-friendly states.
- [x] Add notifications, offers, saved addresses, payments, insurance, gift cards, and referral entry points.

## Admin Console

- [x] Add package manager with create/edit/archive/duplicate states and itinerary builder.
- [x] Add bookings management with filters, status changes, ticket upload, and payment visibility.
- [x] Add user management with search, profile view, communication log, suspension, ban, and restore states.
- [x] Add budget planner with category allocations, variance indicators, and expense entry states.
- [x] Add broadcasts, announcements, daily deal, flash sale, scheduling, and audience segmentation UI.
- [x] Add media library and per-user document/message tools.
- [x] Add analytics, role/access display, support tickets, and system settings surfaces.

## Verification

- [x] Verify all routes and interactive flows on desktop and mobile.
- [x] Run TypeScript checks and production build.
- [x] Capture representative screenshots and save a final checkpoint.

## Product Summary Alignment

- [x] Add visible spring-motion and drag-to-dismiss affordances to all major bottom sheets.
- [x] Add a full four-tier loyalty experience for Explorer, Adventurer, Voyager, and Elite.
- [x] Add explicit role-aware UI states for Guest, User, Sub-Admin, Admin, and Super Admin.
- [x] Add admin audit-log visibility with immutable-event language and export state.
- [x] Add security settings states for OTP expiry, attempt lockout, session duration, and rate limiting.
- [x] Add integration-ready settings panels for Firebase Auth, Supabase/RLS, Razorpay, FCM, Cloudinary, Cloudflare, and PWA caching.
- [x] Add installable PWA metadata and offline package cache messaging where frontend-only support is possible.

## Massive PRD Expansion

- [x] Create a dedicated auth bottom sheet with Login and Signup tabs, phone OTP, email/password, Google, Apple, resend timer, 5-minute expiry, three-attempt lockout messaging, and first-login profile completion.
- [x] Add persistent-looking auth/session states so a first-time signup returns the traveler to the booking step.
- [x] Upgrade search with full-text tags, price range, duration, category multi-select, month, group size, rating state, sorting, pagination, and view toggle controls.
- [x] Add active-trip tracking with route map, itinerary milestones, host contact, documents, ticket download state, and cancellation/support actions.
- [x] Add wallet pages for balance, credits, refunds, payment methods, transactions, gift cards, and rewards redemption states.
- [x] Add review composer with verified-stay gate, 1–5 star input, 500-character limit, tags, five-photo upload state, and helpful-vote moderation UI without fabricated reviews.
- [x] Add admin package builder with basic info, pricing tiers, itinerary day builder, inclusions, exclusions, media, draft, preview, publish, pause, archive, and duplicate states.
- [x] Add admin user detail views with booking, payment, message, document, warn, suspend, ban, restore, delete, and audit history states.
- [x] Add active broadcast composer for all users, segments, individual users, push payload, image, deep link, schedule, preview, draft, and send states.
- [x] Add announcement board, daily deal, flash sale, countdown, and scheduled campaign management UI.
- [x] Add budget planner with package cost breakdown, per-person/total formulas, selling price, margin, monthly revenue, cancellation, outstanding payment, and threshold alert views.
- [x] Add admin map/operations view, support ticket view, media folders, file validation copy, per-user PDF upload state, and immutable audit log.
- [x] Add integration status/settings screens for Firebase Auth/FCM, Supabase/RLS, Razorpay, Cloudinary, Cloudflare, and PWA cache configuration.
- [x] Add 30+ modular frontend files where it improves maintainability, with shared components for sheets, buttons, status badges, forms, tables, route maps, and admin panels.

## Production-Scale Platform Foundation

- [x] Reconcile the full PRD, pasted requirements, and existing platform routes into an implementation architecture document.
- [x] Expand the modular project structure beyond 70 purposeful source/config/test/documentation files without artificial line-count padding.
- [x] Add consistent motion tokens, spring sheet behavior, reduced-motion support, active-button feedback, and page transition patterns.
- [x] Add dedicated user routes for live trips, wallet, review composition, ticket/document vault, travel support, and booking history.
- [x] Add dedicated admin routes for package builder, traveler record, broadcast composer, budget planner, system control, and audit history.
- [x] Add frontend route guards and role-bound navigation for Guest, User, Sub-Admin, Admin, and Super Admin states.
- [x] Extend database schema and tRPC contracts for users, packages, package days, bookings, travelers, wallets, payments, wishlists, documents, reviews, broadcasts, announcements, budgets, audit events, and support tickets.
- [x] Add server-side authorization helpers for traveler ownership, package operators, admin, and super-admin procedures.
- [x] Add backend-safe placeholders and configuration documentation for Firebase Auth/FCM, Supabase/RLS migration, Razorpay, Cloudinary, and Cloudflare.
- [x] Add upload metadata and secure storage procedure foundations for tickets, PDFs, review images, and media assets.
- [x] Add Vitest coverage for permissions, booking status transitions, wallet math, OTP policy utilities, and audit event shape.
- [x] Create a detailed README, architecture notes, environment-template documentation, and GitHub-ready developer setup.
- [x] Create a private GitHub repository, push the completed source, and verify the remote after final checkpoint.

## Remaining Completion Pass

- [x] Verify drag-to-dismiss interactions for the shared bottom sheets in code and browser behavior.
- [x] Complete explicit resend, expiry, lockout, and profile-completion states in the auth sheet.
- [x] Add the remaining search controls: price, multi-category, group size, rating, and pagination.
- [x] Verify the authenticated wallet view and add payment method, gift-card, and redemption states.
- [x] Complete the admin traveler record with delete plus full booking, payment, message, and document states.
- [x] Complete the admin operations map, support-ticket, and media-folder surfaces.
- [x] Add booking transition and audit-event-shape unit tests.
- [x] Add a project README with setup, local development, database migration, and GitHub handoff instructions.

## Native Super-App Expansion

- [x] Create a mobile-first dashboard inspired by the supplied reference structure without copying its branding, including SVG-led travel service widgets, a smart search strip, offer carousel, nearby discovery grid, and an animated five-tab bottom navigation.
- [x] Add a native-style profile drawer/dashboard with avatar upload state, trip/profile/wishlist quick actions, travel money, gift cards, rewards, settings, and support widgets.
- [x] Add booking-ID plus verified contact access so a traveler can open an admin-created booking without a conventional account registration flow.
- [x] Add an admin manual-booking workspace that issues a unique booking ID, captures traveler party and pricing details, and records the booking lifecycle.
- [x] Add package-specific terms acceptance, dynamic coupon validation, taxes, add-ons, payment summary, successful-booking receipt, and invoice download/issue states.
- [x] Add traveler and admin invoice views with invoice number, billing fields, tax breakdown, payment status, and share/download controls.
- [x] Add a live trip-update system where admins publish progress, location milestones, photos, documents, and messages to a specific trip or traveler segment.
- [x] Add profile photo, package gallery, trip photo, and admin media-library upload states with validation guidance and secure storage contracts.
- [x] Add admin offer, coupon, flash-sale, featured-widget, and daily-deal controls with schedule and audience states.
- [x] Add purposeful modular files for new UI widgets, data contracts, router procedures, tests, and documentation; do not inflate file or line count artificially.
- [x] Run migrations, tests, responsive verification, create a final checkpoint, and push the completed source to `markyogi585-bot/Vyogra`.
- [x] Reconcile the manually applied schema with Drizzle migration state and verify all new migration ledger entries and operational tables.

## Native Super-App Completion Notes

- [x] Wire AdminManualBookingPage to the typed commerce procedure so booking, traveler, invoice, terms acceptance, access grant, and audit records are persisted together when the database is available.
- [x] Add a dedicated administrator invoice workspace with payment state, billing snapshot, delivery, share/download, and immutable history controls.
- [x] Add targeted live-trip publishing with booking, departure, and all-active-trip scopes plus persisted trip update and audit contracts.
- [x] Add explicit daily-deal and flash-sale controls with home-widget activation, scheduling state, audience selection, persistence contracts, and audit events.

## Landing, Authentication, and Booking Rebuild

- [x] Audit the current user-visible landing page, login/signup sheet, booking-ID access, checkout, and persisted booking routes for broken or misleading prototype states.
- [x] Replace the current public landing page with an original high-density native travel-app composition that has a stronger visual hierarchy, clearer search, service actions, live offer modules, and high-quality imagery.
- [x] Add a dedicated public-home daily-deal, flash-sale, and featured-offer rail connected to the existing campaign/widget contracts.
- [x] Remove pseudo-campaign fallback offers from the public-home rail and add explicit loading, empty, and error states driven only by live campaign query data.
- [x] Verify contract rendering for daily-deal, flash-sale, and general-offer widget kinds with focused server and UI contract tests.

## Connected Provider, Mobile, and Operations Expansion

- [x] Audit existing Firebase, Supabase, Cloudinary/S3 media, Google Maps, auth, package, booking, and live-trip implementation seams against the requested connected architecture.
- [x] Add secure, documented environment-variable contracts and status endpoints for Firebase client/admin, Supabase server access, optional Cloudinary media, and map/trip operations without committing secrets.
- [x] Extend identity and session boundaries for Firebase Google/phone authentication tokens while preserving the existing booking-ID direct-access journey and server-side role controls through provider-safe configuration guards; live credential activation remains environment-dependent.
- [x] Extend the database schema and typed APIs for multilingual traveler preferences, external provider identity mappings, package drafts with itinerary/media/terms, and persisted live location check-ins.
- [x] Build Hindi/English language controls and a modern mobile-first app shell with accessible motion and remembered locale preference.
- [x] Wire the admin package builder, manual booking workspace, traveler booking views, image/document upload states, and live-trip tracking surface to typed database procedures.
- [x] Add focused Vitest coverage for provider configuration guards, locale validation, package draft lifecycle, and live-location authorization.
- [x] Add typed create/read/upsert procedures for external provider identities, preserving the booking-ID access path until Firebase/Supabase credentials activate token verification.
- [x] Expand Hindi/English support beyond navigation labels, including traveler shell copy and persisted locale loading through the typed traveler API.
- [x] Replace static traveler booking and live-trip views with database-backed booking history, booking-access, and persisted latest-check-in states.
- [x] Add focused authorization tests for trip-location ownership and operator publishing plus package-blueprint lifecycle persistence behavior.
- [x] Expose verified external identity read/create/upsert contracts through typed server procedures without accepting unverified client claims.
- [x] Apply the locale copy system across core traveler page headings and supporting body text, not only global navigation and home.
- [x] Bind live-trip latest-check-in requests to a real booking code resolved from verified access or authenticated booking history rather than a fixed numeric ID.
- [x] Add procedure-level authorization and persistence-behavior tests for trip check-in publishing/reading and package blueprint saves.
- [x] Validate connected flows with loading, empty, error, and permission states and request provider credentials only once the existing guard-backed integration code is ready to consume them.

## Explore-Derived UI and Connected Widget Rebuild

- [x] Audit the Explore page’s information hierarchy, spacing, typography, card anatomy, filters, imagery, and responsive behavior as the visual reference for the rest of VOYAGR.
- [x] Inventory every public and dashboard widget, remove redundant decorative widgets, and map every retained action to a real route or typed mutation.
- [x] Build shared Explore-derived page shells, section headers, filter chips, cards, empty states, and action patterns for reuse across traveler and admin surfaces.
- [x] Apply the shared Explore-derived cards, section hierarchy, and connected actions to at least one admin operations surface and verify the primitive is genuinely cross-surface.
- [x] Record browser or test evidence that shared Explore-derived visual and connected-action patterns are used by both traveler and admin routes.
- [x] Add focused source-level test coverage proving the admin growth page reuses the shared Explore action grid, then capture authorized-admin browser evidence when an admin session is available.
- [x] Restyle the home page, native dashboard, booking-ID portal, checkout, wallet, trips, profile, and live-trip pages using the shared visual system.
- [x] Restyle package creation, manual booking, invoice, campaigns, trip operations, and media administration around the same connected UI patterns.
- [x] Add route/action verification coverage so interactive widgets do not remain disconnected placeholders.
- [x] Separate direct booking-ID access from account authentication and clearly explain the verification requirement for each path.
- [x] Complete the login/signup state transitions, including post-login dashboard routing, OTP request/verification failures, persistent session display, and sign-out behavior.
- [x] Connect checkout confirmation to a database-backed traveler booking record, invoice, terms acceptance, and direct access grant rather than only a locally generated confirmation.
- [x] Add a traveler booking history/dashboard view backed by the current user’s persisted records with loading, empty, and error states.
- [x] Add Vitest coverage for booking access validation, account/booking flow contracts, and persisted booking issuance helpers.
- [x] Verify desktop and phone layouts, run full type/test/build checks, checkpoint the redesign, and synchronize the requested GitHub repository.

## Final Evidence Follow-Through

- [x] Add route-level source and state contracts for loading, empty, error, and permission behaviour across every connected traveler and admin journey.
- [x] Audit remaining notification-only controls, retain only real browser actions as secondary affordances, and map all primary controls to routes or typed mutations.
- [x] Extend native-administration parity evidence to invoice, trip-operations, and media workspaces.
- [x] Add explicit auth-session transition tests for OTP failure, login completion routing, persistence, and sign-out cleanup.
- [x] Re-run all verification, save a final checkpoint, and push the resulting source state to the configured GitHub remote.
- [x] Restore the unresponsive development server and verify the live preview responds after restart.

## 2026 Native-App Full UI Replacement

- [x] Extract the attached PRD’s native mobile interaction, package-first discovery, bottom-sheet, service-widget, visual hierarchy, and role-control requirements into a page-level redesign matrix.
- [x] Replace global visual tokens, type scale, tactile surfaces, motion choreography, safe-area behavior, and navigation primitives with one coherent 2026 native travel-app system.
- [x] Audit each named traveler route and capture code/test/production-preview evidence for its connected native layout.
- [x] Audit each named administrative route and capture code/test/authorized-preview evidence for its connected native layout.
- [x] Replace or clearly demote any remaining toast-only primary control; add coverage for retained route, sheet, and typed-mutation actions.
- [x] Run route-by-route responsive and state verification, including loading, empty, error, permission, Hindi/English, and reduced-motion behavior.
- [x] Resolve and verify the React/tRPC development-preview provider mismatch without relying solely on the production bundle.

## Firebase Backend Integration — tour-b631c

- [x] Load and apply the Firebase agent workflow for project tour-b631c, then audit the existing VOYAGR authentication and data boundaries.
- [x] Register or verify the VOYAGR web app in tour-b631c and configure its Firebase client settings without exposing server credentials.
- [x] Add Firebase Authentication support for email/password, Google Sign-In, and phone verification while preserving account-free booking-ID access.
- [x] Add Firestore-backed traveler profile and selected travel data boundaries with security-rule documentation and typed UI integration.
- [x] Add Firebase flow tests, run type/test/build verification, checkpoint, and synchronize the completed integration.

## Firebase-Connected Traveler and Operations Workflows

- [x] Replace simulated Google, email/password, and phone OTP completion with Firebase SDK authentication and provider-aware error states.
- [x] Hydrate the traveler session from Firebase identity and persist a minimal Firestore profile without weakening account-free booking-ID access.
- [x] Connect administrator and traveler role records to Firebase identity mapping while retaining server-side role authorization.
- [x] Add Firestore-oriented booking, invoice, and support boundaries with secure ownership and operator-only documentation.
- [x] Audit rules and connected flows, run regression checks, checkpoint, and synchronize the Firebase release.
- [ ] Deploy Firebase Authentication provider settings and Firestore rules to tour-b631c with an owner-authorized Firebase CLI session (deferred at the user’s request not to log in here).

## Screenshot-Driven Mobile UI Repair

- [x] Audit the supplied phone screenshots against VOYAGR’s account, home, package-card, and bottom-navigation component styles.
- [x] Repair mobile card widths, horizontal overflow, text wrapping, colour contrast, old layout fragments, and safe-area bottom navigation.
- [x] Verify the corrected home, account, explore, package, booking-access, checkout, and wallet layouts at phone and desktop breakpoints.
- [x] Add focused visual-contract coverage, run full checks, checkpoint, and push the UI repair to GitHub.

## Gift-Card Removal and Responsive Content Cleanup

- [x] Remove gift-card entry points, wallet references, and data/UI affordances without leaving dead navigation or orphaned copy.
- [x] Replace or remove empty visual containers across responsive traveler routes so each card contains a real action, state, or useful travel information.
- [x] Verify mobile and desktop package discovery, booking, login, and navigation flows remain connected and responsive after the cleanup.
- [x] Add regression coverage, run checks, checkpoint, and synchronize the cleanup to GitHub.

## Final Bottom Navigation Alignment

- [x] Correct the mobile bottom navigation geometry, label visibility, active state, and safe-area spacing for Home, Explore, Trips, Saved, and Profile actions.
- [x] Verify the corrected bottom navigation alongside the mobile and desktop package, booking, login, account, and wallet journeys, then checkpoint the ready-to-publish build.

## Connected Admin, Child Traveler, and Support Expansion

- [x] Audit existing package creation, manual booking, traveler, announcement, broadcast, notification, and support procedures/pages to extend real connected capabilities rather than duplicate placeholders.
- [x] Add backend contracts and tests for child travelers attached to bookings, operator announcements, and manual support tickets with lifecycle controls.
- [x] Build connected administrator workspaces for packages, child travelers, announcement publishing, notification/broadcast status, and support queue operations.
- [x] Add traveler-facing announcement, notification, contact, WhatsApp handoff, child-traveler, and manual-support entry points with explicit permissions and error states.
- [x] Verify the expansion at mobile and desktop breakpoints, run checks, checkpoint, and synchronize GitHub.

## Secure Trip-Aware Traveler Polish

- [x] Audit every wallet link, traveler route, booking/login transition, cookie/session boundary, and URL-driven booking or invoice entry point.
- [x] Remove wallet routes, navigation, and copy without leaving redirects or disconnected account controls.
- [x] Harden signed-in booking, invoice, map, and active-trip URL guards with explicit ownership, booking-access, expiry, and error states.
- [x] Build polished separate exploration, invoice, map/weather, and active-trip dashboards, including automatic active-trip dashboard routing for eligible travelers.
- [x] Add focused security and route contracts, verify mobile and desktop workflows, checkpoint, and synchronize GitHub.

## Production Booking and Operations Ecosystem

- [x] Extend the booking lifecycle for free verified booking-ID access, booking-date or itinerary extension, additional charges, invoice revisions, cancellation requests, refund review, payment and refund state visibility, and audit trails.
- [x] Add a hardened traveler booking desk with upcoming, active, completed, cancelled, refunded, and action-required trip views, including protected direct URL handling.
- [x] Build a shareable trip-summary experience with revocable public share links, image-based social previews, and no exposure of traveler personal, booking, invoice, or live-location data.
- [x] Expand administrator booking operations with a real traveler-detail workspace for trip messages, broadcasts, itinerary and date extensions, additional charges, invoice controls, media, support, cancellation, refunds, and immutable history.
- [x] Add Firebase-ready push-notification device registration and delivery records, with in-app broadcast fallback and provider credentials kept server-side.
- [x] Add crawlable sitemap, robots policy, canonical and social preview metadata, structured travel data, and production deployment documentation without promising search-engine ranking.
- [x] Add focused lifecycle, authorization, URL-hardening, sharing, SEO, and push-readiness tests; verify phone and desktop flows; checkpoint; and synchronize GitHub.

## Admin Mobile Access and Firebase Profile Controls

- [x] Repair the protected `/admin` mobile entry state so authorized admin sessions can reach the workspace while unauthorized users retain the server-enforced boundary.
- [x] Add a visible admin logout action that clears the active Manus/Firebase session state and returns safely to the public landing route.
- [x] Add an admin profile/settings page with connected identity, role, Firebase connection status, account preferences, and safe navigation back to operations.
- [x] Add focused auth/admin route contracts, verify mobile layout and logout/profile/settings flows, run checks, checkpoint, and synchronize the live build.

## Google Login and Admin Role Hydration Repair
- [x] Fix Firebase Google sign-in completion, ensure the ID token reaches server procedures, and hydrate the authoritative database-backed admin role without trusting client claims.
- [ ] Verify an authorized administrator reaches `/admin` after sign-in while guests and standard users remain blocked by the role gate.
- [x] Add focused regression tests, run the full verification suite, and publish the repair.

## Demo Booking Access Repair

- [x] Make the advertised non-production demo booking ID and last-four contact check work through an explicitly segregated demo-only route without weakening database-backed access to real bookings.
- [x] Add regression coverage proving the demo path works while unseeded or mismatched real booking attempts remain rejected; verify, publish, and push the repair.

## Cache-Independent Demo Entry

- [x] Add an explicit direct demo dashboard entry from the booking-access page so stale mobile browser bundles do not block the safe non-production demo journey.
- [x] Add regression coverage, verify the direct mobile path, publish, and push the cache-independent demo entry repair.

## Firebase Login, Admin Access, Booking, and Package Operations

- [ ] Audit and complete Firebase Authentication activation requirements, connected login/logout presentation, and authoritative user-role hydration for protected administrator routes.
- [ ] Connect package creation, publication, booking issuance, secured booking-ID access, invoice state, and traveler communications through the existing server and database contracts.
- [ ] Verify that guests, travelers, administrators, and super-administrators receive only their permitted screens and actions at phone and desktop breakpoints.
- [ ] Add workflow and authorization regression coverage; publish the verified Firebase-connected operations update and synchronize GitHub.

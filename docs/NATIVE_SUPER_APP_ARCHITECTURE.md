# VOYAGR Native Super-App Architecture

## Product Direction

The next VOYAGR release extends the current premium travel platform into an original mobile-first super-app. The supplied references guide the **interaction density**—service widgets, rounded content containers, profile drawers, persistent bottom navigation, and offer-led discovery—without copying their branding, layout, or proprietary visual assets. VOYAGR remains identifiable through its forest-teal, sand, and kumquat palette, editorial travel imagery, SVG iconography, and route-led language.

## Core Journey Model

| Journey | Entry | Key state | Outcome |
|---|---|---|---|
| Guest discovery | Dashboard or package route | No identity required | Browse packages, offers, categories, and search |
| Booking-ID access | Booking code plus verified contact | Admin-created traveler record | Open itinerary, invoice, documents, and live updates without account registration |
| Full traveler account | OTP, Google, email, or Apple | Persistent profile | Manage trips, wallet, reviews, wishlists, and support |
| Admin manual booking | Admin command center | Staff role guard | Create traveler, quote totals, accept terms, issue booking ID and invoice |
| Live trip operations | Admin or trip host | Authorized active booking | Publish milestones, coordinates, media, documents, and targeted messages |

## Native Dashboard System

The mobile dashboard contains four layers. A compact header gives access to search and profile. A smart travel prompt opens a search sheet. Service widgets provide quick entry to Packages, Stays, Transfers, Insurance, Visa, Experiences, Gift Cards, and Wallet. The content rail then combines offers, nearby routes, trending packages, and featured editorial cards. The five-tab dock routes to Home, Trips, Search, Saved, and Profile.

Every interface icon uses Lucide or custom SVG. High-quality photography belongs in card and campaign imagery, not in functional controls. Motion uses spring transitions, responsive press states, swipeable rails, bottom-sheet drag dismissal, and reduced-motion fallbacks.

## Data and API Additions

| Domain | New contract |
|---|---|
| Booking access | Contact-verified booking lookup token, access log, expiration, and direct traveler dashboard route |
| Manual bookings | Quote record, traveler parties, add-ons, coupon snapshot, terms acceptance, payment collection state, booking ID issuance |
| Financial records | Invoices, invoice line items, taxes, payment references, refunds, and share/download state |
| Commerce | Package terms revisions, coupons, redemptions, flash-sale rules, featured widgets, daily deals |
| Live operations | Trip updates, location milestones, trip media, trip messages, host notes, delivery audiences |
| Profile media | Avatar metadata, media validation, private document boundaries, asset folders |

## Security Boundaries

Booking-ID access does not replace identity security. The booking code must be paired with a verified contact value or short-lived access token, rate-limited, logged, and scoped only to that booking. Admin-only manual booking, coupon management, invoice issue, media publication, and trip broadcasts remain role-guarded on the server. The browser can improve navigation, but server procedures remain authoritative.

## Delivery Target

The final source must be synchronized to the requested private repository: `https://github.com/markyogi585-bot/Vyogra`.

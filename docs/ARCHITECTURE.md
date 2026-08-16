# VOYAGR Platform Architecture

## Product Boundary

VOYAGR is organized as a mobile-first travel marketplace plus a role-aware operations workspace. The public traveler application is package-first and uses spring bottom sheets for high-frequency actions. The operations workspace serves Sub-Admin, Admin, and Super Admin roles through a persistent command center and dedicated operational routes.

## Application Layers

| Layer | Responsibility | Primary modules |
|---|---|---|
| Presentation | Responsive traveler and admin experiences | `client/src/pages`, `client/src/components` |
| Interaction | Bottom sheets, motion tokens, session gates | `components/sheets`, `contexts/TravelSessionContext.tsx` |
| API contract | Typed queries and mutations | `server/routers`, `server/routers/*` |
| Domain model | Packages, bookings, wallets, documents, reviews, operations | `drizzle/schema.ts`, `shared/*` |
| Storage | Private document/media bytes with metadata in the database | `server/storage.ts`, `documents` table |
| Security | Role checks, ownership checks, audit events, rate limits | `server/security`, `server/audit` |

## Authentication Strategy

The UI supports phone OTP, email/password, Google, and Apple entry points. Production Firebase authentication requires secure Firebase environment settings and provider configuration. Google sign-in is implemented with the Firebase provider flow, while mobile web should prefer redirect handling instead of a popup when appropriate. [1]

Phone verification requires Firebase’s reCAPTCHA verifier and an SMS region policy, alongside application-side lockout, device-risk, and rate-limit controls. Firebase cautions that phone-only authentication is weaker than a multi-method posture, so the platform keeps Google and email options available. [2]

## Data and Authorization Strategy

The current full-stack template uses typed tRPC procedures and a relational database. The production integration layer is designed so that the same domain model can be mapped to Supabase PostgreSQL. Supabase requires RLS on tables exposed to browser access; its documentation specifically advises RLS for exposed schemas and says service keys must never reach the browser. [3]

The authoritative role model is:

| Role | Intended authority |
|---|---|
| Guest | Public package discovery only |
| User | Own bookings, wallet, wishlist, documents, reviews |
| Sub-Admin | Package operations and assigned bookings |
| Admin | Travelers, campaigns, budgets, and moderation |
| Super Admin | System policy, integration, audit, and role control |

## Payment Strategy

The booking experience creates a backend payment intent/order before opening any production checkout. Razorpay’s Standard Checkout is an appropriate first integration path; its live credentials remain server-side and webhook validation updates booking/payment state. [4]

## Delivery Sequence

1. Build the full domain schema and protected procedure layer.
2. Connect frontend modules to typed queries and mutations.
3. Configure Firebase, Razorpay, Cloudinary, and optional Supabase secrets.
4. Run database migrations, seed only non-user-generated catalog content, and test role boundaries.
5. Configure production domains, Cloudflare, monitoring, backups, and incident processes.

## References

[1]: https://firebase.google.com/docs/auth/web/google-signin "Firebase: Authenticate Using Google with JavaScript"
[2]: https://firebase.google.com/docs/auth/web/phone-auth "Firebase: Authenticate with Phone Number Using JavaScript"
[3]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase: Row Level Security"
[4]: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/ "Razorpay: Standard Web Checkout"

# VOYAGR

VOYAGR is a premium, mobile-first travel platform foundation for Indian travel companies. The public experience starts with package discovery rather than a login wall. Booking, wallet, reviews, and account actions open spring bottom sheets that guide a traveler through persistent sign-in and a structured journey lifecycle.

## What Is Included

| Area | Implemented foundation |
|---|---|
| Traveler experience | Editorial package discovery, search, package detail, booking, persistent local sign-in prototype, wishlist, notifications, account, and loyalty surfaces |
| Trip operations | Live trip timeline, route-map surface, local host actions, ticket/document vault, support entry points, and review composer |
| Wallet and payments | Wallet privacy gate, balance/credit/refund/payment UI, booking total calculation, payment order contract, and Razorpay integration boundary |
| Admin command center | Package builder, traveler controls, broadcasts, budget planner, integrations, audit timeline, field operations, support queue, and media/document states |
| Backend foundation | Full relational schema, typed tRPC routers, ownership/role guards, audit recording, storage policy, and environment-safe integration status modules |
| Quality | Responsive Monsoon Modern system, spring bottom sheets, reduced-motion support, database migration, and Vitest coverage |

## Local Development

Install dependencies with `pnpm install`. Start the project with `pnpm dev`. Validate TypeScript with `pnpm check`, run unit tests with `pnpm test`, and create a production bundle with `pnpm build`.

## Database Workflow

The schema lives in `drizzle/schema.ts`. After altering it, run `pnpm drizzle-kit generate`, review the generated file under `drizzle/`, and apply it with `pnpm drizzle-kit migrate`. The implemented schema contains users, packages, itineraries, departures, bookings, travelers, payments, wallets, wishlists, documents, reviews, broadcasts, announcements, budget lines, support tickets, OTP attempts, and audit events.

## Integrations

External services are intentionally **configuration-ready**, not connected with embedded secrets. Configure values through the project secret manager, never in source control. See [`docs/ENV_TEMPLATE.md`](./docs/ENV_TEMPLATE.md) and [`docs/ENVIRONMENT.md`](./docs/ENVIRONMENT.md) for the exact variables and safety boundaries.

Firebase supports Google and phone authentication, while phone sign-in requires an allowed domain, configured SMS region policy, and reCAPTCHA. [1] Supabase requires RLS on any browser-exposed schema, and service keys must never be sent to clients. [2] Razorpay orders, payments, and webhook verification must be handled server-side. [3]

## Key Documentation

| Document | Purpose |
|---|---|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Product and platform architecture |
| [`docs/SECURITY.md`](./docs/SECURITY.md) | Trust boundaries, roles, ownership, payments, and audit principles |
| [`docs/ENVIRONMENT.md`](./docs/ENVIRONMENT.md) | Secret categories and operational notes |
| [`docs/VERIFICATION.md`](./docs/VERIFICATION.md) | Fresh-browser route and interaction verification evidence |

## GitHub Handoff

The repository should remain private until live service credentials, legal pages, and production monitoring are complete. After the final checkpoint, create a private repository, add it as `origin`, push the branch, and protect the default branch. Do not include `.env` files, provider keys, database exports, user documents, or payment webhook payloads in Git history.

## References

[1]: https://firebase.google.com/docs/auth/web/phone-auth "Firebase: Authenticate with a Phone Number Using JavaScript"
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase: Row Level Security"
[3]: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/ "Razorpay: Standard Web Checkout"

# Security Model

## Trust Boundaries

The browser may discover public packages but cannot be trusted with privileged actions, payment verification, document access policy, or administrative authorization. Every state-changing API requires a server-side authorization decision and a structured audit event.

## Required Controls

| Control | Design requirement |
|---|---|
| Authentication | OTP expiry, attempt tracking, rate limiting, multi-method sign-in |
| Authorization | Role guard plus traveler-ownership checks on each protected procedure |
| Payments | Server-generated order, webhook signature verification, idempotent payment updates |
| Documents | Private storage key, database metadata, user ownership or operator permission check |
| Admin actions | Actor, target, event type, timestamp, and immutable audit payload |
| Input safety | Zod validation for all public and protected API inputs |
| Session safety | Secure, HTTP-only server session cookies; never trust a role received from browser state |

## Role Gate Principle

The frontend is responsible for clear navigation and helpful unauthorized states. The backend is the source of truth: a hidden button is never an authorization mechanism. Each procedure must validate both role and record ownership before returning or mutating data.

## Review Integrity

VOYAGR will not manufacture reviews, ratings, or testimonials. Review creation remains gated by a completed booking, and moderation state must be retained before user-generated feedback is presented publicly.

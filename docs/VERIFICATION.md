# Verification Notes

## Fresh Browser Route Check

The screenshot preview service retained a stale client bundle after the full-stack upgrade and initially showed an invalid React hook error on nested paths. Fresh navigations with a cache-busting query confirmed that the current development server renders the expanded routes correctly.

| Route | Verified capability |
|---|---|
| `/trips/live` | Live route header, route-map container, timeline, local host actions, and ticket/document vault |
| `/admin/packages/new` | Role-aware package-builder stepper, basic route information form, and guided draft/publish workflow |

The package-detail booking action was also checked in a fresh browser. A guest pressing **Book this journey** receives the shared mobile-style bottom sheet rather than a login wall or popup. The sheet exposes Login/Create Account tabs plus phone OTP, email, Google, and Apple entry points, and explains that Firebase configuration is required before production verification is enabled.

The wallet route correctly presents a private-data gate to guests and reuses the same bottom sheet with a wallet-specific continuation message. This preserves the product requirement that a user signs in once before ongoing access to stored traveler tools.

The admin broadcast route was verified in a fresh browser with audience segmentation, title/body fields, media and schedule controls, and a device-style notification preview. Activating the prototype action changes it to **Broadcast queued** without sending any real notification, which keeps the interface demonstrable before FCM credentials and server delivery are connected.

Fresh-browser verification also confirmed the detailed traveler record: booking, settled payment, private ticket-document, message, warning/suspension, ban, restore, deletion, and traveler-specific immutable audit-history states are visible. The field-operations route renders an actual map surface alongside live-departure context, support queue, secure media/document states, and PDF upload validation guidance.

The wallet was tested through the local prototype sign-in flow. Opening the secure sign-in sheet and selecting the marked prototype Google entry persisted a traveler session and unlocked balance, refund, loyalty credit, payment method, gift-card, booking-offset, and statement-download states. No external Google transaction was initiated; Firebase connection remains an explicit production configuration step.

The current homepage was verified again in a fresh browser after the final route-guard work and renders the complete Monsoon Modern traveler landing experience. A signed-in traveler navigating to `/admin` now receives a client-side role-bound workspace boundary, while server procedures retain independent authorization checks.

The native dashboard route at `/app` was verified in a fresh browser after the super-app expansion. Its service widgets, offer rail, booking-ID entry point, persistent navigation dock, and profile drawer all render and route correctly. The profile drawer exposes native-style trip, profile, saved, wallet, loyalty, support, and settings actions for an authenticated traveler.

The booking-ID access flow was exercised end to end using the issued demo booking and a verified contact suffix. It correctly opened the scoped traveler portal with trip milestones, traveler party, ticket state, invoice entry, stay confirmation, host contact, sharing action, and support access without requiring conventional account registration.

The native checkout flow was also exercised in a fresh browser. A valid route coupon correctly reduced the total, package-specific terms had to be accepted before payment confirmation, and the successful-booking state issued a booking ID with immediate trip-desk and invoice actions. This is a frontend workflow until a production payment provider and booking persistence are connected.

The native dashboard was verified in a fresh browser with its original VOYAGR service grid, search prompt, offer rail, discovery imagery, booking-ID entry point, and five-tab mobile dock visible. A later screenshot-runner capture rendered stale blank/error frames that still referenced a removed ThemeProvider bundle; this differs from the fresh-browser route and is treated as a preview-cache artifact, not current application behavior. The affected views should be rechecked after the next server restart.

After restarting the development server, the fresh browser route was checked again and the native dashboard rendered correctly with the current service widgets, offer rail, discovery imagery, and bottom dock. This confirms the stale screenshot-runner frames did not reflect the current browser bundle.

The service-worker registration now explicitly unregisters itself in the development preview domain, while production registrations keep the package-shell offline capability.

# External Service Variable Template

This project intentionally keeps only variable names and architecture notes in source control. Add actual values through the project secret manager; do not create or commit `.env` files.

| Service | Variables | Client exposure |
|---|---|---|
| Firebase Web | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase web bootstrap only; values are public project configuration, not Admin credentials |
| Firebase Admin | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Never expose |
| Supabase | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Anon key is only used for RLS-controlled browser work; service key is server-only |
| Managed storage | Platform-provided storage credentials | Default for package images, trip media, tickets, and travel documents; no user secret required |
| Maps | Platform-provided Maps proxy | Default for routes, directions, and persisted trip-location display; no user key required |
| Razorpay | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Checkout key only after server order creation |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Signed server upload only |
| Cloudflare | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` | Never expose |

# Environment Configuration

## Rules

Never commit real credentials, service-role keys, webhook secrets, or production payment keys. Store all runtime secrets through the project secret manager. The variable-name template is maintained in [`ENV_TEMPLATE.md`](./ENV_TEMPLATE.md).

## Required Runtime Categories

| Category | Variables | Used for |
|---|---|---|
| Manus full-stack | `DATABASE_URL`, `JWT_SECRET`, OAuth variables | Project database and built-in identity |
| Firebase client | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | Google, Apple, and phone auth bootstrap |
| Firebase server | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Token verification and FCM administration |
| Supabase server | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Controlled migration or server-only operations |
| Razorpay | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Orders, signatures, refunds, webhooks |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Media upload and transformation |
| Cloudflare | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` | Optional edge configuration automation |

## Operational Notes

Firebase phone auth requires an authorized domain, configured SMS region policy, and reCAPTCHA. Google sign-in requires an enabled provider and authorized redirect domain. [1] [2]

If Supabase is chosen for browser-accessible data, enable RLS on every exposed table and use policies that identify the caller and table ownership. Never expose a Supabase service-role key to the client. [3]

Razorpay orders and signature verification must happen server-side. Client code receives only the publishable checkout key and safe order metadata. [4]

## References

[1]: https://firebase.google.com/docs/auth/web/google-signin "Firebase: Google sign-in"
[2]: https://firebase.google.com/docs/auth/web/phone-auth "Firebase: Phone sign-in"
[3]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase: RLS"
[4]: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/ "Razorpay: Standard Checkout"

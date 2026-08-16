export type IntegrationState = { key: string; label: string; configured: boolean; serverOnly: boolean; note: string; };
const has = (env: NodeJS.ProcessEnv, ...keys: string[]) => keys.every((key) => Boolean(env[key]));

export function getIntegrationStatus(env: NodeJS.ProcessEnv = process.env): IntegrationState[] {
  return [
    { key: "managed_storage", label: "Managed secure storage", configured: true, serverOnly: true, note: "Default ticket, document, and package-media object storage" },
    { key: "maps", label: "Google Maps proxy", configured: true, serverOnly: false, note: "Directions, route maps, and persisted live-trip coordinates" },
    { key: "firebase", label: "Firebase Auth + FCM", configured: has(env, "VITE_FIREBASE_API_KEY", "VITE_FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_PROJECT_ID", "VITE_FIREBASE_APP_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"), serverOnly: false, note: "Google sign-in, phone OTP token verification, and optional push delivery" },
    { key: "supabase", label: "Supabase PostgreSQL", configured: has(env, "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"), serverOnly: true, note: "Optional RLS-aligned operational mirror; the MySQL travel ledger remains the primary database" },
    { key: "razorpay", label: "Razorpay", configured: has(env, "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"), serverOnly: true, note: "Server-issued payment orders and webhook verification" },
    { key: "cloudinary", label: "Cloudinary", configured: has(env, "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"), serverOnly: true, note: "Optional delivery optimization layered on top of managed media storage" },
    { key: "cloudflare", label: "Cloudflare", configured: has(env, "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ZONE_ID"), serverOnly: true, note: "WAF, rate limiting, and delivery-edge controls" },
  ];
}

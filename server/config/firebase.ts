export function firebaseClientConfigured() { return Boolean(process.env.VITE_FIREBASE_API_KEY && process.env.VITE_FIREBASE_PROJECT_ID && process.env.VITE_FIREBASE_APP_ID); }
export function firebaseAdminConfigured() { return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY); }
export const firebaseAuthPolicy = { otpExpiryMinutes: 5, otpMaxAttempts: 3, otpLockoutMinutes: 30, preferredMobileOAuthFlow: "redirect" as const };

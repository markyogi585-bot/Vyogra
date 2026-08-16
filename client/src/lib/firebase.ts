import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const suppliedConfig = {
  apiKey: "AIzaSyDRn9CF5IBK4lHPMK71BqPFtArYl5pQ1Hs",
  authDomain: "tour-b631c.firebaseapp.com",
  projectId: "tour-b631c",
  storageBucket: "tour-b631c.firebasestorage.app",
  messagingSenderId: "344955863291",
  appId: "1:344955863291:web:2c9fb4e2316c5b4277705e",
  measurementId: "G-J9RQMGWKZX",
} as const;

/**
 * Firebase web identifiers are intentionally public and are supplied by the
 * Firebase console. Managed Vite values override the supplied registration so
 * production can rotate a web app without a source-code edit.
 */
export const firebaseWebConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || suppliedConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || suppliedConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || suppliedConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || suppliedConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || suppliedConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || suppliedConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || suppliedConfig.measurementId,
};

export const firebaseClientConfigured = Boolean(
  firebaseWebConfig.apiKey && firebaseWebConfig.authDomain && firebaseWebConfig.projectId && firebaseWebConfig.appId,
);

export const firebaseApp: FirebaseApp | null = firebaseClientConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseWebConfig))
  : null;

export const firebaseAuth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
export const firebaseDb: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;

export function firebaseErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const messages: Record<string, string> = {
    "auth/account-exists-with-different-credential": "This email already uses a different sign-in method.",
    "auth/captcha-check-failed": "The phone verification check expired. Please try again.",
    "auth/email-already-in-use": "An account already exists for this email. Try logging in instead.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/invalid-verification-code": "That verification code is not correct.",
    "auth/invalid-phone-number": "Enter a valid 10-digit Indian mobile number.",
    "auth/invalid-credential": "The email or password is not correct.",
    "auth/missing-password": "Enter your password to continue.",
    "auth/network-request-failed": "We could not reach the secure sign-in service. Check your connection and retry.",
    "auth/operation-not-allowed": "This sign-in method has not yet been enabled for VOYAGR’s Firebase project.",
    "auth/popup-blocked": "Your browser blocked the sign-in window. Please allow pop-ups and try again.",
    "auth/popup-closed-by-user": "Google sign-in was closed before completion.",
    "auth/too-many-requests": "Too many requests were made. Please wait before trying again.",
    "auth/unauthorized-domain": "This website domain is not yet approved for Firebase sign-in.",
    "auth/user-not-found": "No account was found for this email. Create an account instead.",
    "auth/wrong-password": "The email or password is not correct.",
  };
  return messages[code] ?? "We could not complete secure sign-in. Please try again.";
}

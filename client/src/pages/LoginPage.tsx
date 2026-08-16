/**
 * /login — Dedicated full-page login / register for mobile users.
 * Desktop users see the bottom-sheet. This page is always accessible.
 */
import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getRedirectResult,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
  type User,
} from "firebase/auth";
import { Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import type { SessionProfile } from "@/lib/travelTypes";
import { firebaseAuth, firebaseErrorMessage } from "@/lib/firebase";
import { firebaseProfileFromUser, upsertFirebaseTravelerProfile } from "@/lib/firebaseProfile";

export default function LoginPage() {
  const { completeAuth, profile } = useTravelSession();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, redirect to account
  useEffect(() => {
    if (profile) navigate("/account");
  }, [profile, navigate]);

  // Handle Google redirect result (mobile)
  useEffect(() => {
    if (!firebaseAuth) return;
    getRedirectResult(firebaseAuth)
      .then((result) => {
        if (result?.user) void saveSession(result.user, "google");
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const saveSession = async (user: User, method: SessionProfile["loginMethod"]) => {
    const identity = firebaseProfileFromUser(user);
    const nextProfile: SessionProfile = {
      uid: identity.uid,
      name: identity.displayName,
      phone: identity.phone,
      email: identity.email,
      role: "user",
      loginMethod: method,
      emailVerified: user.emailVerified,
    };
    try { await upsertFirebaseTravelerProfile(identity); } catch { /* best-effort */ }
    completeAuth(nextProfile);
    toast.success("🚩 Welcome! Signed in successfully.");
    navigate("/account");
  };

  const googleLogin = async () => {
    if (!firebaseAuth) {
      setError("Firebase Auth is not initialized. Please refresh the page.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      try {
        const result = await signInWithPopup(firebaseAuth, provider);
        if (result?.user) {
          await saveSession(result.user, "google");
          return;
        }
      } catch (popupErr: any) {
        const code = String(popupErr?.code ?? "");
        console.warn("[Firebase Google Auth] Popup attempt:", code, popupErr);

        if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
          await signInWithRedirect(firebaseAuth, provider);
          return;
        } else if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
          setError("Google sign-in popup was closed.");
          return;
        } else {
          setError(firebaseErrorMessage(popupErr));
          return;
        }
      }
    } catch (authError) {
      setError(firebaseErrorMessage(authError));
    } finally {
      setSubmitting(false);
    }
  };

  const emailAuth = async () => {
    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }
    if (tab === "signup" && form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!firebaseAuth) { setError("Firebase not configured."); return; }
    try {
      setSubmitting(true);
      setError("");
      const result =
        tab === "signup"
          ? await createUserWithEmailAndPassword(firebaseAuth, form.email.trim(), form.password)
          : await signInWithEmailAndPassword(firebaseAuth, form.email.trim(), form.password);
      if (tab === "signup" && form.name.trim()) {
        await updateProfile(result.user, { displayName: form.name.trim() });
      }
      await saveSession(result.user, "email");
    } catch (authError) {
      setError(firebaseErrorMessage(authError));
    } finally {
      setSubmitting(false);
    }
  };

  const resetTab = (nextTab: "login" | "signup") => {
    setTab(nextTab);
    setForm({ name: "", email: "", password: "" });
    setError("");
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(145deg, #0d211c 0%, #1b3831 50%, #183a37 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 20px",
      fontFamily: "'Manrope', sans-serif",
    }}>
      {/* Back link */}
      <div style={{ width: "100%", maxWidth: 420, marginBottom: 16 }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>
      </div>

      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "#fbf9f4",
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
      }}>
        {/* Header */}
        <div style={{
          padding: "32px 32px 24px",
          background: "#183a37",
          color: "#fffaf2",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", color: "#f06a3a", marginBottom: 8 }}>
            🚩 HAR HAR MAHADEV TOURS & TRAVELS
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, fontWeight: 400, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Google Sign-In
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,250,242,0.75)", lineHeight: 1.5 }}>
            Sign in with your Google account to access your bookings and e-passes.
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: "32px 28px", display: "flex", flexDirection: "column", gap: 18, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            Sign in with your official Google account to manage your yatra bookings, downloadable e-passes, and companion desk.
          </p>

          {/* Google */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => void googleLogin()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "16px 24px",
              background: "#ffffff",
              border: "2px solid #4285F4",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 900,
              color: "#183a37",
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "0 8px 24px rgba(66,133,244,0.18)",
              width: "100%",
            }}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              style={{ width: 24, height: 24 }}
            />
            {submitting ? "Connecting to Google…" : "Sign In with Google Account"}
          </button>

          {error && (
            <div style={{ padding: "10px 14px", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 12, fontWeight: 700 }}>
              ⚠️ {error}
            </div>
          )}

          <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, margin: 0, color: "#166534", fontSize: 11, fontWeight: 700 }}>
            <ShieldCheck size={16} />
            <span>100% Secure sign-in powered by Google Firebase Security</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 24, color: "rgba(255,255,255,0.4)", fontSize: 11, textAlign: "center" }}>
        © 2026 Har Har Mahadev Tours & Travels. Sacred journeys made simple.
      </p>
    </div>
  );
}

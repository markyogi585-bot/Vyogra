import { useState } from "react";
import { ArrowLeft, CheckCircle2, Edit3, LoaderCircle, LogOut, Save, ShieldCheck, Smartphone, UserRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import { firebaseAuth, firebaseDb } from "@/lib/firebase";

export default function AdminProfileSettingsPage() {
  const { profile, locale, setLocale, signOut, completeAuth } = useTravelSession();
  const [, navigate] = useLocation();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);

  const logout = () => {
    signOut();
    toast.success("Signed out securely.");
    navigate("/");
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      if (firebaseAuth?.currentUser) {
        await updateProfile(firebaseAuth.currentUser, { displayName });
      }
      if (firebaseDb && profile?.uid) {
        const userDocRef = doc(firebaseDb, "travelerProfiles", profile.uid);
        await updateDoc(userDocRef, {
          displayName,
          phone,
        });
      }
      if (profile) {
        completeAuth({
          ...profile,
          name: displayName,
          phone,
        });
      }
      setEditing(false);
      toast.success("Admin profile updated successfully!");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const providerLabel =
    profile?.loginMethod === "google"
      ? "Firebase Google Sign-In"
      : profile?.loginMethod === "otp"
        ? "Firebase Phone Authentication"
        : profile?.loginMethod === "email"
          ? "Firebase Email Authentication"
          : "Firebase identity session";

  return (
    <AdminPageFrame eyebrow="ADMIN / PROFILE SETTINGS" title={<>Your operations<br /><i>identity.</i></>}>
      <div className="admin-settings-layout">
        <section className="admin-settings-card admin-identity-card">
          <div className="admin-settings-avatar">
            {profile?.name?.slice(0, 2).toUpperCase() ?? "AD"}
          </div>
          <span className="admin-overline"><ShieldCheck size={13} /> ROLE-BOUND ADMIN SESSION</span>
          <h2>{profile?.name ?? "Administrator"}</h2>
          <p>{profile?.email ?? profile?.phone ?? "Firebase-authenticated account"}</p>
          <div className="admin-role-chip">
            <CheckCircle2 size={14} /> {profile?.role?.replaceAll("_", " ").toUpperCase() ?? "ADMIN"}
          </div>
        </section>

        <section className="admin-settings-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span className="admin-overline" style={{ margin: 0 }}>
              <UserRound size={13} /> PROFILE DETAILS
            </span>
            <button
              onClick={() => {
                if (editing) handleSave();
                else setEditing(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid rgba(0,0,0,0.12)",
                background: editing ? "var(--color-brand, #f06a3a)" : "white",
                color: editing ? "white" : "inherit",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {saving ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : editing ? (
                <Save size={14} />
              ) : (
                <Edit3 size={14} />
              )}
              {saving ? "Saving…" : editing ? "Save Profile" : "Edit Profile"}
            </button>
          </div>

          <div className="admin-setting-row">
            <span>Display Name</span>
            {editing ? (
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.15)", fontSize: 13 }}
              />
            ) : (
              <b>{profile?.name ?? "Admin"}</b>
            )}
          </div>
          <div className="admin-setting-row">
            <span>Phone Number</span>
            {editing ? (
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 00000 00000"
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.15)", fontSize: 13 }}
              />
            ) : (
              <b>{profile?.phone || "Not set"}</b>
            )}
          </div>
          <div className="admin-setting-row">
            <span>Identity provider</span>
            <b>{providerLabel}</b>
          </div>
          <div className="admin-setting-row">
            <span>Email verification</span>
            <b>{profile?.emailVerified ? "Verified" : "Provider-managed"}</b>
          </div>
          <div className="admin-setting-row">
            <span>Preferred language</span>
            <select
              value={locale}
              onChange={(event) => {
                setLocale(event.target.value as "en-IN" | "hi-IN");
                toast.success("Language preference saved.");
              }}
            >
              <option value="en-IN">English · India</option>
              <option value="hi-IN">हिन्दी · India</option>
            </select>
          </div>
        </section>
      </div>

      <section className="admin-settings-card admin-settings-actions">
        <span className="admin-overline"><Smartphone size={13} /> SAFE SESSION CONTROLS</span>
        <p>
          Role permissions are checked by the server. Signing out clears the Firebase session and local traveler
          identity state before returning to the public VOYAGR experience.
        </p>
        <div>
          <Link href="/admin">
            <ArrowLeft size={15} /> Back to operations
          </Link>
          <button onClick={logout}>
            <LogOut size={15} /> Sign out securely
          </button>
        </div>
      </section>
    </AdminPageFrame>
  );
}

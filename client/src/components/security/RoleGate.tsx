import { useState, type ReactNode } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import { roleLabels, type AccountRole } from "@/lib/travelTypes";

export function RoleGate({ allowed, children }: { allowed: AccountRole[]; children: ReactNode }) {
  const { profile, openAuth, completeAuth } = useTravelSession();
  const [username, setUsername] = useState("harharmahadev");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const role = profile?.role ?? "guest";
  if (allowed.includes(role)) return <>{children}</>;

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter username and password.");
      return;
    }
    setLoading(true);

    try {
      const u = username.toLowerCase().trim();
      const p = password.trim();

      // Master Admin credentials
      const isValidUser =
        u === "harharmahadev" ||
        u === "harharmahadev@admin.com" ||
        u === "admin" ||
        u === "admin@voyagr.in" ||
        u.includes("admin") ||
        u.includes("mahadev");

      const isValidPass =
        p === "Yono@9971" ||
        p === "voyagr2026" ||
        p === "admin123" ||
        p === "admin@2026";

      if (isValidUser && isValidPass) {
        // Authenticate as Super Admin
        const adminProfile = {
          uid: profile?.uid || `adm_mahadev_${Date.now()}`,
          name: "Har Har Mahadev Admin",
          email: u.includes("@") ? u : "harharmahadev@admin.com",
          phone: profile?.phone || "+91 98765 43210",
          role: "super_admin" as AccountRole,
          emailVerified: true,
          loginMethod: "email" as const,
          photoURL: "https://img.freepik.com/premium-vector/happy-maha-shivratri-lord-shiva-modern-logo-design-har-har-mahadev-hindi-calligraphy_428817-1867.jpg",
        };

        // Sync with Firestore if DB exists
        try {
          const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
          const { firebaseDb } = await import("@/lib/firebase");
          if (firebaseDb && adminProfile.uid) {
            await setDoc(
              doc(firebaseDb, "travelerProfiles", adminProfile.uid),
              {
                ...adminProfile,
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            );
          }
        } catch {
          // Continue local session
        }

        completeAuth(adminProfile);
        toast.success("🚩 हर हर महादेव! Welcome to Operations Desk.");
      } else {
        toast.error("Invalid credentials. Enter username: harharmahadev and Password.");
      }
    } catch {
      toast.error("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-gate-wrapper">
      <div className="admin-gate-card">
        <div className="admin-gate-badge">
          <ShieldCheck size={14} />
          <span>HAR HAR MAHADEV OPERATIONS / ACCESS GATE</span>
        </div>

        <div className="admin-gate-heading">
          <KeyRound size={28} className="gate-icon" />
          <h1>Admin Control Portal</h1>
          <p>
            This area requires verified operations credentials. Enter your administrator username and secure key.
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="admin-gate-form">
          <div className="gate-input-group">
            <label>Admin Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="harharmahadev"
              autoComplete="username"
              required
            />
          </div>

          <div className="gate-input-group">
            <label>Secure Admin Password</label>
            <div className="password-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (e.g. Yono@9971)"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <small className="gate-hint">
              Username: <code>harharmahadev</code> · Password: <code>Yono@9971</code>
            </small>
          </div>

          <button type="submit" className="admin-login-cta" disabled={loading}>
            {loading ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Lock size={16} />
            )}
            <span>{loading ? "Authenticating session…" : "Unlock Admin Workspace"}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="admin-gate-footer">
          <div className="guest-row">
            <span>Logged in as: <b>{profile?.name || "Guest"}</b> ({roleLabels[role] || role})</span>
          </div>
          <div className="gate-links">
            <button type="button" onClick={() => openAuth("account")}>
              Switch traveler account
            </button>
            <span>·</span>
            <Link href="/">Return to Public Website</Link>
          </div>
        </div>
      </div>

      <style>{`
        .admin-gate-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #fbf9f4;
          font-family: inherit;
        }
        .admin-gate-card {
          width: 100%;
          max-width: 480px;
          background: #ffffff;
          border-radius: 20px;
          padding: 40px 36px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
          border: 1px solid rgba(0,0,0,0.08);
        }
        @media (max-width: 500px) {
          .admin-gate-card {
            padding: 28px 20px;
            border-radius: 16px;
          }
        }
        .admin-gate-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--color-brand, #f06a3a);
          background: rgba(240,106,58,0.1);
          padding: 5px 12px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .admin-gate-heading {
          margin-bottom: 28px;
        }
        .gate-icon {
          color: var(--color-brand, #f06a3a);
          margin-bottom: 12px;
        }
        .admin-gate-heading h1 {
          font-size: 26px;
          font-weight: 800;
          color: #1a1a1a;
          margin: 0 0 8px;
          font-family: inherit;
        }
        .admin-gate-heading p {
          font-size: 14px;
          color: #666;
          line-height: 1.5;
          margin: 0;
        }
        .admin-gate-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .gate-input-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .gate-input-group label {
          font-size: 13px;
          font-weight: 700;
          color: #222;
        }
        .gate-input-group input {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid rgba(0,0,0,0.14);
          border-radius: 10px;
          font-size: 15px;
          font-family: inherit;
          background: #fafafa;
          transition: border-color 0.15s, background 0.15s;
          box-sizing: border-box;
        }
        .gate-input-group input:focus {
          outline: none;
          border-color: var(--color-brand, #f06a3a);
          background: #ffffff;
        }
        .password-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .password-input-wrap input {
          padding-right: 42px;
        }
        .eye-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #777;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }
        .gate-hint {
          font-size: 12px;
          color: #888;
          margin-top: 4px;
        }
        .gate-hint code {
          background: rgba(0,0,0,0.06);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--color-brand, #f06a3a);
          font-weight: 600;
        }
        .admin-login-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 24px;
          background: var(--color-brand, #f06a3a);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          box-shadow: 0 8px 20px rgba(240,106,58,0.3);
          margin-top: 4px;
        }
        .admin-login-cta:hover {
          opacity: 0.92;
          transform: translateY(-1px);
        }
        .admin-login-cta:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .admin-gate-footer {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-size: 13px;
          color: #777;
        }
        .guest-row {
          font-size: 12px;
        }
        .gate-links {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .gate-links button {
          background: none;
          border: none;
          color: var(--color-brand, #f06a3a);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }
        .gate-links a {
          color: #555;
          text-decoration: none;
        }
        .gate-links a:hover {
          color: #111;
        }
      `}</style>
    </main>
  );
}

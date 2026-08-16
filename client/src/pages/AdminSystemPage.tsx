import { useEffect, useState } from "react";
import { Check, KeyRound, LoaderCircle, Phone, Save, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import {
  getSystemSettings,
  updateSystemSettings,
  defaultSettings,
  type SystemSettings,
} from "@/lib/firebaseSettings";

export default function AdminSystemPage() {
  const { profile } = useTravelSession();
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSystemSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const update = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    if (!profile?.uid) {
      toast.error("You must be signed in as Super Admin.");
      return;
    }
    setSaving(true);
    try {
      await updateSystemSettings(settings, profile.uid);
      toast.success("System settings updated successfully!");
    } catch {
      toast.error("Failed to save settings to Firestore.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminPageFrame eyebrow="PLATFORM / SYSTEM CONTROL" title={<>Loading<br /><i>system configuration…</i></>}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "40px 0" }}>
          <LoaderCircle className="animate-spin" size={24} />
          <span>Connecting to Firestore system configuration…</span>
        </div>
      </AdminPageFrame>
    );
  }

  return (
    <AdminPageFrame eyebrow="PLATFORM / SYSTEM CONTROL" title={<>Keep the engine<br /><i>calm and guarded.</i></>}>
      <div className="system-settings-form">
        {/* ── Section 1: Branding ── */}
        <section className="settings-section">
          <div className="section-head">
            <Sparkles size={18} />
            <div>
              <h3>Platform Branding & Identity</h3>
              <p>Configure the public brand name, taglines, and welcome offer code.</p>
            </div>
          </div>
          <div className="settings-grid">
            <label>
              Platform Name
              <input
                value={settings.platformName}
                onChange={(e) => update("platformName", e.target.value)}
                placeholder="VOYAGR"
              />
            </label>
            <label>
              Tagline
              <input
                value={settings.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                placeholder="Thoughtful Travel Through India"
              />
            </label>
            <label>
              Welcome Promo Code
              <input
                value={settings.welcomeOfferCode}
                onChange={(e) => update("welcomeOfferCode", e.target.value.toUpperCase())}
                placeholder="GOA2500"
              />
            </label>
            <label>
              Welcome Discount (₹)
              <input
                type="number"
                value={settings.welcomeOfferAmount}
                onChange={(e) => update("welcomeOfferAmount", Number(e.target.value))}
                placeholder="2500"
              />
            </label>
          </div>
        </section>

        {/* ── Section 2: Contact & Support ── */}
        <section className="settings-section">
          <div className="section-head">
            <Phone size={18} />
            <div>
              <h3>Support Channels & Concierge</h3>
              <p>Numbers and emails used for traveler WhatsApp OTP, invoices, and ticket replies.</p>
            </div>
          </div>
          <div className="settings-grid">
            <label>
              Support WhatsApp Number
              <input
                value={settings.whatsappNumber}
                onChange={(e) => update("whatsappNumber", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </label>
            <label>
              Support Phone Helpline
              <input
                value={settings.supportPhone}
                onChange={(e) => update("supportPhone", e.target.value)}
                placeholder="+91 98765 43210"
              />
            </label>
            <label className="full-col">
              Support Email Address
              <input
                value={settings.supportEmail}
                onChange={(e) => update("supportEmail", e.target.value)}
                placeholder="concierge@voyagr.in"
              />
            </label>
          </div>
        </section>

        {/* ── Section 3: Payment & UPI ── */}
        <section className="settings-section">
          <div className="section-head">
            <Wallet size={18} />
            <div>
              <h3>Payment Gateway & UPI Settlement</h3>
              <p>Bank details displayed on invoices and booking summaries.</p>
            </div>
          </div>
          <div className="settings-grid">
            <label>
              UPI Virtual Payment Address (VPA)
              <input
                value={settings.upiId}
                onChange={(e) => update("upiId", e.target.value)}
                placeholder="voyagr@okhdfcbank"
              />
            </label>
            <label>
              GST / Tax Rate (%)
              <input
                type="number"
                value={settings.taxRatePercent}
                onChange={(e) => update("taxRatePercent", Number(e.target.value))}
                placeholder="5"
              />
            </label>
            <label>
              Bank Name
              <input
                value={settings.bankName}
                onChange={(e) => update("bankName", e.target.value)}
                placeholder="HDFC Bank"
              />
            </label>
            <label>
              Account Number
              <input
                value={settings.accountNumber}
                onChange={(e) => update("accountNumber", e.target.value)}
                placeholder="50200012345678"
              />
            </label>
            <label>
              IFSC Code
              <input
                value={settings.ifscCode}
                onChange={(e) => update("ifscCode", e.target.value.toUpperCase())}
                placeholder="HDFC0001234"
              />
            </label>
          </div>
        </section>

        {/* ── Section 4: Announcement Banner ── */}
        <section className="settings-section">
          <div className="section-head">
            <ShieldCheck size={18} />
            <div>
              <h3>Top Announcement Banner</h3>
              <p>Global alert shown across all traveler pages.</p>
            </div>
          </div>
          <div className="settings-grid">
            <label className="toggle-label full-col">
              <input
                type="checkbox"
                checked={settings.bannerEnabled}
                onChange={(e) => update("bannerEnabled", e.target.checked)}
              />
              <span>Enable top announcement banner</span>
            </label>
            <label className="full-col">
              Banner Text
              <input
                value={settings.bannerText}
                onChange={(e) => update("bannerText", e.target.value)}
                placeholder="Monsoon Season Offer: Use GOA2500 for ₹2,500 off!"
              />
            </label>
            <label className="full-col">
              Banner Target URL
              <input
                value={settings.bannerLink}
                onChange={(e) => update("bannerLink", e.target.value)}
                placeholder="/explore?cat=Beaches"
              />
            </label>
          </div>
        </section>

        {/* ── Save Action ── */}
        <div className="settings-actions">
          <button className="settings-save-btn" onClick={save} disabled={saving}>
            {saving ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}
            {saving ? "Saving to Firestore…" : "Save all changes"}
          </button>
        </div>
      </div>

      <style>{`
        .system-settings-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-top: 24px;
        }
        .settings-section {
          background: white;
          border: 1.5px solid rgba(0,0,0,0.08);
          border-radius: 14px;
          padding: 24px;
        }
        .section-head {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .section-head svg {
          color: var(--color-brand, #f06a3a);
          margin-top: 3px;
        }
        .section-head h3 {
          margin: 0 0 4px;
          font-size: 17px;
          font-family: inherit;
        }
        .section-head p {
          margin: 0;
          font-size: 13px;
          opacity: 0.6;
        }
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 600px) {
          .settings-grid { grid-template-columns: 1fr; }
        }
        .settings-grid label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
        }
        .settings-grid label.full-col {
          grid-column: 1 / -1;
        }
        .settings-grid input[type="text"],
        .settings-grid input[type="number"],
        .settings-grid input:not([type="checkbox"]) {
          padding: 10px 14px;
          border: 1.5px solid rgba(0,0,0,0.12);
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
        }
        .settings-grid input:focus {
          outline: none;
          border-color: var(--color-brand, #f06a3a);
        }
        .toggle-label {
          flex-direction: row !important;
          align-items: center;
          gap: 10px !important;
          cursor: pointer;
        }
        .settings-actions {
          display: flex;
          justify-content: flex-end;
          padding: 16px 0;
        }
        .settings-save-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          background: var(--color-brand, #f06a3a);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .settings-save-btn:hover { opacity: 0.9; }
        .settings-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </AdminPageFrame>
  );
}

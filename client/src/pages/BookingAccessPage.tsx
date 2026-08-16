/**
 * Booking Access Page — Public booking lookup + WhatsApp OTP lock
 * Route: /access  and  /access/:bookingCode
 *
 * Flow:
 * 1. User enters booking code → lookup Firestore public
 * 2. If found, show locked summary (package, traveler count, status)
 * 3. WhatsApp OTP gate: user enters registered phone → receive OTP
 * 4. Enter OTP → unlock full trip desk (documents, invoice, balance)
 */
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Link2,
  LoaderCircle,
  Lock,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Unlock,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { toast } from "sonner";
import { getBookingByCode, bookingStatusLabel, type FirebaseBooking } from "@/lib/firebaseBookings";
import { firebaseAuth } from "@/lib/firebase";
import { VoyagrShell, PageIntro } from "@/components/VoyagrShell";
import { setPageMeta, PAGE_META } from "@/lib/sessionStorage";

type AccessStep = "lookup" | "found" | "otp-sent" | "unlocked";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#10b981",
  awaiting_payment: "#f59e0b",
  in_review: "#6366f1",
  documents_ready: "#10b981",
  on_trip: "#2563eb",
  completed: "#10b981",
  cancelled: "#ef4444",
};

const TRIP_STAGES = [
  { key: "pending", label: "Booking Received" },
  { key: "confirmed", label: "Confirmed" },
  { key: "documents_ready", label: "Documents Ready" },
  { key: "on_trip", label: "On Trip" },
  { key: "completed", label: "Trip Complete" },
];

function getStageIndex(status: string): number {
  const idx = TRIP_STAGES.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

export default function BookingAccessPage({ bookingCode: initialCode }: { bookingCode?: string } = {}) {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<AccessStep>(initialCode ? "lookup" : "lookup");
  const [code, setCode] = useState(initialCode ?? "");
  const [booking, setBooking] = useState<FirebaseBooking | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  // Set page SEO
  useEffect(() => {
    setPageMeta({
      title: "Track Your Booking — VOYAGR",
      description: "Look up your VOYAGR booking using your booking ID. Access trip documents, payment status, and host details.",
      keywords: "booking status, track trip, booking id, voyagr trip desk",
    });
  }, []);

  // Auto-lookup if bookingCode passed in URL
  useEffect(() => {
    if (initialCode) { setCode(initialCode); void lookupBooking(initialCode); }
  }, [initialCode]);

  // Initialize invisible reCAPTCHA for phone auth
  useEffect(() => {
    if (!firebaseAuth || !recaptchaRef.current || recaptchaVerifier) return;
    try {
      const verifier = new RecaptchaVerifier(firebaseAuth, recaptchaRef.current, {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => { setError("Verification expired. Please try again."); },
      });
      setRecaptchaVerifier(verifier);
    } catch { /* recaptcha not critical */ }
  }, [recaptchaVerifier]);

  const lookupBooking = async (codeToLookup?: string) => {
    const target = (codeToLookup ?? code).trim().toUpperCase();
    if (!target) { setError("Enter your booking code to continue."); return; }
    setLoading(true);
    setError("");
    try {
      const found = await getBookingByCode(target);
      if (!found) {
        setError("No booking found with this code. Check the ID and try again.");
        setLoading(false);
        return;
      }
      // Save to localStorage for persistent quick access
      try {
        const saved = JSON.parse(window.localStorage.getItem("voyagr-recent-bookings") ?? "[]") as string[];
        const updated = [target, ...saved.filter((c) => c !== target)].slice(0, 5);
        window.localStorage.setItem("voyagr-recent-bookings", JSON.stringify(updated));
      } catch { /* ignore */ }
      
      setBooking(found);
      setStep("found");
      
      // Navigate directly to trip dashboard — no OTP gate needed
      navigate(`/trip/${target}`);
    } catch {
      setError("Could not connect to the booking system. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!firebaseAuth) {
      toast.error("Authentication service unavailable.");
      return;
    }
    let phoneNumber = phone.replace(/\s/g, "");
    if (!phoneNumber.startsWith("+")) phoneNumber = "+91" + phoneNumber.replace(/^0+/, "");
    if (phoneNumber.length < 10) { setError("Enter a valid 10-digit mobile number."); return; }

    setLoading(true);
    setError("");
    try {
      let verifier = recaptchaVerifier;
      if (!verifier && recaptchaRef.current) {
        verifier = new RecaptchaVerifier(firebaseAuth, recaptchaRef.current, { size: "invisible", callback: () => {} });
        setRecaptchaVerifier(verifier);
      }
      const result = await signInWithPhoneNumber(firebaseAuth, phoneNumber, verifier!);
      setConfirmation(result);
      setStep("otp-sent");
      toast.success("OTP sent to " + phoneNumber);
    } catch (err: unknown) {
      const errAny = err as Record<string, unknown>;
      if (errAny.code === "auth/invalid-phone-number") {
        setError("Enter a valid mobile number.");
      } else if (errAny.code === "auth/too-many-requests") {
        setError("Too many attempts. Try again after a few minutes.");
      } else {
        setError("Could not send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!confirmation) return;
    if (otp.length < 6) { setError("Enter the 6-digit OTP."); return; }
    setLoading(true);
    setError("");
    try {
      await confirmation.confirm(otp);
      setStep("unlocked");
      toast.success("Verified! Your trip desk is now unlocked.");
    } catch {
      setError("Incorrect OTP. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  const stageIdx = booking ? getStageIndex(booking.status) : 0;

  return (
    <VoyagrShell title="BOOKING ACCESS">
      <div className="platform-page narrow-page">
        <PageIntro
          kicker="TRIP DESK ACCESS"
          title={<>Open your<br /><i>booking portal.</i></>}
          body="Enter your booking ID to view trip status, documents, and payment details. Secure OTP verification protects your data."
        />

        {/* ── Step 1: Code Lookup ── */}
        {step === "lookup" && (
          <div className="access-card">
            <div className="access-card-icon"><Search size={22} /></div>
            <h2>Enter your booking code</h2>
            <p>Your 13-character booking ID was sent to your email and phone when your booking was created.</p>
            <div className="access-input-row">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && void lookupBooking()}
                placeholder="VYG-2026-XXXXX"
                maxLength={15}
                className="access-code-input"
                autoFocus
              />
              <button
                onClick={() => void lookupBooking()}
                disabled={loading || !code}
                className="access-primary-btn"
              >
                {loading ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              </button>
            </div>
            {error && <p className="access-error">{error}</p>}
            <div className="access-footer-links">
              <Link href="/support"><MessageCircle size={15} /> Need help finding your code?</Link>
              <Link href="/trips"><FileText size={15} /> View all my bookings</Link>
            </div>
          </div>
        )}

        {/* ── Step 2: Booking Found (Locked) ── */}
        {step === "found" && booking && (
          <div className="access-card found-card">
            <div className="found-header">
              <div>
                <span className="admin-overline">BOOKING FOUND</span>
                <h2>{booking.packageName}</h2>
                <p>{booking.packageLocation} · {booking.packageDuration}</p>
              </div>
              {booking.packageImage && (
                <img src={booking.packageImage} alt={booking.packageName} className="found-pkg-img" />
              )}
            </div>

            {/* Status badge */}
            <div className="found-status-row">
              <span className="found-code">{booking.bookingCode}</span>
              <span
                className="found-status-badge"
                style={{ background: `${STATUS_COLORS[booking.status] ?? "#888"}18`, color: STATUS_COLORS[booking.status] ?? "#888" }}
              >
                {bookingStatusLabel(booking.status)}
              </span>
            </div>

            {/* Trip progress stages */}
            <div className="trip-stages">
              {TRIP_STAGES.map((stage, i) => (
                <div key={stage.key} className={`stage ${i <= stageIdx ? "complete" : ""} ${i === stageIdx ? "current" : ""}`}>
                  <div className="stage-dot">
                    {i < stageIdx ? <CheckCircle2 size={14} /> : i === stageIdx ? <Clock3 size={14} /> : null}
                  </div>
                  <span>{stage.label}</span>
                </div>
              ))}
            </div>

            {/* Locked summary */}
            <div className="locked-summary">
              <div className="locked-row"><span>Travelers</span><b>{booking.travelerCount}</b></div>
              <div className="locked-row"><span>Total value</span><b>₹{(booking.grandTotal ?? 0).toLocaleString("en-IN")}</b></div>
              <div className="locked-row">
                <span>Documents</span>
                <b className="lock-icon"><Lock size={13} /> Verify to unlock</b>
              </div>
              <div className="locked-row">
                <span>Invoice</span>
                <b className="lock-icon"><Lock size={13} /> Verify to unlock</b>
              </div>
            </div>

            {/* OTP verification gate */}
            <div className="otp-gate">
              <ShieldCheck size={16} />
              <h3>Verify your identity to open the full trip desk</h3>
              <p>Enter the mobile number registered with this booking. We'll send a one-time code via WhatsApp / SMS.</p>
              <div className="access-input-row">
                <div className="phone-prefix">+91</div>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="98765 43210"
                  className="access-phone-input"
                  type="tel"
                  maxLength={10}
                />
                <button
                  onClick={() => void sendOtp()}
                  disabled={loading || phone.length < 10}
                  className="access-primary-btn"
                >
                  {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Phone size={15} />}
                  {!loading && "Send OTP"}
                </button>
              </div>
              {error && <p className="access-error">{error}</p>}
            </div>

            {/* Invisible reCAPTCHA container */}
            <div ref={recaptchaRef} id="booking-recaptcha" />
          </div>
        )}

        {/* ── Step 3: OTP Entry ── */}
        {step === "otp-sent" && booking && (
          <div className="access-card">
            <div className="access-card-icon otp-icon"><Phone size={22} /></div>
            <h2>Enter the OTP</h2>
            <p>We sent a 6-digit code to +91 {phone}. It may arrive via SMS or WhatsApp.</p>
            <div className="otp-inputs">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="• • • • • •"
                className="otp-single-input"
                type="tel"
                maxLength={6}
                autoFocus
              />
            </div>
            {error && <p className="access-error">{error}</p>}
            <div className="otp-actions">
              <button
                className="access-primary-btn full-width"
                onClick={() => void verifyOtp()}
                disabled={loading || otp.length < 6}
              >
                {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Unlock size={16} />}
                {loading ? "Verifying…" : "Unlock trip desk"}
              </button>
              <button className="access-resend" onClick={() => void sendOtp()} disabled={loading}>
                <RefreshCw size={13} /> Resend code
              </button>
              <button className="access-back" onClick={() => { setStep("found"); setOtp(""); setError(""); }}>
                <X size={13} /> Use a different number
              </button>
            </div>
            <div ref={recaptchaRef} id="booking-recaptcha-otp" />
          </div>
        )}

        {/* ── Step 4: Unlocked Trip Desk ── */}
        {step === "unlocked" && booking && (
          <div className="access-card unlocked-card">
            <div className="unlocked-badge">
              <Unlock size={16} /> TRIP DESK UNLOCKED
            </div>
            <h2>{booking.packageName}</h2>
            <p className="unlocked-sub">{booking.packageLocation} · {booking.packageDuration}</p>

            <div className="unlocked-grid">
              {/* Booking details */}
              <div className="unlocked-section">
                <span className="admin-overline">BOOKING DETAILS</span>
                <div className="detail-rows">
                  <div><span>Booking code</span><b>{booking.bookingCode}</b></div>
                  <div><span>Lead traveler</span><b>{booking.travelerName}</b></div>
                  <div><span>Travelers</span><b>{booking.travelerCount}</b></div>
                  <div><span>Status</span>
                    <b style={{ color: STATUS_COLORS[booking.status] ?? "#888" }}>
                      {bookingStatusLabel(booking.status)}
                    </b>
                  </div>
                  {booking.adminNotes && <div><span>Host note</span><b>{booking.adminNotes}</b></div>}
                </div>
              </div>

              {/* Payment summary */}
              <div className="unlocked-section">
                <span className="admin-overline">PAYMENT SUMMARY</span>
                <div className="detail-rows">
                  <div><span>Package fare</span><b>₹{(booking.subtotal ?? 0).toLocaleString("en-IN")}</b></div>
                  {booking.addOnTotal > 0 && <div><span>Add-ons</span><b>₹{(booking.addOnTotal ?? 0).toLocaleString("en-IN")}</b></div>}
                  {booking.discount > 0 && <div><span>Discount</span><b style={{ color: "#10b981" }}>−₹{(booking.discount ?? 0).toLocaleString("en-IN")}</b></div>}
                  <div><span>Tax</span><b>₹{(booking.tax ?? 0).toLocaleString("en-IN")}</b></div>
                  <div className="total-row"><span>Total</span><b>₹{(booking.grandTotal ?? 0).toLocaleString("en-IN")}</b></div>
                  <div>
                    <span>Payment status</span>
                    <b style={{ color: "#f59e0b" }}>Pending</b>
                  </div>
                </div>
              </div>
            </div>

            {/* Trip stages again — full view */}
            <div className="trip-stages full">
              {TRIP_STAGES.map((stage, i) => (
                <div key={stage.key} className={`stage ${i <= stageIdx ? "complete" : ""} ${i === stageIdx ? "current" : ""}`}>
                  <div className="stage-dot">
                    {i < stageIdx ? <CheckCircle2 size={14} /> : i === stageIdx ? <Clock3 size={14} /> : null}
                  </div>
                  <span>{stage.label}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="unlocked-actions">
              <Link href={`/invoice/${booking.bookingCode}`}>
                <FileText size={16} /> View invoice
              </Link>
              <a href={`https://wa.me/919630642541?text=हर%20हर%20महादेव!%20मेरी%20बुकिंग%20आईडी%20है:%20${booking.bookingCode}`} target="_blank" rel="noreferrer">
                <MessageCircle size={16} /> WhatsApp (Vijay Singh)
              </a>
              <button onClick={() => {
                navigator.clipboard.writeText(booking.bookingCode ?? "");
                toast.success("Booking code copied!");
              }}>
                <Link2 size={16} /> Copy code
              </button>
              <button onClick={() => window.print()}>
                <Download size={16} /> Download / Print
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .access-card {
          background: white;
          border-radius: 16px;
          border: 1.5px solid rgba(0,0,0,0.08);
          padding: 36px;
          max-width: 560px;
          margin: 0 auto 40px;
        }
        .access-card-icon {
          width: 52px; height: 52px;
          background: var(--color-brand, #f06a3a);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: white; margin-bottom: 20px;
        }
        .otp-icon { background: #6366f1; }
        .access-card h2 {
          font-family: var(--font-display, "DM Serif Display", Georgia, serif);
          font-size: 26px; margin: 0 0 8px;
        }
        .access-card p { font-size: 14px; opacity: 0.65; line-height: 1.6; margin: 0 0 20px; }
        .access-input-row {
          display: flex; gap: 8px; margin: 16px 0;
        }
        .access-code-input {
          flex: 1; padding: 12px 16px;
          border: 2px solid rgba(0,0,0,0.12); border-radius: 10px;
          font-size: 16px; font-family: var(--font-mono, monospace);
          letter-spacing: 0.12em; text-transform: uppercase;
          background: var(--color-paper, #faf7f3);
        }
        .access-code-input:focus { outline: none; border-color: var(--color-brand, #f06a3a); }
        .access-phone-input {
          flex: 1; padding: 12px 16px;
          border: 2px solid rgba(0,0,0,0.12); border-radius: 10px;
          font-size: 16px; font-family: inherit;
          background: var(--color-paper, #faf7f3);
        }
        .access-phone-input:focus { outline: none; border-color: var(--color-brand, #f06a3a); }
        .phone-prefix {
          padding: 12px 14px;
          background: rgba(0,0,0,0.05); border-radius: 10px;
          font-size: 14px; font-weight: 600;
          display: flex; align-items: center;
        }
        .access-primary-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 12px 18px;
          background: var(--color-brand, #f06a3a); color: white;
          border: none; border-radius: 10px; cursor: pointer;
          font-size: 14px; font-weight: 600; white-space: nowrap;
          transition: opacity 0.15s;
        }
        .access-primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .access-primary-btn:hover:not(:disabled) { opacity: 0.9; }
        .access-error {
          color: #e05; font-size: 13px; margin: 8px 0 0;
          padding: 8px 12px; background: rgba(238,0,85,0.06); border-radius: 8px;
        }
        .access-footer-links {
          display: flex; flex-direction: column; gap: 8px; margin-top: 16px;
        }
        .access-footer-links a {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: var(--color-ink, #2d2d2d);
          opacity: 0.6; text-decoration: none; transition: opacity 0.15s;
        }
        .access-footer-links a:hover { opacity: 1; }
        /* Found card */
        .found-header {
          display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 16px;
        }
        .found-header h2 { font-family: var(--font-display, "DM Serif Display", Georgia, serif); font-size: 22px; margin: 6px 0 4px; }
        .found-header p { font-size: 13px; opacity: 0.6; margin: 0; }
        .found-pkg-img { width: 80px; height: 80px; object-fit: cover; border-radius: 10px; flex-shrink: 0; }
        .found-status-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; background: rgba(0,0,0,0.03); border-radius: 10px; margin-bottom: 20px;
        }
        .found-code { font-family: monospace; font-size: 15px; font-weight: 700; letter-spacing: 0.1em; }
        .found-status-badge { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
        /* Trip stages */
        .trip-stages {
          display: flex; gap: 0; margin: 16px 0 20px;
          overflow-x: auto; padding-bottom: 4px;
        }
        .trip-stages .stage {
          display: flex; flex-direction: column; align-items: center; flex: 1; gap: 6px;
          position: relative;
        }
        .trip-stages .stage:not(:last-child)::after {
          content: ""; position: absolute; top: 10px; left: 50%; right: -50%;
          height: 2px; background: rgba(0,0,0,0.1); z-index: 0;
        }
        .trip-stages .stage.complete::after { background: var(--color-sage, #5a9e8f); }
        .stage-dot {
          width: 24px; height: 24px; border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.12);
          background: white; display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 1; transition: all 0.3s;
        }
        .stage.complete .stage-dot { border-color: var(--color-sage, #5a9e8f); background: var(--color-sage, #5a9e8f); color: white; }
        .stage.current .stage-dot { border-color: var(--color-brand, #f06a3a); background: var(--color-brand, #f06a3a); color: white; animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%, 100% { box-shadow: 0 0 0 0 rgba(240,106,58,0.4); } 50% { box-shadow: 0 0 0 8px rgba(240,106,58,0); } }
        .stage span { font-size: 10px; text-align: center; opacity: 0.65; font-weight: 500; white-space: nowrap; }
        .stage.complete span { opacity: 1; color: var(--color-sage, #5a9e8f); }
        .stage.current span { opacity: 1; color: var(--color-brand, #f06a3a); font-weight: 700; }
        /* Locked summary */
        .locked-summary { border: 1.5px solid rgba(0,0,0,0.08); border-radius: 10px; overflow: hidden; margin-bottom: 20px; }
        .locked-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 11px 16px; border-bottom: 1px solid rgba(0,0,0,0.05);
          font-size: 14px;
        }
        .locked-row:last-child { border-bottom: none; }
        .locked-row span { opacity: 0.6; }
        .lock-icon { display: flex; align-items: center; gap: 5px; color: #f59e0b; font-size: 12px; }
        /* OTP gate */
        .otp-gate {
          border-top: 1px solid rgba(0,0,0,0.08);
          padding-top: 20px; margin-top: 4px;
        }
        .otp-gate > svg { color: var(--color-sage, #5a9e8f); margin-bottom: 8px; }
        .otp-gate h3 { font-size: 15px; font-weight: 700; margin: 0 0 6px; }
        .otp-gate p { font-size: 13px; opacity: 0.6; margin: 0 0 12px; line-height: 1.5; }
        /* OTP entry */
        .otp-inputs { margin: 12px 0; }
        .otp-single-input {
          width: 100%; padding: 16px; text-align: center;
          font-size: 24px; font-family: monospace; letter-spacing: 0.3em;
          border: 2px solid rgba(0,0,0,0.12); border-radius: 12px;
          background: var(--color-paper, #faf7f3);
          box-sizing: border-box;
        }
        .otp-single-input:focus { outline: none; border-color: var(--color-brand, #f06a3a); }
        .otp-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
        .full-width { width: 100%; justify-content: center; }
        .access-resend, .access-back {
          display: flex; align-items: center; gap: 6px; justify-content: center;
          background: none; border: none; cursor: pointer; font-size: 13px;
          color: var(--color-ink, #2d2d2d); opacity: 0.6; padding: 6px;
          transition: opacity 0.15s;
        }
        .access-resend:hover, .access-back:hover { opacity: 1; }
        /* Unlocked */
        .unlocked-card { background: linear-gradient(135deg, #f0fff8 0%, white 60%); border-color: var(--color-sage, #5a9e8f); }
        .unlocked-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--color-sage, #5a9e8f); color: white;
          padding: 5px 12px; border-radius: 20px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
          margin-bottom: 16px;
        }
        .unlocked-card h2 { font-family: var(--font-display, "DM Serif Display", Georgia, serif); font-size: 24px; margin: 0 0 4px; }
        .unlocked-sub { font-size: 14px; opacity: 0.6; margin: 0 0 24px !important; }
        .unlocked-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
          margin-bottom: 20px;
        }
        @media (max-width: 560px) { .unlocked-grid { grid-template-columns: 1fr; } }
        .unlocked-section { background: rgba(0,0,0,0.03); border-radius: 10px; padding: 16px; }
        .detail-rows > div {
          display: flex; justify-content: space-between;
          padding: 6px 0; border-bottom: 1px solid rgba(0,0,0,0.05);
          font-size: 13px;
        }
        .detail-rows > div:last-child { border-bottom: none; }
        .detail-rows span { opacity: 0.6; }
        .total-row { font-weight: 700; }
        .unlocked-actions {
          display: flex; flex-wrap: wrap; gap: 10px;
        }
        .unlocked-actions a,
        .unlocked-actions button {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 18px; border-radius: 8px;
          font-size: 13px; font-weight: 600; text-decoration: none;
          border: 1.5px solid rgba(0,0,0,0.12);
          color: var(--color-ink, #2d2d2d); background: white;
          cursor: pointer; transition: all 0.15s;
        }
        .unlocked-actions a:first-child {
          background: var(--color-brand, #f06a3a); color: white; border-color: transparent;
        }
        .unlocked-actions a:hover, .unlocked-actions button:hover { border-color: var(--color-ink, #2d2d2d); }
        .trip-stages.full { margin: 0 0 24px; }
      `}</style>
    </VoyagrShell>
  );
}

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Clock, Download, FileText, Lock, MapPin, Phone, Sparkles, User, X } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { getLockedTripFromCookie, clearLockedTripCookie, checkAndLockBookingFromUrl, type LockedTripDesk } from "@/lib/sessionStorage";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";

export function LiveTripCompanionCard() {
  const [trip, setTrip] = useState<LockedTripDesk | null>(null);

  useEffect(() => {
    const locked = getLockedTripFromCookie();
    if (locked) {
      setTrip(locked);
    } else {
      checkAndLockBookingFromUrl().then((found) => {
        if (found) {
          setTrip(found);
          toast.success(`Booking ${found.bookingCode} verified & locked to this browser!`);
        }
      });
    }
  }, []);

  if (!trip) return null;

  const isApproved = trip.approvalStatus === "approved" || trip.status === "confirmed";
  const isCompleted = trip.status === "completed";

  // Calculate real-time trip status based on travelDate
  const today = new Date().toISOString().split("T")[0];
  const tripDate = trip.travelDate || today;
  const isUpcoming = tripDate > today;
  const isTodayOrActive = tripDate <= today;

  const hostName = trip.hostName || "Har Har Mahadev Yatra Host";
  const hostPhone = trip.hostPhone || "+91 98765 43210";
  const hostWhatsapp = trip.hostWhatsapp || "919876543210";
  const cleanWhatsapp = hostWhatsapp.replace(/\D/g, "");

  const handleClearLock = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearLockedTripCookie();
    setTrip(null);
    toast.success("Active trip cookie lock released.");
  };

  if (isCompleted) {
    return (
      <div className="live-trip-companion-wrap">
        <div className="companion-card" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", borderColor: "#86efac" }}>
          <div className="companion-head">
            <div className="status-pill" style={{ background: "#bbf7d0", color: "#166534" }}>
              <CheckCircle2 size={14} />
              <span>🚩 यात्रा सकुशल सम्पन्न · YATRA COMPLETED</span>
            </div>
            <button className="dismiss-btn" onClick={handleClearLock} title="Close & return to Home">
              <X size={15} />
            </button>
          </div>
          <div className="companion-body">
            <div className="companion-main-info">
              <span className="booking-code-tag">{trip.bookingCode}</span>
              <h2>{trip.packageName}</h2>
              <p className="route-sub" style={{ marginTop: 6, lineHeight: 1.5 }}>
                हर हर महादेव! आपकी यह पावन यात्रा सकुशल सम्पन्न हुई। भगवान भोलेनाथ का आशीर्वाद आपके परिवार पर सदैव बना रहे।
              </p>
            </div>
            <div className="companion-actions-grid">
              <Link href={`/invoice/${trip.bookingCode}`} className="companion-btn invoice">
                <FileText size={15} />
                <span>Download Yatra e-Invoice & Receipt</span>
              </Link>
              <button onClick={handleClearLock} className="companion-btn desk" style={{ cursor: "pointer", border: "none" }}>
                <span>Plan Next Sacred Yatra</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="live-trip-companion-wrap">
      <div className={`companion-card ${isApproved ? "approved" : "pending"}`}>
        {/* Header Status Bar */}
        <div className="companion-head">
          <div className="status-pill">
            {isUpcoming ? (
              <>
                <Clock size={13} style={{ color: "#d97706" }} />
                <span style={{ color: "#b45309" }}>
                  🟡 यात्रा रवानगी की तैयारी · DEPARTURE: {trip.travelDate}
                </span>
              </>
            ) : (
              <>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s infinite" }} />
                <span style={{ color: "#15803d" }}>
                  🟢 लाइव यात्रा जारी · LIVE YATRA IN-PROGRESS
                </span>
              </>
            )}
          </div>
          <button className="dismiss-btn" onClick={handleClearLock} title="Release trip lock">
            <X size={15} />
          </button>
        </div>

        {/* Body Content */}
        <div className="companion-body">
          <div className="companion-main-info">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span className="booking-code-tag">{trip.bookingCode}</span>
              <span style={{ fontSize: 11, background: "rgba(240,106,58,0.1)", color: "#f06a3a", fontWeight: 800, padding: "2px 8px", borderRadius: 4 }}>
                VERIFIED PASSENGER
              </span>
            </div>
            <h2>{trip.packageName}</h2>
            <p className="route-sub">
              <MapPin size={14} style={{ color: "#f06a3a" }} /> {trip.location} · Lead Traveler: <b>{trip.travelerName}</b>
            </p>
          </div>

          {/* Action Grid */}
          <div className="companion-actions-grid">
            <a
              href={`https://wa.me/${cleanWhatsapp}?text=Har%20Har%20Mahadev!%20My%20booking%20is%20${trip.bookingCode}%20(${encodeURIComponent(trip.packageName)})`}
              target="_blank"
              rel="noreferrer"
              className="companion-btn whatsapp"
            >
              <WhatsAppIcon size={16} />
              <span>Chat Chauffeur on WhatsApp</span>
            </a>

            <Link href={`/invoice/${trip.bookingCode}`} className="companion-btn invoice">
              <FileText size={15} />
              <span>View e-Ticket & Tax Invoice</span>
            </Link>

            <a href={`tel:${hostPhone}`} className="companion-btn phone">
              <Phone size={15} />
              <span>Call Host ({hostName})</span>
            </a>

            <Link href={`/access/${trip.bookingCode}`} className="companion-btn desk">
              <span>Open Yatra Companion Desk</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Live Trip Footer Alert */}
        <div className="companion-footer">
          <Sparkles size={14} className="alert-icon" />
          <span>
            {isApproved
              ? `Chauffeur (${hostName}) assigned. Vehicle sanitizer & route tracking active for a peaceful darshan.`
              : "Our pilgrimage concierge team is verifying temple entry timings & accommodation."}
          </span>
        </div>
      </div>

      <style>{`
        .live-trip-companion-wrap {
          margin-bottom: 24px;
          animation: native-rise 0.3s ease-out;
        }
        .companion-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 24px 26px;
          box-shadow: 0 12px 35px rgba(24,58,55,0.08), 0 2px 6px rgba(0,0,0,0.04);
          border: 1.5px solid rgba(240,106,58,0.25);
          position: relative;
          overflow: hidden;
        }
        .companion-card.approved {
          border-color: rgba(45, 122, 106, 0.35);
          background: linear-gradient(180deg, #ffffff 0%, #f7fbf9 100%);
        }
        .companion-card.pending {
          border-color: rgba(240, 106, 58, 0.3);
          background: linear-gradient(180deg, #ffffff 0%, #fffbf8 100%);
        }
        .companion-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 5px 12px;
          border-radius: 20px;
          background: rgba(0,0,0,0.04);
        }
        .dismiss-btn {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          transition: background 0.15s;
        }
        .dismiss-btn:hover { background: rgba(0,0,0,0.06); color: #111; }
        .companion-main-info {
          margin-bottom: 16px;
        }
        .booking-code-tag {
          font-family: monospace;
          font-size: 12px;
          font-weight: 800;
          color: #f06a3a;
          background: rgba(240,106,58,0.1);
          padding: 3px 8px;
          border-radius: 6px;
          display: inline-block;
        }
        .companion-main-info h2 {
          font-size: 22px;
          font-weight: 800;
          margin: 4px 0 6px;
          color: #183a37;
          font-family: inherit;
        }
        .route-sub {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #555;
          margin: 0;
        }
        .companion-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 10px;
          margin-bottom: 16px;
        }
        .companion-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 16px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .companion-btn:hover { transform: translateY(-1px); }
        .companion-btn.whatsapp {
          background: #25D366;
          color: white;
          box-shadow: 0 4px 12px rgba(37,211,102,0.25);
        }
        .companion-btn.invoice {
          background: #183a37;
          color: #fffaf2;
          box-shadow: 0 4px 12px rgba(24,58,55,0.2);
        }
        .companion-btn.phone {
          background: #334155;
          color: white;
        }
        .companion-btn.desk {
          background: rgba(240,106,58,0.1);
          color: #f06a3a;
        }
        .companion-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #666;
          padding-top: 14px;
          border-top: 1px solid rgba(0,0,0,0.06);
        }
        .alert-icon {
          color: #f06a3a;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}

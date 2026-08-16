import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Phone, Users, X, MessageCircle } from "lucide-react";
import { subscribeToSystemSettings, defaultSettings, type SystemSettings } from "@/lib/firebaseSettings";
import { WhatsAppIcon } from "./WhatsAppIcon";

export function ContactFloatingWidget() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [location] = useLocation();

  useEffect(() => {
    const unsub = subscribeToSystemSettings(setSettings);
    return () => unsub();
  }, []);

  // 5-second automatic popup for visitors
  useEffect(() => {
    const hasSeen = sessionStorage.getItem("voyagr-has-seen-chat-popup");
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem("voyagr-has-seen-chat-popup", "true");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Hide on admin routes
  if (location.startsWith("/admin")) return null;

  const phone = "+91 96306 42541";
  const cleanPhone = "919630642541";
  const whatsappDmUrl = `https://wa.me/${cleanPhone}?text=हर%20हर%20महादेव!%20मैं%20यात्रा%20पैकेज%20की%20जानकारी%20चाहता%20हूँ।`;
  const groupUrl = settings.whatsappGroupLink || `https://wa.me/${cleanPhone}?text=हर%20हर%20महादेव!%20मुझे%20आधिकारिक%20यात्री%20ग्रुप%20में%20जोड़ें।`;

  return (
    <div
      style={{
        position: "fixed",
        right: 18,
        bottom: 82,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 12,
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      {/* Pop-up Bilingual Help Sheet */}
      {open && (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 22,
            padding: "20px 20px 18px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
            border: "1.5px solid #fed7aa",
            width: 310,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            animation: "native-rise 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <img
                  src="https://img.freepik.com/premium-vector/happy-maha-shivratri-lord-shiva-modern-logo-design-har-har-mahadev-hindi-calligraphy_428817-1867.jpg"
                  alt="Admin"
                  style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", border: "2px solid #f06a3a" }}
                />
                <span style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, borderRadius: "50%", background: "#22c55e", border: "2px solid #ffffff" }} />
              </div>
              <div>
                <b style={{ fontSize: 13, color: "#183a37", display: "block", lineHeight: 1.2 }}>विजय सिंह (Vijay Singh)</b>
                <span style={{ fontSize: 10, color: "#f06a3a", fontWeight: 800 }}>टूर एवं यात्रा प्रबंधक (24x7)</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                border: "none",
                background: "#f3f4f6",
                borderRadius: "50%",
                width: 26,
                height: 26,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: "#4b5563",
              }}
              title="Close popup"
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ background: "#fff7ed", padding: "10px 12px", borderRadius: 12, border: "1px solid #ffedd5" }}>
            <p style={{ margin: 0, fontSize: 11, color: "#7c2d12", lineHeight: 1.45, fontWeight: 600 }}>
              🚩 <b>हर हर महादेव!</b> केदारनाथ, बद्रीनाथ, चार धाम या किसी भी यात्रा की तत्काल जानकारी व बुकिंग हेतु सीधे बात करें।
            </p>
          </div>

          {/* 1. Direct WhatsApp Chat */}
          <a
            href={whatsappDmUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "11px 14px",
              background: "#25D366",
              color: "#ffffff",
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 13,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(37,211,102,0.35)",
            }}
          >
            <WhatsAppIcon size={19} color="#ffffff" />
            <span>WhatsApp चैट (Direct DM)</span>
          </a>

          {/* 2. Direct Call */}
          <a
            href={`tel:${phone}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "11px 14px",
              background: "#183a37",
              color: "#fffaf2",
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            <Phone size={16} />
            <span>डायरेक्ट कॉल करें: {phone}</span>
          </a>

          {/* 3. WhatsApp Group */}
          <a
            href={groupUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "9px 12px",
              background: "#f4f0e8",
              color: "#183a37",
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 11,
              textDecoration: "none",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <Users size={15} color="#f06a3a" />
            <span>आधिकारिक यात्री WhatsApp ग्रुप</span>
          </a>
        </div>
      )}

      {/* Floating WhatsApp / Helpline Pulse Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 18px",
          borderRadius: 30,
          background: open ? "#183a37" : "linear-gradient(135deg, #25D366, #128C7E)",
          color: "#ffffff",
          border: "none",
          boxShadow: "0 8px 25px rgba(37,211,102,0.45)",
          cursor: "pointer",
          fontWeight: 800,
          fontSize: 13,
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        title="WhatsApp & Call Help (Vijay Singh)"
      >
        {open ? (
          <>
            <X size={18} />
            <span>बंद करें (Close)</span>
          </>
        ) : (
          <>
            <WhatsAppIcon size={20} color="#ffffff" />
            <span>WhatsApp / 24x7 Help</span>
          </>
        )}
      </button>
    </div>
  );
}

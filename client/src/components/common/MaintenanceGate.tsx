import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Phone, ShieldAlert, Wrench } from "lucide-react";
import { subscribeToSystemSettings, defaultSettings, type SystemSettings } from "@/lib/firebaseSettings";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { useTravelSession } from "@/contexts/TravelSessionContext";

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [location] = useLocation();
  const { profile } = useTravelSession();

  useEffect(() => {
    const unsub = subscribeToSystemSettings(setSettings);
    return () => unsub();
  }, []);

  const isAdmin = ["admin", "super_admin", "sub_admin"].includes(profile?.role ?? "");
  const isAdminRoute = location.startsWith("/admin");

  if (settings.maintenanceMode && !isAdmin && !isAdminRoute) {
    const cleanWhatsapp = (settings.ownerWhatsapp || "919876543210").replace(/\D/g, "");
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #183a37 0%, #0d211c 100%)",
          color: "#ffffff",
          padding: 24,
          fontFamily: "'Manrope', sans-serif",
          textAlign: "center",
        }}
      >
        <div
          style={{
            maxWidth: 540,
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(16px)",
            borderRadius: 24,
            padding: "40px 28px",
            border: "1.5px solid rgba(240, 106, 58, 0.3)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <img
            src="https://img.freepik.com/premium-vector/happy-maha-shivratri-lord-shiva-modern-logo-design-har-har-mahadev-hindi-calligraphy_428817-1867.jpg"
            alt="Har Har Mahadev"
            style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 16px", border: "2px solid #f06a3a" }}
          />

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 20,
              background: "rgba(240,106,58,0.2)",
              color: "#f06a3a",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.1em",
              marginBottom: 14,
            }}
          >
            <Wrench size={13} /> सिस्टम मेंटेनेंस मोड (MAINTENANCE MODE)
          </span>

          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, margin: "0 0 10px", lineHeight: 1.2 }}>
            हर हर महादेव टूर्स एंड ट्रेवल्स
          </h1>

          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, margin: "0 0 24px" }}>
            हमारी वेबसाइट पर नए यात्रा फीचर्स व सिस्टम अपडेट का कार्य चल रहा है। अतिशीघ्र सेवा पुनः लाइव होगी। किसी भी तत्काल बुकिंग या जानकारी के लिए हमारे हेल्पलाइन पर संपर्क करें।
          </p>

          {/* Action Contacts */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 24 }}>
            <a
              href={`https://wa.me/${cleanWhatsapp}?text=Har%20Har%20Mahadev!%20I%20need%20assistance%20with%20a%20booking%20during%20maintenance.`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 20px",
                background: "#25D366",
                color: "#ffffff",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13,
                textDecoration: "none",
                boxShadow: "0 4px 15px rgba(37,211,102,0.3)",
              }}
            >
              <WhatsAppIcon size={18} />
              <span>WhatsApp पर संपर्क करें</span>
            </a>

            <a
              href={`tel:${settings.ownerPhone || "+919876543210"}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 20px",
                background: "#ffffff",
                color: "#183a37",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              <Phone size={16} />
              <span>कॉल करें ({settings.ownerPhone || "+91 98765 43210"})</span>
            </a>
          </div>

          <a
            href="/admin"
            style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textDecoration: "underline" }}
          >
            Admin / Staff Login →
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

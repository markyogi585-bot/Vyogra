import { useEffect, useState } from "react";
import { Bell, CalendarDays, Compass, Heart, Megaphone, Search, UserRound, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import { travelerCopy } from "@/lib/travelerCopy";
import { roleLabels } from "@/lib/travelTypes";
import { subscribeToActiveBroadcasts, type LiveBroadcast } from "@/lib/firebaseBroadcasts";
import "./voyagr-shell.css";

export const MAHADEV_LOGO_URL = "https://img.freepik.com/premium-vector/happy-maha-shivratri-lord-shiva-modern-logo-design-har-har-mahadev-hindi-calligraphy_428817-1867.jpg";

export function MahadevLogo({ size = 36 }: { size?: number }) {
  return (
    <span
      className="shell-mark"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        border: "1.5px solid #f06a3a",
        boxShadow: "0 4px 12px rgba(240,106,58,0.25)",
        flexShrink: 0,
      }}
    >
      <img
        src={MAHADEV_LOGO_URL}
        alt="Har Har Mahadev Logo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scale(1.15)",
        }}
      />
    </span>
  );
}

import { getAppDict } from "@/lib/travelerCopy";

export function VoyagrShell({ children, title = "" }: { children: React.ReactNode; title?: string }) {
  const [location] = useLocation();
  const { profile, locale, setLocale, openAuth, openSearch } = useTravelSession();
  const [broadcasts, setBroadcasts] = useState<LiveBroadcast[]>([]);
  const [dismissedBc, setDismissedBc] = useState<string[]>([]);

  useEffect(() => {
    const unsub = subscribeToActiveBroadcasts(setBroadcasts);
    return () => unsub();
  }, []);

  const activeBroadcast = broadcasts.find((b) => !dismissedBc.includes(b.id || ""));
  const role = profile?.role ?? "guest";
  const isOperator = ["sub_admin", "admin", "super_admin"].includes(role);
  const controlPath = role === "super_admin" ? "/admin/system" : "/admin/tools";
  const dict = getAppDict(locale);
  const gate = (intent: "wishlist" | "account") => {
    if (profile) {
      window.location.assign(intent === "wishlist" ? "/wishlist" : "/account");
      return;
    }
    openAuth(intent);
  };

  return (
    <div className="voyagr-page-shell">
      {/* ── Real-time Live Announcement / Broadcast Bar ── */}
      {activeBroadcast && (
        <div
          style={{
            background:
              activeBroadcast.type === "urgent_alert" || activeBroadcast.type === "weather_warning"
                ? "linear-gradient(90deg, #dc2626, #991b1b)"
                : "linear-gradient(90deg, #ea580c, #c2410c)",
            color: "#ffffff",
            padding: "9px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 12,
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            position: "relative",
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, overflow: "hidden" }}>
            <Megaphone size={15} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              <b>{activeBroadcast.title}:</b> {activeBroadcast.message}
            </span>
            {activeBroadcast.actionLink && (
              <Link
                href={activeBroadcast.actionLink}
                style={{
                  background: "rgba(255,255,255,0.22)",
                  color: "#ffffff",
                  padding: "2px 8px",
                  borderRadius: 6,
                  textDecoration: "none",
                  fontSize: 11,
                  flexShrink: 0,
                  fontWeight: 800,
                }}
              >
                {activeBroadcast.actionText || "View"} →
              </Link>
            )}
          </div>
          <button
            onClick={() => activeBroadcast.id && setDismissedBc([...dismissedBc, activeBroadcast.id])}
            style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "grid", placeItems: "center", padding: 2 }}
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <header className="inner-header">
        <Link href="/">
          <span className="shell-brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <MahadevLogo />
            <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <b style={{ fontSize: 15, letterSpacing: "0.5px", color: "#183a37" }}>
                {locale === "hi-IN" ? "हर हर महादेव" : "HAR HAR MAHADEV"}
              </b>
              <small style={{ fontSize: 10, fontWeight: 800, color: "#f06a3a", letterSpacing: "1px" }}>
                {locale === "hi-IN" ? "टूर्स एंड ट्रेवल्स" : "TOURS & TRAVELS"}
              </small>
            </span>
          </span>
        </Link>
        <nav>
          <Link href="/explore" className={location === "/explore" ? "active" : ""}>{dict.nav.explore}</Link>
          <Link href="/trips" className={location === "/trips" || location.startsWith("/trip/") ? "active" : ""}>{dict.nav.trips}</Link>
          <button className={location === "/wishlist" ? "active shell-nav-button" : "shell-nav-button"} onClick={() => gate("wishlist")}>{dict.nav.saved}</button>
          {isOperator && <Link href={controlPath} className={location.startsWith("/admin") ? "active" : ""}>{dict.nav.control}</Link>}
        </nav>
        <div className="shell-actions">
          <button
            className="locale-toggle"
            onClick={() => setLocale(locale === "en-IN" ? "hi-IN" : "en-IN")}
            aria-label="Switch language"
            style={{ fontWeight: 800, padding: "6px 12px", borderRadius: 20, border: "1.5px solid rgba(0,0,0,0.15)" }}
          >
            {locale === "en-IN" ? "🇮🇳 हिंदी" : "🇬🇧 English"}
          </button>
          <button
            onClick={async () => {
              const { requestNotificationPermission, sendBrowserNotification } = await import("@/lib/browserNotifications");
              const res = await requestNotificationPermission();
              if (res === "granted") {
                toast.success("🚩 Notifications enabled! You will receive live yatra updates.");
                sendBrowserNotification("🚩 हर हर महादेव!", {
                  body: "Live Yatra updates & seat notifications are now active on your device.",
                });
              } else {
                toast("Notification permission was not enabled. You can enable it in browser settings.");
              }
            }}
            aria-label="Enable Yatra Notifications"
            title="Enable Live Yatra Notifications"
            style={{ position: "relative" }}
          >
            <Bell size={18} />
          </button>
          <button className="role-profile-button" onClick={() => gate("account")} aria-label="Profile">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt={profile.name} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <UserRound size={18} />
            )}
            <span>{profile ? (profile.name?.split(" ")[0] || roleLabels[role]) : (locale === "hi-IN" ? "लॉगिन करें" : "Guest")}</span>
          </button>
        </div>
      </header>

      <main>
        {children}

        {/* Premium Made in India & Full Travel Footer */}
        <footer style={{ marginTop: 60, padding: "56px 24px 120px", background: "linear-gradient(180deg, #0d1e1c 0%, #061110 100%)", color: "#ffffff", fontFamily: "'Manrope', sans-serif", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>
            
            {/* Top Row: Brand & Made in India Badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, paddingBottom: 36, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <img
                  src="https://img.freepik.com/premium-vector/happy-maha-shivratri-lord-shiva-modern-logo-design-har-har-mahadev-hindi-calligraphy_428817-1867.jpg"
                  alt="Logo"
                  style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #f06a3a" }}
                />
                <div>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, margin: 0, color: "#fffaf2", letterSpacing: "0.02em" }}>
                    हर हर महादेव टूर्स एंड ट्रेवल्स
                  </h3>
                  <small style={{ color: "#f06a3a", fontWeight: 800, fontSize: 11, letterSpacing: "0.08em" }}>
                    HAR HAR MAHADEV TOURS & TRAVELS · SACRED PILGRIMAGE & ALL INDIA
                  </small>
                </div>
              </div>

              {/* 24x7 Verified Tour Desk Badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  padding: "8px 18px",
                  borderRadius: 30,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", color: "#4ade80", textTransform: "uppercase" }}>
                  🟢 24x7 VERIFIED PILGRIM & TOUR OPERATOR
                </span>
              </div>
            </div>

            {/* 4-Column Detailed Portal Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32, padding: "36px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              
              {/* Col 1: Devotee & Spiritual Yatra */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#f06a3a", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 12 }}>
                  🚩 पवित्र तीर्थ यात्रा (Sacred Yatra)
                </span>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
                  <li><Link href="/explore" style={{ color: "inherit", textDecoration: "none" }}>केदारनाथ एवं बद्रीनाथ धाम</Link></li>
                  <li><Link href="/explore" style={{ color: "inherit", textDecoration: "none" }}>12 ज्योतिर्लिंग दर्शन यात्रा</Link></li>
                  <li><Link href="/explore" style={{ color: "inherit", textDecoration: "none" }}>काशी विश्वनाथ व गंगा आरती</Link></li>
                  <li><Link href="/explore" style={{ color: "inherit", textDecoration: "none" }}>अयोध्या राम मंदिर व प्रयागराज संगम</Link></li>
                </ul>
              </div>

              {/* Col 2: Leisure & Family Tours */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#f06a3a", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 12 }}>
                  🌴 हॉलिडे व हेरिटेज टूर्स (Leisure)
                </span>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
                  <li><Link href="/explore" style={{ color: "inherit", textDecoration: "none" }}>राजस्थान रॉयल हेरिटेज टूर</Link></li>
                  <li><Link href="/explore" style={{ color: "inherit", textDecoration: "none" }}>गोवा बीच व कोस्टल वेकेशन</Link></li>
                  <li><Link href="/explore" style={{ color: "inherit", textDecoration: "none" }}>केरल बैकवाटर्स व मुन्नार टी गार्डन्स</Link></li>
                  <li><Link href="/explore" style={{ color: "inherit", textDecoration: "none" }}>ऋषिकेश गंगा आरती व रिवर राफ्टिंग</Link></li>
                </ul>
              </div>

              {/* Col 3: Quick Traveler Services */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#f06a3a", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 12 }}>
                  ⚡ त्वरित सेवाएं (Quick Links)
                </span>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
                  <li><Link href="/access" style={{ color: "inherit", textDecoration: "none" }}>बुकिंग स्टेटस / डिजिटल ई-पास</Link></li>
                  <li><Link href="/trips" style={{ color: "inherit", textDecoration: "none" }}>मेरी यात्राएं (My Trips)</Link></li>
                  <li><Link href="/account" style={{ color: "inherit", textDecoration: "none" }}>यात्री प्रोफाइल (Profile Desk)</Link></li>
                  <li><Link href="/support" style={{ color: "inherit", textDecoration: "none" }}>24x7 सहायता केंद्र (Help Desk)</Link></li>
                </ul>
              </div>

              {/* Col 4: Trust, Safety & Contact */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#facc15", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 12 }}>
                  🛡️ संपर्क व संचालक (Vijay Singh)
                </span>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: "0 0 12px", lineHeight: 1.5 }}>
                  संचालक: विजय सिंह (Vijay Singh) · 50,000+ संतुष्ट तीर्थयात्रियों का अटूट विश्वास।
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                  <a href="tel:+919630642541" style={{ color: "#4ade80", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    📞 Helpline: +91 96306 42541
                  </a>
                  <a href="https://wa.me/919630642541?text=हर%20हर%20महादेव!%20मैं%20यात्रा%20पैकेज%20की%20जानकारी%20चाहता%20हूँ।" target="_blank" rel="noopener noreferrer" style={{ color: "#25d366", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    💬 WhatsApp: +91 96306 42541
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Row: Copyright & Legal */}
            <div style={{ paddingTop: 24, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 14, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
              <span>© 2026 Har Har Mahadev Tours & Travels Private Limited. All Rights Reserved.</span>
              <span>GSTIN: 07AAACH2026M1ZX · 100% Satvik Hospitality & Dedicated Pilgrim Coordinators</span>
            </div>
          </div>
        </footer>
      </main>

      <nav className="inner-bottom-nav" aria-label="Primary mobile navigation">
        <Link href="/" className={location === "/" ? "active" : ""} aria-label="Home">
          <Compass size={20} />
          <span>{locale === "hi-IN" ? "होम" : "Home"}</span>
        </Link>
        <Link href="/explore" className={location === "/explore" ? "active" : ""} aria-label="Explore packages">
          <Search size={20} />
          <span>{locale === "hi-IN" ? "टूर खोजें" : "Explore"}</span>
        </Link>
        <Link href="/trips" className={location === "/trips" || location.startsWith("/trips/") || location.startsWith("/trip/") ? "active" : ""} aria-label="My trips">
          <CalendarDays size={20} />
          <span>{locale === "hi-IN" ? "मेरी यात्राएं" : "My Trips"}</span>
        </Link>
        <button className={location === "/wishlist" ? "active" : ""} onClick={() => gate("wishlist")} aria-label="Saved routes">
          <Heart size={20} />
          <span>{locale === "hi-IN" ? "सेव्ड" : "Saved"}</span>
        </button>
        <button className={location === "/account" ? "active" : ""} onClick={() => gate("account")} aria-label="Profile">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt={profile.name} style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <UserRound size={20} />
          )}
          <span>{locale === "hi-IN" ? "प्रोफाइल" : "Profile"}</span>
        </button>
      </nav>
    </div>
  );
}

export function PageIntro({ kicker, title, body }: { kicker: string; title: React.ReactNode; body?: string }) {
  const { locale } = useTravelSession();
  const copy = travelerCopy(locale);
  const intros = {
    "ROUTE LIBRARY / 06": copy.explore,
    "YOUR ROUTES / 07": copy.trips,
    "YOUR SAVED PLACES / 08": copy.wishlist,
    "YOUR INBOX / 09": copy.notifications,
    "WE’RE HERE / 10": copy.support,
  } as const;
  const localized = intros[kicker as keyof typeof intros];
  const localizedTitle = localized && "lineOne" in localized
    ? <>{localized.lineOne}<br /><i>{localized.lineTwo}</i></>
    : title;
  const localizedBody = localized && "body" in localized ? localized.body : body;
  return <div className="page-intro"><div className="route-thread"><span /><i /><span /><i /><span /></div><span className="admin-overline">{localized?.kicker ?? kicker}</span><h1>{localizedTitle}</h1>{localizedBody && <p>{localizedBody}</p>}</div>;
}

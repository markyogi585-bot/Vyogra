import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  BarChart3, Bell, CalendarDays, Camera, ChevronRight, FolderOpen, Image as ImageIcon,
  LoaderCircle, LogOut, Megaphone, MessageCircle, Menu, Package, Plus, Search,
  Settings2, ShieldCheck, Tag, Ticket, Trash2, Users, Wallet, X, CheckCircle,
  UserCheck, Sparkles, TrendingUp, Activity, Eye, Edit3, Save, Phone, Mail, Layers,
} from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import { useAdminPackages } from "@/hooks/usePackages";
import { firebaseAuth, firebaseDb } from "@/lib/firebase";
import {
  archivePackage,
  deletePackage as fbDeletePackage,
  updatePackage as fbUpdatePackage,
  type FirebasePackage,
} from "@/lib/firebasePackages";
import {
  subscribeToAllBookings,
  updateBookingStatus,
  bookingStatusLabel,
  type FirebaseBooking,
  type BookingStatus,
} from "@/lib/firebaseBookings";
import {
  subscribeToAdminStats,
  subscribeToTravelers,
  type TravelerProfile,
  type AdminStats,
} from "@/lib/firebaseAdmin";
import { AdminTravelers } from "./AdminTravelers";
import { AdminBroadcasts } from "./AdminBroadcasts";
import { PulseBadge, TableSkeleton } from "@/components/common/ModernLoadingSkeleton";
import { AdminCustomTripOrganizer } from "./AdminCustomTripOrganizer";
import { AdminManualBookingDesk } from "./AdminManualBookingDesk";
import { ImgBBDropzone } from "@/components/common/ImgBBDropzone";
import type { GalleryPhoto } from "@/lib/firebaseGallery";
import type { SessionProfile } from "@/lib/travelTypes";

export default function AdminApp() {
  const { profile, signOut } = useTravelSession();
  const [, navigate] = useLocation();
  const [active, setActive] = useState("Overview");
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Real-time Firebase data streams
  const [bookings, setBookings] = useState<FirebaseBooking[]>([]);
  const [travelers, setTravelers] = useState<TravelerProfile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const { packages, isLoading: packagesLoading, refetch } = useAdminPackages();

  useEffect(() => {
    const unsubStats = subscribeToAdminStats(setStats);
    const unsubBookings = subscribeToAllBookings(setBookings);
    const unsubTravelers = subscribeToTravelers(setTravelers);
    return () => {
      unsubStats();
      unsubBookings();
      unsubTravelers();
    };
  }, []);

  const navItems = [
    [BarChart3, "Overview"],
    [Ticket, "Manual Booking Desk"],
    [Package, "Packages"],
    [CalendarDays, "Bookings"],
    [ImageIcon, "Hero Banners"],
    [Camera, "Photo Gallery"],
    [Users, "Travelers"],
    [Users, "Custom Group Trips"],
    [Megaphone, "Broadcasts"],
    [MessageCircle, "Support Desk"],
    [UserCheck, "Admin Profile"],
    [Settings2, "System Settings"],
  ] as const;

  const pendingBookingsCount = bookings.filter(
    (b) => b.approvalStatus === "pending_manual_review" || b.status === "pending_approval",
  ).length;

  const handleSelectTab = (label: string) => {
    if (label === "System Settings") navigate("/admin/system");
    else setActive(label);
    setMobileMenuOpen(false);
  };

  return (
    <div className="ops-app" style={{ minHeight: "100vh", position: "relative" }}>
      {/* ── Mobile Top Bar (Visible only on mobile/tablet) ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#183a37",
          color: "#fffaf2",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        }}
        className="admin-mobile-header"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: "6px 8px",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8,
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}>
            <img
              src="https://img.freepik.com/premium-vector/happy-maha-shivratri-lord-shiva-modern-logo-design-har-har-mahadev-hindi-calligraphy_428817-1867.jpg"
              alt="Logo"
              style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #f06a3a" }}
            />
            <div>
              <b style={{ fontSize: 12, letterSpacing: "0.08em", display: "block" }}>ADMIN PORTAL</b>
              <small style={{ color: "#f06a3a", fontSize: 9, fontWeight: 800 }}>{active}</small>
            </div>
          </a>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {pendingBookingsCount > 0 && (
            <button
              onClick={() => handleSelectTab("Bookings")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 8px",
                borderRadius: 20,
                background: "#e02424",
                color: "white",
                border: "none",
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              ⚠️ {pendingBookingsCount} Review
            </button>
          )}
          <button
            onClick={() => navigate("/admin/packages/new")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 10px",
              borderRadius: 8,
              background: "#f06a3a",
              color: "white",
              border: "none",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            <Plus size={14} /> New
          </button>
        </div>
      </header>

      {/* ── Mobile Horizontal Pill Scroller for Fast 1-Tap Switching ── */}
      <div
        className="admin-mobile-tab-scroller"
        style={{
          display: "flex",
          gap: 6,
          padding: "8px 12px",
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          whiteSpace: "nowrap",
          position: "sticky",
          top: 54,
          zIndex: 35,
        }}
      >
        {navItems.map(([Icon, label]) => (
          <button
            key={label}
            onClick={() => handleSelectTab(label)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 20,
              border: active === label ? "1.5px solid #f06a3a" : "1px solid #e5e7eb",
              background: active === label ? "#f06a3a" : "#f9fafb",
              color: active === label ? "#ffffff" : "#4b5563",
              fontSize: 11,
              fontWeight: active === label ? 800 : 600,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Icon size={13} />
            <span>{label}</span>
            {label === "Bookings" && pendingBookingsCount > 0 && (
              <span style={{ padding: "0 5px", borderRadius: 10, background: active === label ? "#ffffff" : "#e02424", color: active === label ? "#e02424" : "#ffffff", fontSize: 9, fontWeight: 900 }}>
                {pendingBookingsCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Mobile Drawer Overlay ── */}
      {mobileMenuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              width: "280px",
              height: "100%",
              background: "#183a37",
              color: "#fffaf2",
              padding: "20px 16px",
              display: "flex",
              flexDirection: "column",
              boxShadow: "4px 0 20px rgba(0,0,0,0.3)",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <b style={{ fontSize: 14, color: "#f06a3a", letterSpacing: "0.1em" }}>OPERATIONS MENU</b>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {navItems.map(([Icon, label]) => (
                <button
                  key={label}
                  onClick={() => handleSelectTab(label)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: active === label ? "rgba(240, 106, 58, 0.2)" : "transparent",
                    color: active === label ? "#f06a3a" : "rgba(255,255,255,0.8)",
                    border: "none",
                    fontSize: 13,
                    fontWeight: active === label ? 800 : 500,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <Icon size={17} style={{ color: active === label ? "#f06a3a" : "inherit" }} />
                  <span style={{ flex: 1 }}>{label}</span>
                  {label === "Bookings" && pendingBookingsCount > 0 && (
                    <span style={{ padding: "2px 7px", borderRadius: 10, background: "#e02424", color: "white", fontSize: 10, fontWeight: 900 }}>
                      {pendingBookingsCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12 }}>
                <b>{profile?.name || "Admin"}</b>
                <small style={{ display: "block", opacity: 0.6 }}>Super Administrator</small>
              </div>
              <button
                onClick={signOut}
                style={{ background: "rgba(239,68,68,0.2)", border: "1px solid #ef4444", color: "#f87171", padding: "6px 10px", borderRadius: 8, fontSize: 11, cursor: "pointer" }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar (Desktop) ── */}
      <aside className="ops-sidebar">
        <a href="/" className="ops-brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="https://img.freepik.com/premium-vector/happy-maha-shivratri-lord-shiva-modern-logo-design-har-har-mahadev-hindi-calligraphy_428817-1867.jpg"
            alt="Logo"
            style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "1.5px solid #f06a3a" }}
          />
          <div>
            <b style={{ fontSize: 13, lineHeight: 1.1, display: "block" }}>HAR HAR MAHADEV</b>
            <small style={{ color: "#f06a3a", fontWeight: 800 }}>OPERATIONS DESK</small>
          </div>
        </a>

        <div className="ops-label">Workspace</div>
        <nav>
          {navItems.map(([Icon, label]) => (
            <button
              key={label}
              className={active === label ? "active" : ""}
              onClick={() => {
                if (label === "System Settings") navigate("/admin/system");
                else setActive(label);
              }}
            >
              <Icon size={16} />
              <span>{label}</span>
              {label === "Bookings" && pendingBookingsCount > 0 && (
                <b style={{ background: "#e02424", color: "white", padding: "1px 6px", borderRadius: 10, fontSize: 11 }}>
                  {pendingBookingsCount}
                </b>
              )}
            </button>
          ))}
        </nav>

        <div className="ops-user">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt={profile.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <span>{profile?.name?.slice(0, 2).toUpperCase() ?? "AD"}</span>
          )}
          <div>
            <strong>{profile?.name ?? "Admin"}</strong>
            <small>{profile?.role?.replaceAll("_", " ") ?? "Super Admin"}</small>
          </div>
          <button onClick={signOut} title="Sign out" style={{ background: "none", border: "none", cursor: "pointer", color: "#888", marginLeft: "auto" }}>
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* ── Main Operations Content ── */}
      <main className="ops-main">
        <header className="ops-header">
          <div>
            <span className="admin-overline">HAR HAR MAHADEV / {active.toUpperCase()}</span>
            <h1>
              {active === "Overview" ? (
                <>Pilgrimage & Tours<br /><i>Operations Desk</i></>
              ) : active}
            </h1>
          </div>

          <div className="ops-actions">
            <button onClick={() => navigate("/admin/packages/new")} className="ops-cta">
              <Plus size={15} /> Create Package
            </button>
          </div>
        </header>

        <section className="ops-content">
          {active === "Overview" && (
            <OverviewSection stats={stats} bookings={bookings} packages={packages} travelers={travelers} onOpenTab={setActive} />
          )}

          {active === "Manual Booking Desk" && (
            <AdminManualBookingDesk />
          )}

          {active === "Packages" && (
            <PackagesSection packages={packages} isLoading={packagesLoading} refetch={refetch} />
          )}

          {active === "Bookings" && (
            <BookingsSection bookings={bookings} />
          )}

          {active === "Hero Banners" && (
            <HeroBannersSection />
          )}

          {active === "Photo Gallery" && (
            <AdminPhotoGallerySection />
          )}

          {active === "Travelers" && (
            <AdminTravelers travelers={travelers} search={search} setSearch={setSearch} />
          )}

          {active === "Custom Group Trips" && (
            <AdminCustomTripOrganizer />
          )}

          {active === "Broadcasts" && (
            <AdminBroadcasts />
          )}

          {active === "Support Desk" && (
            <SupportDeskSection adminProfile={profile ? { uid: profile.uid || "admin", name: profile.name || "Admin" } : null} />
          )}

          {active === "Admin Profile" && (
            <AdminProfileSection profile={profile} signOut={signOut} />
          )}

          {active === "System Settings" && (
            <SystemSettingsSection adminUid={profile?.uid || "admin"} />
          )}
        </section>
      </main>
    </div>
  );
}

function OverviewSection({ stats, bookings, packages, travelers, onOpenTab }: {
  stats: AdminStats | null;
  bookings: FirebaseBooking[];
  packages: FirebasePackage[];
  travelers: TravelerProfile[];
  onOpenTab: (tab: string) => void;
}) {
  const [, navigate] = useLocation();
  const pendingApprovals = bookings.filter(b => b.approvalStatus === "pending_manual_review" || b.status === "pending_approval").length;
  const confirmedBookings = bookings.filter(b => b.status === "confirmed" || b.status === "on_trip" || b.status === "completed").length;
  const liveRoutes = packages.filter(p => p.status === "live").length;
  const totalRevenue = bookings.filter(b => b.status === "confirmed" || b.status === "on_trip" || b.status === "completed").reduce((sum, b) => sum + (b.grandTotal || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Live Firestore Stream Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          background: "linear-gradient(135deg, #183a37 0%, #1e4542 100%)",
          color: "#fffaf2",
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(24,58,55,0.12)",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ position: "relative", display: "flex", width: 10, height: 10 }}>
            <span style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", background: "#22c55e", opacity: 0.75, animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
            <span style={{ position: "relative", width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#86efac" }}>
            Real-Time Firebase Stream Active
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, color: "rgba(255,250,242,0.75)" }}>
          <span>Database: <b>tour-b631c</b></span>
          <span>•</span>
          <span>Verified Bookings: <b>{confirmedBookings}</b></span>
          <span>•</span>
          <span style={{ color: "#f06a3a", fontWeight: 800 }}>Har Har Mahadev Yatra 2026</span>
        </div>
      </div>

      {/* ── 4 Modern 2026 Glassmorphic KPI Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {/* Card 1: Manual Reviews Pending */}
        <div
          onClick={() => onOpenTab("Bookings")}
          style={{
            padding: "20px 22px",
            background: pendingApprovals > 0 ? "linear-gradient(145deg, #fff7ed, #ffffff)" : "#ffffff",
            border: pendingApprovals > 0 ? "1.5px solid #fdba74" : "1px solid #e5e7eb",
            borderRadius: 20,
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: "#ea580c", textTransform: "uppercase" }}>
              Manual Reviews
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#ffedd5", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <b style={{ fontSize: 32, fontWeight: 900, color: "#183a37", fontFamily: "'DM Serif Display', serif" }}>
            {pendingApprovals}
          </b>
          <small style={{ color: pendingApprovals > 0 ? "#c2410c" : "#16a34a", fontSize: 11, fontWeight: 700 }}>
            {pendingApprovals > 0 ? "⚠️ Requires seat verification & host" : "✓ All bookings verified"}
          </small>
        </div>

        {/* Card 2: Total Bookings & Revenue */}
        <div
          onClick={() => onOpenTab("Bookings")}
          style={{
            padding: "20px 22px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: "#15803d", textTransform: "uppercase" }}>
              Total Reservations
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ticket size={18} />
            </div>
          </div>
          <b style={{ fontSize: 32, fontWeight: 900, color: "#183a37", fontFamily: "'DM Serif Display', serif" }}>
            {bookings.length}
          </b>
          <small style={{ color: "#166534", fontSize: 11, fontWeight: 700 }}>
            Revenue: ₹{totalRevenue.toLocaleString("en-IN")}
          </small>
        </div>

        {/* Card 3: Live Catalog Packages */}
        <div
          onClick={() => onOpenTab("Packages")}
          style={{
            padding: "20px 22px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: "#2563eb", textTransform: "uppercase" }}>
              Live Tour Catalog
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={18} />
            </div>
          </div>
          <b style={{ fontSize: 32, fontWeight: 900, color: "#183a37", fontFamily: "'DM Serif Display', serif" }}>
            {liveRoutes}
          </b>
          <small style={{ color: "#4b5563", fontSize: 11, fontWeight: 600 }}>
            {packages.length} total packages configured
          </small>
        </div>

        {/* Card 4: Registered Travelers */}
        <div
          onClick={() => onOpenTab("Travelers")}
          style={{
            padding: "20px 22px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: "#7c3aed", textTransform: "uppercase" }}>
              Registered Devotees
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "#ede9fe", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={18} />
            </div>
          </div>
          <b style={{ fontSize: 32, fontWeight: 900, color: "#183a37", fontFamily: "'DM Serif Display', serif" }}>
            {Math.max(travelers.length, stats?.totalTravelers || 0)}
          </b>
          <small style={{ color: "#6d28d9", fontSize: 11, fontWeight: 700 }}>
            Firebase identity verified ({travelers.length} active sessions)
          </small>
        </div>
      </div>

      {/* ── Quick Action Command Hub ── */}
      <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 20, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <b style={{ fontSize: 14, color: "#183a37" }}>Operations Command Hub</b>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>Direct 1-tap shortcuts to all operations desks</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#f06a3a" }}>⚡ Quick Launch</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          <button
            onClick={() => onOpenTab("Manual Booking Desk")}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#fbf9f4", border: "1px solid #e5e7eb", borderRadius: 12, cursor: "pointer", textAlign: "left" }}
          >
            <Ticket size={17} style={{ color: "#f06a3a" }} />
            <div>
              <b style={{ fontSize: 12, display: "block", color: "#183a37" }}>Manual Booking</b>
              <small style={{ fontSize: 9, color: "#6b7280" }}>Issue custom ticket</small>
            </div>
          </button>

          <button
            onClick={() => navigate("/admin/packages/new")}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#fbf9f4", border: "1px solid #e5e7eb", borderRadius: 12, cursor: "pointer", textAlign: "left" }}
          >
            <Plus size={17} style={{ color: "#16a34a" }} />
            <div>
              <b style={{ fontSize: 12, display: "block", color: "#183a37" }}>New Package</b>
              <small style={{ fontSize: 9, color: "#6b7280" }}>Launch tour route</small>
            </div>
          </button>

          <button
            onClick={() => onOpenTab("Hero Banners")}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#fbf9f4", border: "1px solid #e5e7eb", borderRadius: 12, cursor: "pointer", textAlign: "left" }}
          >
            <ImageIcon size={17} style={{ color: "#2563eb" }} />
            <div>
              <b style={{ fontSize: 12, display: "block", color: "#183a37" }}>Hero Banners</b>
              <small style={{ fontSize: 9, color: "#6b7280" }}>Homepage slider</small>
            </div>
          </button>

          <button
            onClick={() => onOpenTab("Photo Gallery")}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#fbf9f4", border: "1px solid #e5e7eb", borderRadius: 12, cursor: "pointer", textAlign: "left" }}
          >
            <Camera size={17} style={{ color: "#7c3aed" }} />
            <div>
              <b style={{ fontSize: 12, display: "block", color: "#183a37" }}>Photo Gallery</b>
              <small style={{ fontSize: 9, color: "#6b7280" }}>Devotee uploads</small>
            </div>
          </button>

          <button
            onClick={() => onOpenTab("Broadcasts")}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#fbf9f4", border: "1px solid #e5e7eb", borderRadius: 12, cursor: "pointer", textAlign: "left" }}
          >
            <Megaphone size={17} style={{ color: "#ea580c" }} />
            <div>
              <b style={{ fontSize: 12, display: "block", color: "#183a37" }}>Broadcasts</b>
              <small style={{ fontSize: 9, color: "#6b7280" }}>Emergency alerts</small>
            </div>
          </button>

          <button
            onClick={() => onOpenTab("Admin Profile")}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#fbf9f4", border: "1px solid #e5e7eb", borderRadius: 12, cursor: "pointer", textAlign: "left" }}
          >
            <UserCheck size={17} style={{ color: "#059669" }} />
            <div>
              <b style={{ fontSize: 12, display: "block", color: "#183a37" }}>Admin Profile</b>
              <small style={{ fontSize: 9, color: "#6b7280" }}>Identity & logout</small>
            </div>
          </button>
        </div>
      </div>

      {/* ── Recent Reservations Live Feed ── */}
      <section style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 20, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <b style={{ fontSize: 14, color: "#183a37" }}>Recent Live Reservations ({bookings.length})</b>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280" }}>Real-time bookings received through online manual checkout and desk</p>
          </div>
          <button
            onClick={() => onOpenTab("Bookings")}
            style={{ background: "transparent", border: "none", color: "#f06a3a", fontWeight: 800, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
          >
            View All ({bookings.length}) →
          </button>
        </div>

        {bookings.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#6b7280", fontSize: 13 }}>
            No bookings recorded yet. New reservations will appear here in real-time.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {bookings.slice(0, 6).map((b) => (
              <div
                key={b.id ?? b.bookingCode}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 16px",
                  background: "#f9fafb",
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ padding: "6px 10px", borderRadius: 8, background: "#183a37", color: "#fffaf2", fontFamily: "monospace", fontSize: 12, fontWeight: 800 }}>
                    {b.bookingCode}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 13, color: "#183a37", fontWeight: 700 }}>
                      {b.travelerName} · <span style={{ color: "#4b5563", fontWeight: 500 }}>{b.packageName}</span>
                    </h4>
                    <small style={{ color: "#6b7280", fontSize: 11 }}>
                      {b.adultsCount || 1} Adults {b.childrenCount ? `+ ${b.childrenCount} Children` : ""} · {b.travelDate || "Custom Date"}
                    </small>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <strong style={{ fontSize: 14, color: "#183a37" }}>
                    ₹{(b.grandTotal || 0).toLocaleString("en-IN")}
                  </strong>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "4px 9px",
                      borderRadius: 12,
                      background: b.status === "confirmed" ? "#dcfce7" : b.status === "pending_approval" || b.approvalStatus === "pending_manual_review" ? "#ffedd5" : "#f1f5f9",
                      color: b.status === "confirmed" ? "#166534" : b.status === "pending_approval" || b.approvalStatus === "pending_manual_review" ? "#c2410c" : "#475569",
                    }}
                  >
                    {b.status === "pending_approval" || b.approvalStatus === "pending_manual_review" ? "⚠️ Pending Review" : bookingStatusLabel(b.status)}
                  </span>
                  <button
                    onClick={() => onOpenTab("Bookings")}
                    style={{ padding: "6px 12px", borderRadius: 8, background: "#183a37", color: "#fffaf2", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PackagesSection({ packages, isLoading, refetch }: {
  packages: FirebasePackage[];
  isLoading: boolean;
  refetch: () => Promise<void>;
}) {
  const [, navigate] = useLocation();
  const [toggling, setToggling] = useState<string | null>(null);
  const [quickEditPkg, setQuickEditPkg] = useState<FirebasePackage | null>(null);

  // Quick edit form state
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<string>("");
  const [editDays, setEditDays] = useState<number>(1);
  const [editNights, setEditNights] = useState<number>(0);
  const [editSlots, setEditSlots] = useState<string[]>([]);
  const [editNewSlot, setEditNewSlot] = useState<string>("");
  const [editWhatsappGroup, setEditWhatsappGroup] = useState<string>("");
  const [savingQuick, setSavingQuick] = useState(false);

  const openQuickEdit = (pkg: FirebasePackage) => {
    setQuickEditPkg(pkg);
    setEditPrice(pkg.price ?? 0);
    setEditDuration(pkg.duration ?? "");
    setEditDays(pkg.days ?? 1);
    setEditNights(pkg.nights ?? 0);
    setEditSlots(pkg.departureSlots ? [...pkg.departureSlots] : ["Daily Morning 6:00 AM Batch", "Daily Evening 4:00 PM Batch"]);
    setEditWhatsappGroup(pkg.whatsappGroupLink || "");
  };

  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditPkg?.id) return;
    setSavingQuick(true);
    try {
      await fbUpdatePackage(quickEditPkg.id, {
        price: Number(editPrice),
        duration: editDuration.trim() || `${editNights} nights · ${editDays} days`,
        days: Number(editDays),
        nights: Number(editNights),
        departureSlots: editSlots.filter(Boolean),
        whatsappGroupLink: editWhatsappGroup.trim(),
      });
      toast.success(`⚡ ${quickEditPkg.name} updated: ₹${editPrice} · ${editDuration}`);
      setQuickEditPkg(null);
      await refetch();
    } catch {
      toast.error("Failed to update package price & time.");
    } finally {
      setSavingQuick(false);
    }
  };

  const toggleStatus = async (pkg: FirebasePackage) => {
    if (!pkg.id) return;
    setToggling(pkg.id);
    const next = pkg.status === "live" ? "draft" : "live";
    try {
      await fbUpdatePackage(pkg.id, { status: next });
      toast.success(`${pkg.name} is now ${next.toUpperCase()} (${next === "live" ? "Visible to users" : "Hidden from site"}).`);
      await refetch();
    } catch {
      toast.error("Failed to update package status.");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (pkg: FirebasePackage) => {
    if (!pkg.id) return;
    if (!window.confirm(`Are you sure you want to remove ${pkg.name}?`)) return;
    try {
      await fbDeletePackage(pkg.id);
      toast.success(`${pkg.name} permanently removed from catalog.`);
      await refetch();
    } catch {
      toast.error("Failed to remove package.");
    }
  };

  const handleClearDemoPackages = async () => {
    if (!window.confirm("Are you sure you want to hide/remove all demo seed packages? You can add your own fresh packages anytime.")) return;
    try {
      for (const p of packages) {
        if (p.id) await fbDeletePackage(p.id);
      }
      toast.success("All demo packages removed. You now have a clean custom catalog!");
      await refetch();
    } catch {
      toast.error("Error clearing packages.");
    }
  };

  return (
    <>
      <div className="ops-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
        <div className="ops-search" style={{ flex: "1 1 200px" }}><Search size={16} /><input placeholder="Search catalog packages…" /></div>
        <div style={{ display: "flex", gap: 8 }}>
          {packages.length > 0 && (
            <button
              onClick={handleClearDemoPackages}
              style={{
                padding: "10px 14px",
                background: "#fee2e2",
                color: "#dc2626",
                border: "1px solid #fca5a5",
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Trash2 size={14} /> Clear Demo Packages
            </button>
          )}
          <button className="ops-cta" onClick={() => navigate("/admin/packages/new")}>
            <Plus size={15} /> Create New Package
          </button>
        </div>
      </div>

      <section className="ops-panel">
        <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <b style={{ fontSize: 13, color: "#183a37" }}>Active Catalog Packages ({packages.length})</b>
            <p style={{ margin: 0, fontSize: 11, color: "#777" }}>Click "⚡ Quick Edit" to change price, timings & slots in 1 tap.</p>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 24, display: "flex", gap: 8, opacity: 0.6 }}><LoaderCircle size={16} className="animate-spin" /> Loading catalog…</div>
        ) : packages.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", opacity: 0.6 }}>No packages found. Create one with the Package Builder!</div>
        ) : (
          packages.map((pkg) => {
            const isLive = pkg.status === "live";
            return (
              <div
                className="ops-package-row"
                key={pkg.id ?? pkg.name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1.4fr 110px 120px auto",
                  gap: 12,
                  alignItems: "center",
                  padding: "14px 18px",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  opacity: isLive ? 1 : 0.65,
                }}
              >
                <img
                  src={pkg.image}
                  alt={pkg.name}
                  style={{ width: 70, height: 50, borderRadius: 8, objectFit: "cover" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80"; }}
                />
                <div>
                  <b style={{ fontSize: 14, color: "#183a37" }}>{pkg.name}</b>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#718079" }}>{pkg.location} · <span style={{ color: "#f06a3a", fontWeight: 700 }}>{pkg.duration}</span></p>
                </div>
                <div>
                  <strong style={{ fontSize: 14, color: "#183a37" }}>₹{(pkg.price ?? 0).toLocaleString("en-IN")}</strong>
                  <small style={{ display: "block", fontSize: 10, color: "#888" }}>per traveler</small>
                </div>
                <div>
                  <button
                    onClick={() => toggleStatus(pkg)}
                    disabled={toggling === pkg.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 20,
                      border: "none",
                      background: isLive ? "#dcfce7" : "#f1f5f9",
                      color: isLive ? "#166534" : "#475569",
                      fontWeight: 800,
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: isLive ? "#22c55e" : "#94a3b8" }} />
                    <span>{toggling === pkg.id ? "Updating…" : isLive ? "LIVE (Visible)" : "DRAFT (Hidden)"}</span>
                  </button>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    onClick={() => openQuickEdit(pkg)}
                    style={{ padding: "6px 10px", background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}
                    title="Quick Edit Price, Duration & WhatsApp Group"
                  >
                    ⚡ Quick Edit
                  </button>
                  <button
                    onClick={() => pkg.id && navigate(`/admin/packages/${pkg.id}`)}
                    style={{ padding: "6px 10px", background: "#f4f0e8", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    Full
                  </button>
                  <button
                    onClick={() => handleDelete(pkg)}
                    style={{ padding: "6px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* ── Quick Price & Time Editor Modal ── */}
      {quickEditPkg && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#ffffff", borderRadius: 20, maxWidth: 540, width: "100%", padding: "24px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: 14, marginBottom: 18 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 900, color: "#f06a3a", letterSpacing: "0.1em" }}>⚡ QUICK PRICE & TIME MANAGER</span>
                <h3 style={{ margin: "2px 0 0", fontSize: 18, color: "#183a37" }}>{quickEditPkg.name}</h3>
              </div>
              <button onClick={() => setQuickEditPkg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveQuickEdit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#183a37", marginBottom: 4 }}>
                    Price per Adult (₹) <span style={{ color: "#e11d48" }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    required
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 14, fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#183a37", marginBottom: 4 }}>
                    Duration Display <span style={{ color: "#e11d48" }}>*</span>
                  </label>
                  <input
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    placeholder="e.g. 3 nights · 4 days"
                    required
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#183a37", marginBottom: 4 }}>Total Days</label>
                  <input
                    type="number"
                    min={1}
                    value={editDays}
                    onChange={(e) => {
                      const d = Number(e.target.value);
                      setEditDays(d);
                      setEditNights(Math.max(0, d - 1));
                      setEditDuration(`${Math.max(0, d - 1)} nights · ${d} days`);
                    }}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#183a37", marginBottom: 4 }}>Total Nights</label>
                  <input
                    type="number"
                    min={0}
                    value={editNights}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setEditNights(n);
                      setEditDuration(`${n} nights · ${editDays} days`);
                    }}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Departure Slots / Timings */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#183a37", marginBottom: 4 }}>
                  Departure Batches & Time Slots
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                  {editSlots.map((slot, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        value={slot}
                        onChange={(e) => {
                          const updated = [...editSlots];
                          updated[idx] = e.target.value;
                          setEditSlots(updated);
                        }}
                        style={{ flex: 1, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                      />
                      <button
                        type="button"
                        onClick={() => setEditSlots(editSlots.filter((_, i) => i !== idx))}
                        style={{ background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 8, padding: "6px 8px", cursor: "pointer" }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    value={editNewSlot}
                    onChange={(e) => setEditNewSlot(e.target.value)}
                    placeholder="Add new slot e.g. Daily 6:00 AM or 15 Nov - 20 Nov"
                    style={{ flex: 1, padding: "8px 10px", border: "1px dashed #cbd5e1", borderRadius: 8, fontSize: 12 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editNewSlot.trim()) {
                        setEditSlots([...editSlots, editNewSlot.trim()]);
                        setEditNewSlot("");
                      }
                    }}
                    style={{ padding: "8px 14px", background: "#183a37", color: "white", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    + Add Slot
                  </button>
                </div>
              </div>

              {/* Custom WhatsApp Group Link */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#183a37", marginBottom: 4 }}>
                  Custom WhatsApp Group Link (Optional)
                </label>
                <input
                  value={editWhatsappGroup}
                  onChange={(e) => setEditWhatsappGroup(e.target.value)}
                  placeholder="https://chat.whatsapp.com/XXXXX or direct WhatsApp link"
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 12 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setQuickEditPkg(null)}
                  style={{ padding: "10px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuick}
                  style={{ padding: "10px 20px", background: "linear-gradient(135deg, #f06a3a, #e05320)", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: savingQuick ? "not-allowed" : "pointer" }}
                >
                  {savingQuick ? "Saving…" : "Save Updates"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function BookingsSection({ bookings }: { bookings: FirebaseBooking[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [hostModal, setHostModal] = useState<FirebaseBooking | null>(null);
  const [editModal, setEditModal] = useState<FirebaseBooking | null>(null);

  // Edit fields
  const [editPnr, setEditPnr] = useState("");
  const [editSeats, setEditSeats] = useState("");
  const [editClass, setEditClass] = useState("");
  const [editHotels, setEditHotels] = useState("");
  const [editHostName, setEditHostName] = useState("");
  const [editHostPhone, setEditHostPhone] = useState("");
  const [editVehicle, setEditVehicle] = useState("");
  const [editStatus, setEditStatus] = useState<BookingStatus>("confirmed");
  const [editDate, setEditDate] = useState("");

  const [hostName, setHostName] = useState("Rohan Sharma");
  const [hostPhone, setHostPhone] = useState("+91 98765 43210");
  const [hostWhatsapp, setHostWhatsapp] = useState("+91 98765 43210");
  const [updating, setUpdating] = useState(false);

  const openEdit = (b: FirebaseBooking) => {
    setEditModal(b);
    setEditPnr((b as any).pnrNumber || (b as any).pnrOrTicketNumber || "");
    setEditSeats((b as any).seatNumbers || "");
    setEditClass((b as any).travelClass || "Train - 3rd AC (3A)");
    setEditHotels((b as any).hotelDetails || "");
    setEditHostName(b.hostContact?.name || "");
    setEditHostPhone(b.hostContact?.phone || "");
    setEditVehicle(b.hostContact?.assignedVehicle || (b as any).vehicle || "");
    setEditStatus(b.status || "confirmed");
    setEditDate(b.travelDate || "");
  };

  const handleSaveFullDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal?.id) return;
    setUpdating(true);
    try {
      const { updateBookingFullDetails } = await import("@/lib/firebaseBookings");
      await updateBookingFullDetails(editModal.id, {
        status: editStatus,
        pnrNumber: editPnr,
        seatNumbers: editSeats,
        travelClass: editClass,
        hotelDetails: editHotels,
        hostName: editHostName,
        hostPhone: editHostPhone,
        vehicle: editVehicle,
        travelDate: editDate,
      });
      toast.success(`Booking ${editModal.bookingCode} details updated in Firestore!`);
      setEditModal(null);
    } catch {
      toast.error("Failed to update booking details.");
    } finally {
      setUpdating(false);
    }
  };

  const filtered = filter === "all"
    ? bookings
    : filter === "pending_approval"
      ? bookings.filter((b) => b.approvalStatus === "pending_manual_review" || b.status === "pending_approval")
      : bookings.filter((b) => b.status === filter);

  const handleManualApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostModal?.id) return;
    setUpdating(true);
    try {
      const { approveBookingManual } = await import("@/lib/firebaseBookings");
      await approveBookingManual(
        hostModal.id,
        { name: hostName, phone: hostPhone, whatsapp: hostWhatsapp },
        "admin_manual",
      );
      toast.success(`Booking ${hostModal.bookingCode} approved & host assigned!`);
      setHostModal(null);
    } catch {
      toast.error("Failed to approve booking.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
        <div className="ops-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="ops-filters">
            {[
              ["all", "All Bookings"],
              ["pending_approval", "⚠️ Needs Manual Review"],
              ["confirmed", "Approved & Verified"],
              ["on_trip", "Live On Trip"],
              ["completed", "Completed"],
            ].map(([val, label]) => (
              <button key={val} className={filter === val ? "active" : ""} onClick={() => setFilter(val)}>
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={async () => {
              if (!confirm("Are you sure you want to delete all test/demo bookings? Real bookings will remain safe.")) return;
              try {
                const { purgeAllTestBookings } = await import("@/lib/firebaseAdmin");
                const count = await purgeAllTestBookings();
                toast.success(`Purged ${count} test/demo bookings from database!`);
              } catch {
                toast.error("Failed to purge test bookings.");
              }
            }}
            style={{
              padding: "6px 14px",
              background: "#fee2e2",
              color: "#dc2626",
              border: "1px solid #fca5a5",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            🧹 Purge Test/Demo Bookings
          </button>
        </div>

        <section className="ops-panel ops-table">
          <div className="ops-table-head">
            <span>Booking ID</span>
            <span>Traveler & Route</span>
            <span>Grand Total</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {filtered.map((b) => {
            const isPending = b.approvalStatus === "pending_manual_review" || b.status === "pending_approval";
            const cleanPhone = (b.phone || "").replace(/\D/g, "");

            return (
              <div className="ops-table-row" key={b.id ?? b.bookingCode} style={{ alignItems: "center" }}>
                <div>
                  <b style={{ fontFamily: "monospace", color: "var(--color-brand, #f06a3a)" }}>{b.bookingCode}</b>
                  <small style={{ display: "block", fontSize: 11, opacity: 0.6 }}>{b.travelDate || "Departure Pending"}</small>
                </div>

                <span>
                  <strong>{b.travelerName}</strong>
                  <small>{b.packageName} · {b.travelerCount} Travelers</small>
                  {(b as any).pnrNumber && (
                    <small style={{ display: "block", color: "#f06a3a", fontWeight: 700 }}>E-Pass: {(b as any).pnrNumber}</small>
                  )}
                </span>

                <strong>₹{(b.grandTotal || 0).toLocaleString("en-IN")}</strong>

                <div>
                  <PulseBadge status={isPending ? "pending_approval" : b.status} />
                  {b.hostContact && (
                    <small style={{ display: "block", fontSize: 10, color: "#666", marginTop: 4 }}>Host: {b.hostContact.name}</small>
                  )}
                </div>

                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  {isPending && (
                    <button
                      onClick={() => setHostModal(b)}
                      style={{ padding: "6px 12px", background: "var(--color-brand, #f06a3a)", color: "white", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      Approve & Lock
                    </button>
                  )}

                  <button
                    onClick={() => openEdit(b)}
                    style={{ padding: "6px 10px", background: "#183a37", color: "white", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    Edit E-Pass & Seats
                  </button>

                  <a
                    href={`/invoice/${b.bookingCode}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ padding: "6px 10px", background: "#f4f0e8", color: "#183a37", borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: "none" }}
                  >
                    Invoice PDF
                  </a>

                  {cleanPhone && (
                    <a href={`https://wa.me/${cleanPhone}`} target="_blank" rel="noreferrer" style={{ padding: 6, borderRadius: 6, background: "#25D366", color: "white" }}>
                      <MessageCircle size={14} />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      if (!b.id) return;
                      if (!confirm(`Delete booking ${b.bookingCode} for ${b.travelerName}?`)) return;
                      try {
                        const { deleteBookingById } = await import("@/lib/firebaseAdmin");
                        await deleteBookingById(b.id);
                        toast.success(`Booking ${b.bookingCode} deleted from database.`);
                      } catch {
                        toast.error("Failed to delete booking.");
                      }
                    }}
                    style={{ padding: 6, borderRadius: 6, background: "#fee2e2", color: "#dc2626", border: "none", cursor: "pointer" }}
                    title="Delete booking"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </section>

      {/* Edit Full Booking Details Modal */}
      {editModal && (
        <div className="sheet-backdrop" onClick={() => setEditModal(null)}>
          <div className="ops-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, width: "95%", maxHeight: "90vh", overflowY: "auto", margin: "auto", padding: 24, borderRadius: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, borderBottom: "1px solid #eee", paddingBottom: 8 }}>
              <div>
                <b style={{ color: "#f06a3a", fontSize: 11 }}>MANAGE BOOKING DETAILS</b>
                <h3 style={{ margin: "2px 0 0" }}>{editModal.bookingCode} - {editModal.travelerName}</h3>
              </div>
              <button onClick={() => setEditModal(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveFullDetails} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>
                E-Pass / Ticket Number
                <input
                  value={editPnr}
                  onChange={(e) => setEditPnr(e.target.value)}
                  placeholder="e.g. VYG-EPASS-84920"
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Seat / Berth Allocation
                <input
                  value={editSeats}
                  onChange={(e) => setEditSeats(e.target.value)}
                  placeholder="e.g. Coach B2: Seat 12, 13 (Lower)"
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Travel Class
                <input
                  value={editClass}
                  onChange={(e) => setEditClass(e.target.value)}
                  placeholder="e.g. Train - 3rd AC (3A)"
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Travel Date
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 700, gridColumn: "1 / -1" }}>
                Hotel & Room Numbers
                <input
                  value={editHotels}
                  onChange={(e) => setEditHotels(e.target.value)}
                  placeholder="e.g. Hotel Grand Shiv Ganga - Room 201, 202"
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Chauffeur / Driver Name
                <input
                  value={editHostName}
                  onChange={(e) => setEditHostName(e.target.value)}
                  placeholder="Driver Full Name"
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Driver Phone / WhatsApp
                <input
                  value={editHostPhone}
                  onChange={(e) => setEditHostPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Vehicle Number
                <input
                  value={editVehicle}
                  onChange={(e) => setEditVehicle(e.target.value)}
                  placeholder="e.g. Innova (UK 07 TB 4412)"
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 700 }}>
                Trip Status
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as BookingStatus)}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }}
                >
                  <option value="confirmed">Approved & Confirmed</option>
                  <option value="on_trip">Live On Trip (In-Progress)</option>
                  <option value="completed">Trip Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <button
                type="submit"
                disabled={updating}
                style={{
                  gridColumn: "1 / -1",
                  padding: "12px",
                  background: "#f06a3a",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                  marginTop: 6,
                }}
              >
                {updating ? "Saving to Firestore…" : "Save & Update Passenger Ticket"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Host Modal */}
      {hostModal && (
        <div className="sheet-backdrop" onClick={() => setHostModal(null)}>
          <div className="ops-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440, width: "90%", margin: "auto", padding: 24 }}>
            <h3 style={{ margin: "0 0 12px" }}>Assign Host for {hostModal.bookingCode}</h3>
            <form onSubmit={handleManualApprove} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Host Name<input value={hostName} onChange={(e) => setHostName(e.target.value)} required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }} /></label>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Host Phone<input value={hostPhone} onChange={(e) => setHostPhone(e.target.value)} required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }} /></label>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Host WhatsApp<input value={hostWhatsapp} onChange={(e) => setHostWhatsapp(e.target.value)} required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }} /></label>
              <button type="submit" disabled={updating} style={{ padding: "10px", background: "var(--color-brand, #f06a3a)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, marginTop: 10 }}>
                Confirm & Lock Trip
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function HeroBannersSection() {
  const [banners, setBanners] = useState<Array<{ id?: string; badge: string; title: string; subtitle: string; imageUrl: string; active: boolean }>>([]);
  const [creating, setCreating] = useState(false);
  const [badge, setBadge] = useState("SACRED YATRA / 2026");
  const [title, setTitle] = useState("Sacred Kedarnath & Badrinath Yatra");
  const [subtitle, setSubtitle] = useState("Direct helicopter transfers, verified VIP darshan & satvik hospitality.");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&q=85");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    import("@/lib/firebaseBanners").then(({ subscribeToAllBannersAdmin }) => {
      unsub = subscribeToAllBannersAdmin(setBanners as typeof setBanners);
    });
    return () => unsub();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      toast.error("Please provide both headline and banner image.");
      return;
    }
    setSaving(true);
    try {
      const { createHeroBanner } = await import("@/lib/firebaseBanners");
      await createHeroBanner({
        badge: badge.trim() || "SACRED YATRA / 2026",
        title: title.trim(),
        subtitle: subtitle.trim(),
        imageUrl: imageUrl.trim(),
        ctaText: "Explore Yatra Package",
        ctaLink: "/explore",
        active: true,
        order: banners.length + 1,
      });
      toast.success("New Hero Banner published to homepage slider!");
      setCreating(false);
      setTitle("");
      setSubtitle("");
    } catch {
      toast.error("Failed to publish hero slide.");
    } finally {
      setSaving(false);
    }
  };

  const badgePresets = [
    "SACRED YATRA / 2026",
    "KEDARNATH DHAM / 2026",
    "12 JYOTIRLINGA DARSHAN",
    "SPECIAL PILGRIM DISCOUNT",
    "DEVOTEE EXCLUSIVE / LIMITED SEATS",
  ];

  const handleClearDemoBanners = async () => {
    if (!window.confirm("Are you sure you want to remove all demo hero slides? You can upload your own custom banners anytime.")) return;
    try {
      const { deleteHeroBanner } = await import("@/lib/firebaseBanners");
      for (const b of banners) {
        if (b.id) await deleteHeroBanner(b.id);
      }
      setBanners([]);
      toast.success("All demo slides removed!");
    } catch {
      toast.error("Error clearing slides.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <span className="admin-overline">HOMEPAGE CAROUSEL & SLIDERS</span>
          <h2 style={{ margin: "2px 0 0", fontSize: 22, color: "#183a37", fontFamily: "'DM Serif Display', serif" }}>
            Hero Banner Sliders ({banners.length})
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
            Manage the dynamic top banner images and promotional headlines shown on the website home screen.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {banners.length > 0 && (
            <button
              onClick={handleClearDemoBanners}
              style={{
                padding: "10px 14px",
                background: "#fee2e2",
                color: "#dc2626",
                border: "1px solid #fca5a5",
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Trash2 size={14} /> Clear Demo Slides
            </button>
          )}
          <button
            className="ops-cta"
            onClick={() => setCreating(!creating)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              background: creating ? "#4b5563" : "#f06a3a",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <Plus size={15} /> {creating ? "Close Slide Builder" : "Create New Slide"}
          </button>
        </div>
      </div>

      {creating && (
        <section style={{ background: "#ffffff", border: "1.5px solid #fdba74", borderRadius: 20, padding: "24px 28px", boxShadow: "0 10px 30px rgba(240,106,58,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={{ padding: "4px 8px", background: "#f06a3a", color: "white", borderRadius: 6, fontSize: 10, fontWeight: 900 }}>BUILDER</span>
            <h3 style={{ margin: 0, fontSize: 18, color: "#183a37" }}>Interactive Slide Designer</h3>
          </div>

          {/* Live Preview Card */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 900, letterSpacing: "0.1em", color: "#6b7280", textTransform: "uppercase", marginBottom: 8 }}>
              Live Slide Preview (Desktop & Mobile)
            </label>
            <div
              style={{
                position: "relative",
                height: 180,
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
              }}
            >
              <img
                src={imageUrl || "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&q=85"}
                alt="Preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&q=85"; }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(90deg, rgba(13,39,36,0.92) 0%, rgba(13,39,36,0.5) 60%, transparent 100%)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  padding: "0 24px",
                  color: "#fffaf2",
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 900, color: "#f06a3a", letterSpacing: "0.1em", marginBottom: 4 }}>
                  {badge || "SACRED YATRA / 2026"}
                </span>
                <h3 style={{ margin: 0, fontSize: 20, fontFamily: "'DM Serif Display', serif", maxWidth: 450, lineHeight: 1.1 }}>
                  {title || "Enter slide title above..."}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,250,242,0.8)", maxWidth: 420 }}>
                  {subtitle || "Enter slide subtitle above..."}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#183a37", marginBottom: 6 }}>
                Badge Preset
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {badgePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBadge(preset)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 16,
                      fontSize: 10,
                      fontWeight: 800,
                      border: badge === preset ? "1.5px solid #f06a3a" : "1px solid #e5e7eb",
                      background: badge === preset ? "#fff7ed" : "#f9fafb",
                      color: badge === preset ? "#ea580c" : "#4b5563",
                      cursor: "pointer",
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Or custom badge text"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#183a37", marginBottom: 6 }}>
                Slide Headline <span style={{ color: "#e11d48" }}>*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sacred Kedarnath & Badrinath Yatra 2026"
                required
                style={{ width: "100%", padding: "11px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#183a37", marginBottom: 6 }}>
                Subtitle / Description
              </label>
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Daily guaranteed departures with VIP helicopter & temple darshan pass."
                style={{ width: "100%", padding: "11px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#183a37", marginBottom: 6 }}>
                Slide Image URL / ImgBB Dropzone <span style={{ color: "#e11d48" }}>*</span>
              </label>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste direct high-res image URL (e.g. Unsplash or ImgBB)"
                style={{ width: "100%", padding: "11px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, marginBottom: 8 }}
              />
              <ImgBBDropzone value={imageUrl} onChange={setImageUrl} label="Or Upload Image from Phone/PC (ImgBB Free CDN)" />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                background: "linear-gradient(135deg, #f06a3a 0%, #e05320 100%)",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13,
                cursor: saving ? "not-allowed" : "pointer",
                width: "fit-content",
                boxShadow: "0 4px 14px rgba(240,106,58,0.3)",
              }}
            >
              {saving ? "Publishing Slide…" : "Publish Slide to Homepage"}
            </button>
          </form>
        </section>
      )}

      {/* Existing Banners Grid */}
      <section style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 20, padding: "20px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <b style={{ fontSize: 14, color: "#183a37" }}>Configured Hero Slides ({banners.length})</b>
          <span style={{ fontSize: 11, color: "#6b7280" }}>Click status pill to toggle Active/Hidden instantly</span>
        </div>

        {banners.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#6b7280", fontSize: 13 }}>
            No custom hero banners found. Click "Create New Slide" to add your first homepage banner.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {banners.map((b) => (
              <div
                key={b.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 18px",
                  background: b.active ? "#ffffff" : "#f9fafb",
                  border: b.active ? "1.5px solid #dcfce7" : "1px solid #e5e7eb",
                  borderRadius: 14,
                  flexWrap: "wrap",
                  gap: 14,
                  opacity: b.active ? 1 : 0.65,
                }}
              >
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <img
                    src={b.imageUrl}
                    alt={b.title}
                    style={{ width: 90, height: 58, objectFit: "cover", borderRadius: 10, border: "1px solid #e5e7eb" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80"; }}
                  />
                  <div>
                    <span style={{ display: "inline-block", fontSize: 9, fontWeight: 900, color: "#f06a3a", letterSpacing: "0.08em" }}>
                      {b.badge}
                    </span>
                    <b style={{ display: "block", fontSize: 14, color: "#183a37", marginTop: 2 }}>{b.title}</b>
                    {b.subtitle && <small style={{ display: "block", color: "#6b7280", fontSize: 11, marginTop: 2 }}>{b.subtitle}</small>}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!b.id) return;
                      const { updateHeroBanner } = await import("@/lib/firebaseBanners");
                      await updateHeroBanner(b.id, { active: !b.active });
                      toast.success(`Slide is now ${!b.active ? "LIVE on Homepage" : "HIDDEN from site"}`);
                    }}
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: "none",
                      cursor: "pointer",
                      background: b.active ? "#dcfce7" : "#f1f5f9",
                      color: b.active ? "#166534" : "#475569",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: b.active ? "#22c55e" : "#94a3b8" }} />
                    <span>{b.active ? "ACTIVE (Shown on Site)" : "HIDDEN (Draft)"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!b.id) return;
                      if (!confirm(`Delete hero slide "${b.title}"?`)) return;
                      setBanners((prev) => prev.filter((item) => item.id !== b.id));
                      const { deleteHeroBanner } = await import("@/lib/firebaseBanners");
                      await deleteHeroBanner(b.id);
                      toast.success("Hero banner deleted from site.");
                    }}
                    style={{
                      padding: "8px",
                      background: "#fee2e2",
                      color: "#dc2626",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="Delete slide"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AdminProfileSection({ profile, signOut }: {
  profile: SessionProfile | null;
  signOut: () => void;
}) {
  const { completeAuth } = useTravelSession();
  const [, navigate] = useLocation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name || "Administrator");
  const [phone, setPhone] = useState(profile?.phone || "+91 98765 43210");
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a valid administrator name.");
      return;
    }
    setSaving(true);
    try {
      if (firebaseAuth?.currentUser) {
        await updateProfile(firebaseAuth.currentUser, {
          displayName: name.trim(),
          photoURL: photoURL.trim() || undefined,
        });
      }
      if (firebaseDb && profile?.uid) {
        const userDocRef = doc(firebaseDb, "travelerProfiles", profile.uid);
        await updateDoc(userDocRef, {
          displayName: name.trim(),
          phone: phone.trim(),
          photoURL: photoURL.trim(),
          updatedAt: new Date().toISOString(),
        });
      }
      if (profile) {
        const nextProfile: SessionProfile = {
          ...profile,
          name: name.trim(),
          phone: phone.trim(),
          photoURL: photoURL.trim(),
        };
        completeAuth(nextProfile);
      }
      setEditing(false);
      toast.success("Administrator profile saved to Firebase!");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to sign out of the Admin Operations Desk?")) {
      signOut();
      toast.success("Signed out successfully.");
      navigate("/");
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Admin Identity Banner ── */}
      <section
        style={{
          background: "linear-gradient(135deg, #183a37 0%, #1e4542 100%)",
          color: "#fffaf2",
          borderRadius: 24,
          padding: "32px 28px",
          boxShadow: "0 10px 30px rgba(24,58,55,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.name}
              style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2.5px solid #f06a3a", boxShadow: "0 6px 16px rgba(0,0,0,0.2)" }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f06a3a 0%, #d05024 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 900,
                boxShadow: "0 6px 16px rgba(240,106,58,0.3)",
              }}
            >
              {profile?.name?.slice(0, 2).toUpperCase() || "AD"}
            </div>
          )}

          <div>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.14em", color: "#f06a3a", textTransform: "uppercase" }}>
              🚩 HAR HAR MAHADEV · OPERATIONS DESK
            </span>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, margin: "4px 0 2px", color: "#fffaf2" }}>
              {profile?.name || "Administrator"}
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,250,242,0.75)" }}>
              {profile?.email || "admin@vyogra.com"} · <span style={{ color: "#86efac", fontWeight: 700 }}>SUPER ADMIN ROLE</span>
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setEditing(!editing)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              background: "rgba(255,255,255,0.15)",
              color: "#fffaf2",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <Edit3 size={15} /> {editing ? "Cancel" : "Edit Profile"}
          </button>

          <button
            onClick={handleLogout}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(220,38,38,0.3)",
            }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </section>

      {/* ── Edit Profile Form ── */}
      {editing && (
        <section style={{ background: "#ffffff", border: "1.5px solid #fdba74", borderRadius: 20, padding: "24px 28px", boxShadow: "0 10px 30px rgba(240,106,58,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <span style={{ padding: "4px 8px", background: "#f06a3a", color: "white", borderRadius: 6, fontSize: 10, fontWeight: 900 }}>EDIT</span>
            <h3 style={{ margin: 0, fontSize: 18, color: "#183a37" }}>Update Administrator Identity</h3>
          </div>

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#183a37", marginBottom: 6 }}>
                Full Display Name <span style={{ color: "#e11d48" }}>*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Rahul Sharma"
                style={{ width: "100%", padding: "11px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#183a37", marginBottom: 6 }}>
                Contact Phone / WhatsApp
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={{ width: "100%", padding: "11px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#183a37", marginBottom: 6 }}>
                Profile Avatar Photo URL (ImgBB or Web Link)
              </label>
              <input
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://..."
                style={{ width: "100%", padding: "11px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, marginBottom: 8 }}
              />
              <ImgBBDropzone value={photoURL} onChange={setPhotoURL} label="Or Upload Profile Photo (ImgBB CDN)" />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                background: "linear-gradient(135deg, #f06a3a 0%, #e05320 100%)",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13,
                cursor: saving ? "not-allowed" : "pointer",
                width: "fit-content",
                boxShadow: "0 4px 14px rgba(240,106,58,0.3)",
              }}
            >
              <Save size={15} /> {saving ? "Saving to Firebase…" : "Save Profile Details"}
            </button>
          </form>
        </section>
      )}

      {/* ── Security & Permissions Card ── */}
      <section style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 20, padding: "24px 28px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#183a37" }}>
          Administrator Privileges & Security Scope
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <div style={{ padding: "12px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12 }}>
            <b style={{ fontSize: 12, color: "#166534", display: "block" }}>✓ Manual Booking Verification</b>
            <small style={{ color: "#15803d", fontSize: 11 }}>Review, approve, and assign tour hosts</small>
          </div>
          <div style={{ padding: "12px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12 }}>
            <b style={{ fontSize: 12, color: "#166534", display: "block" }}>✓ Tour Package Catalog</b>
            <small style={{ color: "#15803d", fontSize: 11 }}>Create, edit, toggle draft/live status</small>
          </div>
          <div style={{ padding: "12px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12 }}>
            <b style={{ fontSize: 12, color: "#166534", display: "block" }}>✓ Emergency Broadcasts</b>
            <small style={{ color: "#15803d", fontSize: 11 }}>Dispatch real-time site banners & alerts</small>
          </div>
          <div style={{ padding: "12px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12 }}>
            <b style={{ fontSize: 12, color: "#166534", display: "block" }}>✓ Database Maintenance</b>
            <small style={{ color: "#15803d", fontSize: 11 }}>Clean demo test data & configure WhatsApp</small>
          </div>
        </div>
      </section>

      {/* ── Proudly Made in India Badge ── */}
      <section
        style={{
          background: "linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)",
          border: "1.5px solid #e5e7eb",
          borderRadius: 20,
          padding: "20px 24px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#fff7ed", border: "1px solid #fed7aa", padding: "6px 18px", borderRadius: 30, marginBottom: 10 }}>
          <span style={{ fontSize: 16 }}>🇮🇳</span>
          <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.08em", color: "#ea580c" }}>
            100% PROUDLY CRAFTED IN INDIA · भारत में निर्मित
          </span>
        </div>
        <h4 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, margin: "4px 0 6px", color: "#183a37" }}>
          Har Har Mahadev Tours & Travels Operations Suite
        </h4>
        <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
          Dedicated to sacred pilgrimage, cultural heritage tours & devotee satisfaction across India.
        </p>
      </section>
    </div>
  );
}

function AdminPhotoGallerySection() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState<"pilgrimage" | "heritage" | "mountain" | "general">("pilgrimage");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    import("@/lib/firebaseGallery").then(({ subscribeToGallery }) => {
      unsub = subscribeToGallery(setPhotos);
    });
    return () => unsub();
  }, []);

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      toast.error("Please upload or provide an image URL.");
      return;
    }
    setSaving(true);
    try {
      const { addGalleryPhoto } = await import("@/lib/firebaseGallery");
      await addGalleryPhoto({
        title: title || "Sacred Yatra Darshan",
        location: location || "India",
        imageUrl,
        category,
        uploadedBy: "Admin",
      });
      toast.success("Photo added to Devotee Gallery!");
      setTitle("");
      setLocation("");
      setImageUrl("");
      setCreating(false);
    } catch {
      toast.error("Failed to add photo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="ops-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <b style={{ fontSize: 14 }}>Devotee Yatra Photo Gallery ({photos.length})</b>
          <p style={{ margin: 0, fontSize: 11, color: "#666" }}>
            Upload sacred temple darshan and yatra moments shown on the website homepage.
          </p>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          style={{
            padding: "8px 16px",
            background: "#f06a3a",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: 800,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {creating ? "Cancel" : "+ Add Yatra Photo"}
        </button>
      </div>

      {creating && (
        <section className="ops-panel" style={{ padding: 20, marginBottom: 16 }}>
          <form onSubmit={handleAddPhoto} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Photo Title / Temple Name
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Kedarnath Dham Evening Aarti"
                required
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }}
              />
            </label>

            <label style={{ fontSize: 12, fontWeight: 700 }}>
              Location
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kedarnath, Uttarakhand"
                required
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc", marginTop: 4 }}
              />
            </label>

            <div style={{ gridColumn: "1 / -1" }}>
              <ImgBBDropzone
                value={imageUrl}
                onChange={(url: string) => {
                  setImageUrl(url);
                  toast.success("Photo uploaded to CDN!");
                }}
                label="Upload High-Res Yatra Photo (Free ImgBB CDN)"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                gridColumn: "1 / -1",
                padding: "10px",
                background: "#183a37",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {saving ? "Saving…" : "Publish to Devotee Gallery"}
            </button>
          </form>
        </section>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {photos.map((p) => (
          <div
            key={p.id}
            style={{
              background: "#fff",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid rgba(0,0,0,0.08)",
              position: "relative",
            }}
          >
            <img src={p.imageUrl} alt={p.title} style={{ width: "100%", height: 140, objectFit: "cover" }} />
            <div style={{ padding: 12 }}>
              <b style={{ fontSize: 13, display: "block", color: "#183a37" }}>{p.title}</b>
              <small style={{ color: "#777", display: "block", marginTop: 2 }}>{p.location}</small>
              <button
                type="button"
                onClick={async () => {
                  if (!p.id) return;
                  if (!confirm("Delete this gallery photo?")) return;
                  const { deleteGalleryPhoto } = await import("@/lib/firebaseGallery");
                  await deleteGalleryPhoto(p.id);
                  toast.success("Photo deleted.");
                }}
                style={{
                  marginTop: 8,
                  padding: "4px 8px",
                  background: "#fee2e2",
                  color: "#dc2626",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SupportDeskSection({ adminProfile }: { adminProfile: { uid: string; name: string } | null }) {
  const [tickets, setTickets] = useState<Array<{ id?: string; ticketCode: string; userName: string; subject: string; status: string; body: string }>>([]);
  const [activeTicket, setActiveTicket] = useState<{ id?: string; ticketCode: string; userName: string; subject: string } | null>(null);
  const [messages, setMessages] = useState<Array<{ id?: string; senderName: string; senderRole: string; text: string }>>([]);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    let unsub = () => {};
    import("@/lib/firebaseSupport").then(({ subscribeToAllTickets }) => {
      unsub = subscribeToAllTickets(setTickets as typeof setTickets);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!activeTicket?.id) return;
    let unsub = () => {};
    import("@/lib/firebaseSupport").then(({ subscribeToTicketMessages }) => {
      unsub = subscribeToTicketMessages(activeTicket.id!, setMessages);
    });
    return () => unsub();
  }, [activeTicket?.id]);

  const sendReply = async () => {
    if (!activeTicket?.id || !replyText.trim() || !adminProfile) return;
    const { sendTicketMessage } = await import("@/lib/firebaseSupport");
    await sendTicketMessage(activeTicket.id, {
      senderId: adminProfile.uid,
      senderName: adminProfile.name || "VOYAGR Concierge",
      senderRole: "admin",
      text: replyText.trim(),
    });
    setReplyText("");
    toast.success("Reply sent!");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: activeTicket ? "1.2fr 1fr" : "1fr", gap: 16 }}>
      <section className="ops-panel">
        {tickets.map((t) => (
          <div
            key={t.id}
            onClick={() => setActiveTicket(t)}
            style={{ padding: "14px 18px", borderBottom: "1px solid rgba(0,0,0,0.06)", cursor: "pointer", background: activeTicket?.id === t.id ? "rgba(240,106,58,0.06)" : "transparent" }}
          >
            <b style={{ fontFamily: "monospace", color: "var(--color-brand, #f06a3a)" }}>{t.ticketCode}</b>
            <h4 style={{ margin: "2px 0", fontSize: 14 }}>{t.subject} ({t.userName})</h4>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>{t.body}</p>
          </div>
        ))}
      </section>

      {activeTicket && (
        <section className="ops-panel" style={{ padding: 20, display: "flex", flexDirection: "column", height: 460 }}>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", paddingBottom: 8 }}>
            <h4>{activeTicket.ticketCode} - {activeTicket.userName}</h4>
            <button onClick={() => setActiveTicket(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={15} /></button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "12px 0" }}>
            {messages.map((m, idx) => (
              <div key={m.id ?? idx} style={{ alignSelf: m.senderRole === "admin" ? "flex-end" : "flex-start", background: m.senderRole === "admin" ? "var(--color-brand, #f06a3a)" : "#eee", color: m.senderRole === "admin" ? "white" : "inherit", padding: "6px 12px", borderRadius: 8, fontSize: 13 }}>
                <small style={{ display: "block", fontSize: 10, opacity: 0.7 }}>{m.senderName}</small>
                {m.text}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, paddingTop: 8 }}>
            <input value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReply()} placeholder="Reply…" style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #ccc" }} />
            <button onClick={sendReply} style={{ padding: "8px 16px", background: "var(--color-brand, #f06a3a)", color: "white", border: "none", borderRadius: 6, fontWeight: 700 }}>Send</button>
          </div>
        </section>
      )}
    </div>
  );
}

import {
  subscribeToSystemSettings,
  updateSystemSettings,
  defaultSettings,
  type SystemSettings,
} from "@/lib/firebaseSettings";

function SystemSettingsSection({ adminUid }: { adminUid: string }) {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToSystemSettings(setSettings);
    return () => unsub();
  }, []);

  const handleChange = (key: keyof SystemSettings, val: any) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSystemSettings(settings, adminUid);
      toast.success("System & Contact Settings saved to Firestore!");
    } catch {
      toast.error("Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Brand & Platform Identity */}
      <section className="ops-panel" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ padding: "4px 8px", background: "#f06a3a", color: "white", borderRadius: 6, fontSize: 11, fontWeight: 900 }}>01</span>
          <h3 style={{ margin: 0, fontSize: 17, color: "#183a37" }}>Website Branding & Identity</h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700 }}>
            Website / Platform Name
            <input
              value={settings.siteName || settings.platformName}
              onChange={(e) => {
                handleChange("siteName", e.target.value);
                handleChange("platformName", e.target.value);
              }}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700 }}>
            Tagline / Slogan
            <input
              value={settings.tagline}
              onChange={(e) => handleChange("tagline", e.target.value)}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
            />
          </label>
        </div>
      </section>

      {/* Owner & WhatsApp Direct Contacts */}
      <section className="ops-panel" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ padding: "4px 8px", background: "#f06a3a", color: "white", borderRadius: 6, fontSize: 11, fontWeight: 900 }}>02</span>
          <h3 style={{ margin: 0, fontSize: 17, color: "#183a37" }}>Owner Contacts & WhatsApp Group</h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700 }}>
            Owner / Concierge Name
            <input
              value={settings.ownerName}
              onChange={(e) => handleChange("ownerName", e.target.value)}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700 }}>
            Owner / Helpline Phone Number
            <input
              value={settings.ownerPhone || settings.supportPhone}
              onChange={(e) => {
                handleChange("ownerPhone", e.target.value);
                handleChange("supportPhone", e.target.value);
              }}
              placeholder="+91 98765 43210"
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700 }}>
            Owner WhatsApp Direct Number
            <input
              value={settings.ownerWhatsapp || settings.whatsappNumber}
              onChange={(e) => {
                handleChange("ownerWhatsapp", e.target.value);
                handleChange("whatsappNumber", e.target.value);
              }}
              placeholder="919876543210"
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700 }}>
            Official Travelers WhatsApp Group Link
            <input
              value={settings.whatsappGroupLink}
              onChange={(e) => handleChange("whatsappGroupLink", e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700 }}>
            Support Email
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => handleChange("supportEmail", e.target.value)}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700 }}>
            Office Address
            <input
              value={settings.officeAddress}
              onChange={(e) => handleChange("officeAddress", e.target.value)}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
            />
          </label>
        </div>
      </section>

      {/* 03. Maintenance Mode & Emergency Controls */}
      <section className="ops-panel" style={{ padding: 24, border: settings.maintenanceMode ? "2px solid #ef4444" : "1px solid rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ padding: "4px 8px", background: settings.maintenanceMode ? "#ef4444" : "#f06a3a", color: "white", borderRadius: 6, fontSize: 11, fontWeight: 900 }}>03</span>
              <h3 style={{ margin: 0, fontSize: 17, color: settings.maintenanceMode ? "#ef4444" : "#183a37" }}>
                Emergency / Site Maintenance Mode
              </h3>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
              When enabled, visitors will see an auspicious maintenance screen with owner emergency WhatsApp and Phone call options.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleChange("maintenanceMode", !settings.maintenanceMode)}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              border: "none",
              background: settings.maintenanceMode ? "#fee2e2" : "#dcfce7",
              color: settings.maintenanceMode ? "#dc2626" : "#16a34a",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            {settings.maintenanceMode ? "🔴 MAINTENANCE ACTIVE (Click to turn OFF)" : "🟢 SITE LIVE (Click to Activate Maintenance)"}
          </button>
        </div>
      </section>

      {/* 04. Online Booking System Switch */}
      <section className="ops-panel" style={{ padding: 24, border: settings.bookingEnabled === false ? "2px solid #f59e0b" : "1px solid rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ padding: "4px 8px", background: settings.bookingEnabled === false ? "#f59e0b" : "#16a34a", color: "white", borderRadius: 6, fontSize: 11, fontWeight: 900 }}>04</span>
              <h3 style={{ margin: 0, fontSize: 17, color: settings.bookingEnabled === false ? "#b45309" : "#183a37" }}>
                Online Yatra & Tour Bookings
              </h3>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#666" }}>
              Turn OFF to pause online bookings (travelers will be directed to inquire directly on WhatsApp instead).
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleChange("bookingEnabled", !settings.bookingEnabled)}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              border: "none",
              background: settings.bookingEnabled === false ? "#fef3c7" : "#dcfce7",
              color: settings.bookingEnabled === false ? "#92400e" : "#16a34a",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}
          >
            {settings.bookingEnabled === false ? "⏸️ BOOKINGS PAUSED (WhatsApp Inquiries Only)" : "🟢 BOOKINGS ACTIVE (Online Checkout Open)"}
          </button>
        </div>
      </section>

      {/* 05. Production Launch & Data Clean-up */}
      <section className="ops-panel" style={{ padding: 24, border: "1px solid #fee2e2", background: "#fffbfb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ padding: "4px 8px", background: "#dc2626", color: "white", borderRadius: 6, fontSize: 11, fontWeight: 900 }}>05</span>
          <h3 style={{ margin: 0, fontSize: 17, color: "#dc2626" }}>
            Production Launch & Demo Data Clean-up
          </h3>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#666" }}>
          Use these one-click tools to clean fake/demo test bookings and prepare your database for live public launch.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Are you sure you want to purge all test & demo bookings? Real customer bookings will remain.")) return;
              try {
                const { purgeAllTestBookings } = await import("@/lib/firebaseAdmin");
                const count = await purgeAllTestBookings();
                toast.success(`Successfully purged ${count} test/demo bookings!`);
              } catch {
                toast.error("Failed to purge test bookings.");
              }
            }}
            style={{
              padding: "10px 18px",
              background: "#fee2e2",
              color: "#dc2626",
              border: "1px solid #fca5a5",
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            🧹 Purge Test & Demo Bookings Only
          </button>

          <button
            type="button"
            onClick={async () => {
              const confirmText = prompt('WARNING: This will delete ALL bookings from the database. Type "RESET" to confirm:');
              if (confirmText !== "RESET") {
                toast("Action cancelled.");
                return;
              }
              try {
                const { purgeAllBookings } = await import("@/lib/firebaseAdmin");
                const count = await purgeAllBookings();
                toast.success(`Database cleared. Deleted ${count} total bookings.`);
              } catch {
                toast.error("Failed to clear database.");
              }
            }}
            style={{
              padding: "10px 18px",
              background: "#991b1b",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            🗑️ Clear All Bookings (Fresh Launch)
          </button>
        </div>
      </section>

      {/* Save Button */}
      <div>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "12px 28px",
            background: "linear-gradient(135deg, #f06a3a 0%, #e05320 100%)",
            color: "white",
            border: "none",
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 14,
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: "0 6px 18px rgba(240,106,58,0.3)",
          }}
        >
          {saving ? "Saving to Firestore…" : "Save System & Contact Config"}
        </button>
      </div>
    </form>
  );
}


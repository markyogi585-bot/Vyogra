// Monsoon Modern: operational console with real Firestore data
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  BarChart3, Bell, BookOpen, CalendarDays, ChevronRight,
  CircleDollarSign, Download, Edit3, FileImage, FileText,
  FolderOpen, Image as ImageIcon, LoaderCircle, Megaphone, MessageCircle, Package, Phone, Plus, Search,
  Send, Settings2, ShieldCheck, Tag, Ticket, Trash2, Upload,
  Users, Wallet, X, CheckCircle, Clock, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminPackages } from "@/hooks/usePackages";
import {
  archivePackage,
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
  subscribeToTravelers,
  subscribeToAdminStats,
  formatRevenue,
  type TravelerProfile,
  type AdminStats,
} from "@/lib/firebaseAdmin";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import { catalog } from "@/lib/voyagrData";

const nav = [
  [BarChart3, "Overview"], [Package, "Packages"], [CalendarDays, "Bookings"],
  [ImageIcon, "Hero Banners"],
  [Users, "Travelers"], [MessageCircle, "Support desk"], [Wallet, "Budget planner"], [Megaphone, "Broadcasts"],
  [Bell, "Engagement"], [FolderOpen, "Media library"], [BarChart3, "Analytics"],
  [FileText, "Audit log"], [Settings2, "System settings"],
] as const;

export default function AdminTools() {
  const { profile } = useTravelSession();
  const [, navigate] = useLocation();
  const [active, setActive] = useState("Overview");
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<string | null>(null);

  // Real Firebase data
  const [bookings, setBookings] = useState<FirebaseBooking[]>([]);
  const [travelers, setTravelers] = useState<TravelerProfile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const { packages, isLoading: packagesLoading, refetch } = useAdminPackages();

  useEffect(() => {
    const u1 = subscribeToAllBookings(setBookings);
    const u2 = subscribeToTravelers(setTravelers);
    const u3 = subscribeToAdminStats(setStats);
    return () => { u1(); u2(); u3(); };
  }, []);

  const filteredTravelers = useMemo(
    () => travelers.filter((t: TravelerProfile) =>
      `${t.displayName} ${t.phone} ${t.email}`.toLowerCase().includes(search.toLowerCase()),
    ),
    [travelers, search],
  );

  const notify = (msg: string) => toast(msg);

  return (
    <div className="ops-app">
      <aside className="ops-sidebar">
        <a href="/" className="ops-brand"><span>↗</span><b>VOYAGR</b><small>OPERATIONS</small></a>
        <div className="ops-label">Workspace</div>
        <nav>
          {nav.map(([Icon, label]) => (
            <button
              key={label}
              className={active === label ? "active" : ""}
              onClick={() => label === "Engagement" ? navigate("/admin/engagement") : setActive(label)}
            >
              <Icon size={16} />
              <span>{label}</span>
              {label === "Bookings" && stats?.pendingBookings ? <b>{stats.pendingBookings}</b> : null}
            </button>
          ))}
        </nav>
        <div className="ops-user">
          <span>{profile?.name?.slice(0, 2).toUpperCase() ?? "AD"}</span>
          <div>
            <strong>{profile?.name ?? "Admin"}</strong>
            <small>{profile?.role?.replaceAll("_", " ") ?? "Admin"}</small>
          </div>
        </div>
      </aside>

      <main className="ops-main">
        <header className="ops-header">
          <div>
            <span className="admin-overline">VOYAGR / {active.toUpperCase()}</span>
            <h1>{active === "Overview"
              ? <><span>Make the route</span><br /><i>run beautifully.</i></>
              : active
            }</h1>
          </div>
          <div className="ops-actions">
            <button onClick={() => notify(stats?.openRequests ? `${stats.openRequests} requests need attention.` : "All clear.")}><Bell size={18} /></button>
            <button onClick={() => navigate("/admin/packages/new")} className="ops-cta">
              Create new <ChevronRight size={15} />
            </button>
          </div>
        </header>

        <section className="ops-content">
          {active === "Overview" && <Overview stats={stats} bookings={bookings} packages={packages} onOpen={setActive} />}
          {active === "Packages" && <Packages packages={packages} isLoading={packagesLoading} onOpen={setDrawer} refetch={refetch} adminUid={profile?.uid} />}
          {active === "Bookings" && <Bookings bookings={bookings} onOpen={setDrawer} />}
          {active === "Hero Banners" && <BannersManager />}
          {active === "Travelers" && <Travelers search={search} setSearch={setSearch} travelers={filteredTravelers} onOpen={setDrawer} />}
          {active === "Budget planner" && <Budget onOpen={setDrawer} />}
          {active === "Broadcasts" && <Broadcast onOpen={setDrawer} />}
          {active === "Media library" && <Media onOpen={setDrawer} packages={packages} />}
          {active === "Analytics" && <Analytics stats={stats} bookings={bookings} packages={packages} />}
          {active === "Audit log" && <AuditLog />}
          {active === "Support desk" && <SupportDesk adminProfile={profile ? { uid: profile.uid || "admin", name: profile.name || "Admin" } : null} />}
          {active === "System settings" && <Settings onOpen={setDrawer} />}
        </section>
      </main>

      {drawer && (
        <OpsDrawer title={drawer} onClose={() => setDrawer(null)} onSave={() => { setDrawer(null); notify(`${drawer} saved.`); }} />
      )}
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────
function Overview({ stats, bookings, packages, onOpen }: {
  stats: AdminStats | null; bookings: FirebaseBooking[];
  packages: FirebasePackage[]; onOpen: (v: string) => void;
}) {
  return (
    <>
      <div className="ops-stat-grid">
        {[
          [CircleDollarSign, "Package revenue", formatRevenue(stats?.totalRevenue ?? 0), `+${formatRevenue(stats?.monthlyRevenue ?? 0)} this month`],
          [CalendarDays, "Active bookings", String(stats?.totalBookings ?? 0), `${stats?.confirmedBookings ?? 0} confirmed`],
          [Users, "Travelers", String(stats?.totalTravelers ?? 0), `${packages.length} live packages`],
          [Bell, "Open requests", String(stats?.openRequests ?? 0), stats?.openRequests ? "Needs care" : "All clear"],
        ].map(([Icon, label, value, change]) => (
          <div className="ops-stat" key={label as string}>
            <span><Icon size={17} /></span>
            <small>{label as string}</small>
            <strong>{value as string}</strong>
            <em>{change as string}</em>
          </div>
        ))}
      </div>
      <div className="ops-two-col">
        <section className="ops-panel">
          <OpsHeading kicker="LIVE PIPELINE" title="Recent bookings" action="View all" onAction={() => onOpen("Bookings")} />
          {bookings.slice(0, 3).map((b) => (
            <div className="ops-booking-row" key={b.id}>
              <div><b>{b.bookingCode}</b><small>{b.packageName} · {b.travelerName}</small></div>
              <strong>₹{(b.grandTotal ?? 0).toLocaleString("en-IN")}</strong>
              <span className={`ops-status ${b.status.replaceAll("_", "-")}`}>{bookingStatusLabel(b.status)}</span>
            </div>
          ))}
          {bookings.length === 0 && <p style={{ opacity: 0.5, fontSize: 14, padding: "16px 0" }}>No bookings yet.</p>}
        </section>
        <section className="ops-panel ops-chart">
          <OpsHeading kicker="LIVE STATS" title="Revenue pulse" />
          <strong>{formatRevenue(stats?.monthlyRevenue ?? 0)}</strong>
          <em>{stats?.monthlyBookings ?? 0} bookings this month</em>
          <div className="ops-bars">
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} style={{ height: `${20 + Math.floor(Math.random() * 80)}%` }} />
            ))}
          </div>
        </section>
      </div>
      <section className="ops-panel">
        <OpsHeading kicker="CATALOG" title={`${packages.filter(p => p.status === "live").length} live routes`} action="Manage" onAction={() => onOpen("Packages")} />
        {packages.slice(0, 2).map((pkg) => (
          <div className="deal-row" key={pkg.id}>
            <img src={pkg.image} alt={pkg.name} />
            <div>
              <span className="admin-overline">{pkg.category?.toUpperCase()}</span>
              <h3>{pkg.name}</h3>
              <p>{pkg.location} · {pkg.duration}</p>
            </div>
            <strong>₹{(pkg.price ?? 0).toLocaleString("en-IN")}</strong>
          </div>
        ))}
      </section>
    </>
  );
}

// ─── Packages ────────────────────────────────────────────────────────────────
function Packages({ packages, isLoading, onOpen, refetch, adminUid }: {
  packages: FirebasePackage[]; isLoading: boolean;
  onOpen: (v: string) => void; refetch: () => Promise<void>; adminUid?: string;
}) {
  const [, navigate] = useLocation();
  const [archiving, setArchiving] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const handleArchive = async (pkg: FirebasePackage) => {
    if (!pkg.id) return;
    setArchiving(pkg.id);
    try {
      await archivePackage(pkg.id);
      toast.success(`${pkg.name} archived.`);
      await refetch();
    } catch { toast.error("Failed to archive package."); }
    setArchiving(null);
  };

  const toggleStatus = async (pkg: FirebasePackage) => {
    if (!pkg.id) return;
    setToggling(pkg.id);
    const next = pkg.status === "live" ? "draft" : "live";
    try {
      await fbUpdatePackage(pkg.id, { status: next });
      toast.success(`${pkg.name} is now ${next}.`);
      await refetch();
    } catch { toast.error("Failed to update status."); }
    setToggling(null);
  };

  return (
    <>
      <div className="ops-toolbar">
        <div className="ops-search"><Search size={16} /><input placeholder="Search packages" /></div>
        <button className="ops-cta" onClick={() => navigate("/admin/packages/new")}>
          Create package <ChevronRight size={15} />
        </button>
      </div>
      <section className="ops-panel">
        <OpsHeading kicker={`CATALOG / ${packages.filter(p => p.status === "live").length} LIVE ROUTES`} title="Package manager" />
        {isLoading && <div style={{ padding: "24px", display: "flex", gap: 8, opacity: 0.6 }}><LoaderCircle size={16} className="animate-spin" /> Loading packages…</div>}
        {!isLoading && packages.map((pkg) => (
          <div className="ops-package-row" key={pkg.id ?? pkg.name}>
            <img src={pkg.image} alt={pkg.name} />
            <div>
              <b>{pkg.name}</b>
              <small>{pkg.location} · {pkg.duration}</small>
            </div>
            <strong>₹{(pkg.price ?? 0).toLocaleString("en-IN")}</strong>
            <span
              className={`package-live ${pkg.status !== "live" ? "draft" : ""}`}
              style={{ cursor: "pointer" }}
              onClick={() => toggleStatus(pkg)}
              title="Click to toggle status"
            >
              {toggling === pkg.id ? <LoaderCircle size={12} className="animate-spin" /> : pkg.status.toUpperCase()}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => onOpen(`Edit ${pkg.name}`)} title="Edit"><Edit3 size={15} /></button>
              <button onClick={() => handleArchive(pkg)} title="Archive" style={{ color: "#e05" }}>
                {archiving === pkg.id ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
              </button>
            </div>
          </div>
        ))}
        {!isLoading && packages.length === 0 && (
          <div style={{ padding: "32px", textAlign: "center", opacity: 0.5 }}>
            No packages yet. <button className="ops-cta" onClick={() => navigate("/admin/packages/new")}>Create your first package</button>
          </div>
        )}
      </section>
    </>
  );
}

// ─── Bookings ────────────────────────────────────────────────────────────────
function Bookings({ bookings, onOpen }: { bookings: FirebaseBooking[]; onOpen: (v: string) => void }) {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [hostModal, setHostModal] = useState<FirebaseBooking | null>(null);
  const [hostName, setHostName] = useState("Rohan Sharma");
  const [hostPhone, setHostPhone] = useState("+91 98765 43210");
  const [hostWhatsapp, setHostWhatsapp] = useState("+91 98765 43210");

  const filtered = filter === "all"
    ? bookings
    : filter === "pending_approval"
      ? bookings.filter((b) => b.approvalStatus === "pending_manual_review" || b.status === "pending_approval")
      : bookings.filter((b) => b.status === filter);

  const handleManualApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostModal?.id) return;
    setUpdating(hostModal.id);
    try {
      const { approveBookingManual } = await import("@/lib/firebaseBookings");
      await approveBookingManual(
        hostModal.id,
        {
          name: hostName,
          phone: hostPhone,
          whatsapp: hostWhatsapp,
        },
        "admin_manual",
      );
      toast.success(`Booking ${hostModal.bookingCode} approved & host assigned!`);
      setHostModal(null);
    } catch {
      toast.error("Failed to approve booking.");
    } finally {
      setUpdating(null);
    }
  };

  const handleStatusUpdate = async (booking: FirebaseBooking, newStatus: BookingStatus) => {
    if (!booking.id) return;
    setUpdating(booking.id);
    try {
      await updateBookingStatus(booking.id, newStatus);
      toast.success(`Booking ${booking.bookingCode} marked as ${bookingStatusLabel(newStatus)}.`);
    } catch {
      toast.error("Failed to update booking status.");
    }
    setUpdating(null);
  };

  return (
    <>
      <div className="ops-toolbar">
        <div className="ops-search"><Search size={16} /><input placeholder="Search booking ID, package, traveler" /></div>
        <div className="ops-filters">
          {[
            ["all", "All Bookings"],
            ["pending_approval", "⚠️ Needs Manual Approval"],
            ["confirmed", "Approved & Verified"],
            ["on_trip", "Live On Trip"],
            ["completed", "Completed"],
            ["cancelled", "Cancelled"],
          ].map(([val, label]) => (
            <button key={val} className={filter === val ? "active" : ""} onClick={() => setFilter(val)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="ops-panel ops-table">
        <div className="ops-table-head">
          <span>Booking ID</span>
          <span>Traveler & Route</span>
          <span>Grand Total</span>
          <span>Verification / Status</span>
          <span>Manual Actions</span>
        </div>

        {filtered.length === 0 && (
          <p style={{ padding: "28px", opacity: 0.5, fontSize: 14 }}>No bookings found in this view.</p>
        )}

        {filtered.map((b) => {
          const cleanPhone = (b.phone || "").replace(/\D/g, "");
          const waText = encodeURIComponent(`Hello ${b.travelerName}, this is VOYAGR Operations regarding your booking ${b.bookingCode} (${b.packageName}).`);
          const isPendingReview = b.approvalStatus === "pending_manual_review" || b.status === "pending_approval";

          return (
            <div className="ops-table-row" key={b.id ?? b.bookingCode} style={{ cursor: "default", alignItems: "center" }}>
              <div>
                <b style={{ fontFamily: "monospace", color: "var(--color-brand, #f06a3a)" }}>{b.bookingCode}</b>
                <small style={{ display: "block", fontSize: 11, opacity: 0.6 }}>{b.travelDate || "Departure Pending"}</small>
              </div>

              <span>
                <strong>{b.travelerName}</strong>
                <small>{b.packageName} · {b.travelerCount} Travelers</small>
              </span>

              <strong>₹{(b.grandTotal ?? 0).toLocaleString("en-IN")}</strong>

              <div>
                <em
                  className="ops-status"
                  style={{
                    display: "inline-block",
                    padding: "3px 8px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    background: isPendingReview ? "#fef3c7" : b.status === "confirmed" ? "#e6f4f1" : "rgba(0,0,0,0.06)",
                    color: isPendingReview ? "#92400e" : b.status === "confirmed" ? "#2d7a6a" : "#444",
                  }}
                >
                  {isPendingReview ? "⚠️ Review Pending" : bookingStatusLabel(b.status)}
                </em>
                {b.hostContact && (
                  <small style={{ display: "block", fontSize: 10, color: "#666", marginTop: 2 }}>
                    Host: {b.hostContact.name}
                  </small>
                )}
              </div>

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {isPendingReview ? (
                  <button
                    onClick={() => setHostModal(b)}
                    style={{
                      padding: "6px 12px",
                      background: "var(--color-brand, #f06a3a)",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <CheckCircle size={13} /> Approve
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusUpdate(b, "on_trip")}
                    title="Mark live on trip"
                    style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #ddd", fontSize: 11, background: "white", cursor: "pointer" }}
                  >
                    Live on Trip
                  </button>
                )}

                {cleanPhone && (
                  <a
                    href={`https://wa.me/${cleanPhone}?text=${waText}`}
                    target="_blank"
                    rel="noreferrer"
                    title="WhatsApp Traveler"
                    style={{
                      padding: "6px",
                      borderRadius: 6,
                      background: "#25D366",
                      color: "white",
                      display: "inline-flex",
                      alignItems: "center",
                      textDecoration: "none",
                    }}
                  >
                    <MessageCircle size={14} />
                  </a>
                )}

                {b.phone && (
                  <a
                    href={`tel:${b.phone}`}
                    title="Call Traveler"
                    style={{
                      padding: "6px",
                      borderRadius: 6,
                      background: "#222",
                      color: "white",
                      display: "inline-flex",
                      alignItems: "center",
                      textDecoration: "none",
                    }}
                  >
                    <Phone size={14} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Host Assignment & Approval Modal */}
      {hostModal && (
        <div className="sheet-backdrop" onClick={() => setHostModal(null)}>
          <div
            className="ops-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460, width: "90%", margin: "auto", padding: 24, borderRadius: 16 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <span className="admin-overline">MANUAL APPROVAL & LOCK DESK</span>
                <h3 style={{ margin: 0 }}>Approve {hostModal.bookingCode}</h3>
              </div>
              <button onClick={() => setHostModal(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, opacity: 0.7, margin: "0 0 16px" }}>
              Approving this reservation issues the verified lock code to the traveler's cookies and assigns their local companion.
            </p>

            <form onSubmit={handleManualApprove} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700 }}>
                Assigned Host / Driver Name
                <input value={hostName} onChange={(e) => setHostName(e.target.value)} required style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }} />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700 }}>
                Host Phone Number
                <input value={hostPhone} onChange={(e) => setHostPhone(e.target.value)} required style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }} />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700 }}>
                Host WhatsApp Number
                <input value={hostWhatsapp} onChange={(e) => setHostWhatsapp(e.target.value)} required style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc" }} />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                <button type="button" onClick={() => setHostModal(null)} style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "#eee", cursor: "pointer" }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating === hostModal.id}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 6,
                    border: "none",
                    background: "var(--color-brand, #f06a3a)",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {updating === hostModal.id ? <LoaderCircle size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  <span>Confirm Approval</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Travelers ────────────────────────────────────────────────────────────────
function Travelers({ search, setSearch, travelers, onOpen }: {
  search: string; setSearch: (v: string) => void;
  travelers: TravelerProfile[]; onOpen: (v: string) => void;
}) {
  const [, navigate] = useLocation();
  return (
    <>
      <div className="ops-toolbar">
        <div className="ops-search">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, or email" />
        </div>
      </div>
      <section className="ops-panel ops-table">
        <div className="ops-table-head">
          <span>Traveler</span><span>Contact</span><span>Role</span><span>Status</span><span />
        </div>
        {travelers.length === 0 && (
          <p style={{ padding: "24px", opacity: 0.5, fontSize: 14 }}>
            {search ? "No travelers match your search." : "No travelers yet."}
          </p>
        )}
        {travelers.map((t) => (
          <button className="ops-table-row" key={t.uid} onClick={() => navigate(`/admin/travelers/${t.uid}`)}>
            <span>
              <strong>{t.displayName || "—"}</strong>
              <small>UID: {t.uid.slice(0, 8)}…</small>
            </span>
            <span>{t.email || t.phone || "—"}</span>
            <span>{t.role}</span>
            <em className={`ops-status ${t.status ?? "active"}`}>{t.status?.toUpperCase() ?? "ACTIVE"}</em>
            <ChevronRight size={16} />
          </button>
        ))}
      </section>
    </>
  );
}

// ─── Budget ──────────────────────────────────────────────────────────────────
function Budget({ onOpen }: { onOpen: (v: string) => void }) {
  const costs = [
    ["Accommodation", "₹4,500", "₹45,000"], ["Transport", "₹2,000", "₹20,000"],
    ["Meals", "₹1,500", "₹15,000"], ["Guide", "₹500", "₹5,000"],
    ["Entry tickets", "₹800", "₹8,000"], ["Miscellaneous", "₹700", "₹7,000"],
  ];
  return (
    <>
      <div className="budget-top">
        <div>
          <span className="admin-overline">COST MODEL</span>
          <h2>Goa 5N / 6D</h2>
          <p>10 travelers · margin target 45%</p>
        </div>
        <button className="ops-cta" onClick={() => onOpen("Add expense")}>Add expense <Plus size={15} /></button>
      </div>
      <div className="ops-two-col">
        <section className="ops-panel">
          <OpsHeading kicker="PACKAGE COST BREAKDOWN" title="The real numbers" />
          <div className="cost-head"><span>Cost item</span><span>Per person</span><span>Total (10)</span></div>
          {costs.map(([item, per, total]) => (
            <div className="cost-row" key={item}><span>{item}</span><span>{per}</span><strong>{total}</strong></div>
          ))}
          <div className="cost-row total"><span>Total cost</span><strong>₹10,000</strong><strong>₹1,00,000</strong></div>
        </section>
        <section className="ops-panel budget-summary">
          <span className="admin-overline">SELLING PRICE</span>
          <strong>₹18,999</strong>
          <small>per person</small>
          <div className="margin-circle">45<em>%</em></div>
          <p>Margin is healthy for the current route.</p>
          <button onClick={() => onOpen("Budget alerts")}>Manage alerts <ChevronRight size={15} /></button>
        </section>
      </div>
    </>
  );
}

// ─── Broadcast ───────────────────────────────────────────────────────────────
function Broadcast({ onOpen }: { onOpen: (v: string) => void }) {
  return (
    <>
      <div className="broadcast-hero">
        <div>
          <span className="admin-overline">REACH THE RIGHT PEOPLE</span>
          <h2>A useful note<br /><i>at the right time.</i></h2>
          <p>Compose push notifications, in-app announcements, and daily deals from one place.</p>
        </div>
        <Megaphone size={54} />
      </div>
      <div className="broadcast-grid">
        {[
          [Bell, "Push notification", "All users, segments, or one traveler"],
          [BookOpen, "Announcement board", "Banner, offer, event, or warning"],
          [Tag, "Daily deal", "Feature a package for up to 30 days"],
        ].map(([Icon, title, desc]) => (
          <button key={title as string} onClick={() => onOpen(title as string)}>
            <Icon size={20} />
            <b>{title as string}</b>
            <small>{desc as string}</small>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
      <section className="ops-panel">
        <OpsHeading kicker="SCHEDULED" title="What's going out" />
        <div className="scheduled-row">
          <span className="scheduled-dot offer" />
          <div><b>Monsoon rates are open</b><small>Scheduled for all travelers · tomorrow at 09:00</small></div>
          <span>Draft</span>
          <button onClick={() => onOpen("Edit announcement")}><ChevronRight size={15} /></button>
        </div>
      </section>
    </>
  );
}

// ─── Media ───────────────────────────────────────────────────────────────────
function Media({ onOpen, packages }: { onOpen: (v: string) => void; packages: FirebasePackage[] }) {
  return (
    <>
      <div className="ops-toolbar">
        <div className="ops-search"><Search size={16} /><input placeholder="Search files, tags, or folders" /></div>
        <button className="ops-cta" onClick={() => onOpen("Upload media")}><Upload size={15} /> Upload files</button>
      </div>
      <div className="folder-row">
        {([[FolderOpen, "Packages", `${packages.length} files`], [Ticket, "Tickets", "18 files"], [FileText, "Users", "42 files"], [FileImage, "Announcements", "9 files"]] as const).map(([Icon, name, count]) => (
          <button key={name} onClick={() => toast(`Opening ${name}.`)}>
            <Icon size={18} /><span><b>{name}</b><small>{count}</small></span><ChevronRight size={15} />
          </button>
        ))}
      </div>
      <section className="ops-panel">
        <OpsHeading kicker="PACKAGE COVERS" title="Media library" />
        <div className="media-grid">
          {packages.slice(0, 6).map((pkg) => (
            <button key={pkg.id ?? pkg.name} onClick={() => onOpen(`Media / ${pkg.name}`)}>
              <img src={pkg.image} alt={pkg.name} />
              <span>{pkg.name}</span>
              <small>Package cover</small>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

// ─── Analytics ───────────────────────────────────────────────────────────────
function Analytics({ stats, bookings, packages }: {
  stats: AdminStats | null; bookings: FirebaseBooking[]; packages: FirebasePackage[];
}) {
  const packageBookingCounts: Record<string, number> = {};
  for (const b of bookings) packageBookingCounts[b.packageName] = (packageBookingCounts[b.packageName] ?? 0) + 1;
  const topRoutes = Object.entries(packageBookingCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const totalCount = topRoutes.reduce((s, [, c]) => s + c, 0) || 1;

  return (
    <>
      <div className="analytics-stat-row">
        {[
          ["Total travelers", String(stats?.totalTravelers ?? 0), "—"],
          ["Total bookings", String(stats?.totalBookings ?? 0), "—"],
          ["Live packages", String(packages.filter(p => p.status === "live").length), "—"],
          ["Cancellations", String(bookings.filter(b => b.status === "cancelled").length), "—"],
        ].map(([label, value, change]) => (
          <div key={label}><span>{label}</span><strong>{value}</strong><small>{change}</small></div>
        ))}
      </div>
      <div className="ops-two-col">
        <section className="ops-panel big-chart">
          <OpsHeading kicker="REVENUE / ALL TIME" title="Total earnings" />
          <strong style={{ fontSize: 28 }}>{formatRevenue(stats?.totalRevenue ?? 0)}</strong>
          <div className="line-graph">
            <svg viewBox="0 0 600 180" preserveAspectRatio="none">
              <path d="M0 150 C60 134 70 90 125 116 S200 100 240 88 S315 116 360 74 S430 82 470 45 S540 66 600 20" fill="none" stroke="#f06a3a" strokeWidth="3" />
            </svg>
          </div>
        </section>
        <section className="ops-panel">
          <OpsHeading kicker="BOOKING DATA" title="Top routes" />
          {topRoutes.length === 0 && <p style={{ opacity: 0.5, fontSize: 14 }}>No booking data yet.</p>}
          {topRoutes.map(([name, count], i) => (
            <div className="top-route" key={name}>
              <span>0{i + 1}</span>
              <b>{name}</b>
              <em>{Math.round((count / totalCount) * 100)}%</em>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

// ─── Audit Log ───────────────────────────────────────────────────────────────
function AuditLog() {
  const events = [
    ["Just now", "System", "Firebase subscription active", "bookings collection", "SYSTEM"],
    ["Today", "Admin", "Packages loaded from Firestore", "packages collection", "ADMIN"],
    ["Today", "System", "Travelers synced", "travelerProfiles collection", "SYSTEM"],
  ];
  return (
    <>
      <section className="audit-banner">
        <ShieldCheck size={21} />
        <div><strong>Immutable event history</strong><span>Every privileged action is recorded.</span></div>
        <button onClick={() => toast("Audit export requested.")}><Download size={15} /> Export log</button>
      </section>
      <section className="ops-panel ops-table audit-table">
        <OpsHeading kicker="AUDIT / RECENT" title="Who changed what" />
        <div className="ops-table-head"><span>When</span><span>Actor</span><span>Action</span><span>Target</span><span>Role</span></div>
        {events.map(([time, actor, action, target, role]) => (
          <div className="ops-table-row" key={`${time}-${action}`} style={{ cursor: "default" }}>
            <b>{time}</b><span><strong>{actor}</strong></span><span>{action}</span><span>{target}</span><em className="audit-role">{role}</em>
          </div>
        ))}
      </section>
    </>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function Settings({ onOpen }: { onOpen: (v: string) => void }) {
  return (
    <>
      <section className="ops-panel settings-panel">
        <OpsHeading kicker="PLATFORM" title="System settings" />
        {[
          [ShieldCheck, "Security & access", "Roles, permissions, OTP expiry, lockout, and rate-limit policies"],
          [Bell, "Notification defaults", "Push, email, and in-app preferences"],
          [CircleDollarSign, "Currency & regional", "INR, date formats, and market settings"],
          [Settings2, "Integration status", "Firebase, Razorpay, FCM, Cloudinary, Cloudflare, PWA"],
        ].map(([Icon, title, desc]) => (
          <div className="settings-row" key={title as string}>
            <div><Icon size={18} /><span><b>{title as string}</b><small>{desc as string}</small></span></div>
            <button onClick={() => onOpen(title as string)}>Manage <ChevronRight size={15} /></button>
          </div>
        ))}
      </section>
      <section className="ops-panel danger-panel">
        <span className="admin-overline">DANGER ZONE</span>
        <h3>Platform-level actions</h3>
        <p>These controls are intentionally gated for super-admin review.</p>
        <button onClick={() => toast("System export requested.")}><Download size={15} /> Request data export</button>
      </section>
    </>
  );
}

// ─── Hero Banners & Slider Manager ───────────────────────────────────────────
function BannersManager() {
  const [banners, setBanners] = useState<Array<{
    id?: string;
    badge: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    ctaText: string;
    ctaLink: string;
    active: boolean;
    order: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // New banner form state
  const [badge, setBadge] = useState("NEW ESCAPE / 2026");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ctaText, setCtaText] = useState("Explore Route");
  const [ctaLink, setCtaLink] = useState("/explore");

  useEffect(() => {
    let unsub = () => {};
    import("@/lib/firebaseBanners").then(({ subscribeToAllBannersAdmin }) => {
      unsub = subscribeToAllBannersAdmin((bList) => {
        setBanners(bList as typeof banners);
        setLoading(false);
      });
    });
    return () => unsub();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { uploadImageFree } = await import("@/lib/freeStorage");
      const res = await uploadImageFree(file);
      setImageUrl(res.url);
      toast.success(`Image uploaded (${res.sizeKb} KB, zero cloud fee)!`);
    } catch {
      toast.error("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      toast.error("Please provide title and banner image.");
      return;
    }
    setSaving(true);
    try {
      const { createHeroBanner } = await import("@/lib/firebaseBanners");
      await createHeroBanner({
        badge: badge.trim() || "FEATURED ROUTE",
        title: title.trim(),
        subtitle: subtitle.trim(),
        imageUrl: imageUrl.trim(),
        ctaText: ctaText.trim() || "Explore Route",
        ctaLink: ctaLink.trim() || "/explore",
        active: true,
        order: banners.length + 1,
      });
      toast.success("New Hero Banner published to Home page!");
      setCreating(false);
      setTitle("");
      setSubtitle("");
      setImageUrl("");
    } catch {
      toast.error("Failed to save banner.");
    } finally {
      setSaving(false);
    }
  };

  const toggleBannerActive = async (id: string, current: boolean) => {
    try {
      const { updateHeroBanner } = await import("@/lib/firebaseBanners");
      await updateHeroBanner(id, { active: !current });
      toast.success(`Banner is now ${!current ? "Active" : "Hidden"}`);
    } catch {
      toast.error("Could not update banner status.");
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to remove this banner?")) return;
    try {
      const { deleteHeroBanner } = await import("@/lib/firebaseBanners");
      await deleteHeroBanner(id);
      toast.success("Banner deleted.");
    } catch {
      toast.error("Could not delete banner.");
    }
  };

  return (
    <>
      <div className="ops-toolbar">
        <OpsHeading
          kicker={`DYNAMIC SLIDER / ${banners.filter(b => b.active).length} ACTIVE ON HOME`}
          title="Hero Banners & Sliders"
        />
        <button className="ops-cta" onClick={() => setCreating(!creating)}>
          <Plus size={15} /> {creating ? "Close form" : "Add new banner"}
        </button>
      </div>

      {creating && (
        <section className="ops-panel" style={{ padding: 24, marginBottom: 20 }}>
          <span className="admin-overline">NEW HERO SLIDE</span>
          <h3 style={{ margin: "4px 0 16px" }}>Publish promotional banner to Home page</h3>
          <form onSubmit={handleCreateBanner} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              Slide Badge / Overline
              <input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="MONSOON ESCAPES / 2026" style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(0,0,0,0.14)" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              Main Headline
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goa, at your own pace." required style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(0,0,0,0.14)" }} />
            </label>
            <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              Subtitle Description
              <textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Portuguese courtyards, spice plantation lunches, and private backwaters." rows={2} style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(0,0,0,0.14)" }} />
            </label>

            <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Banner Image (Free Storage)</span>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {imageUrl && <img src={imageUrl} alt="preview" style={{ width: 100, height: 60, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd" }} />}
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "white", border: "1.5px solid rgba(0,0,0,0.15)", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  <ImageIcon size={16} />
                  <span>{uploading ? "Compressing & Uploading…" : "Upload from Computer (Free)"}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} hidden disabled={uploading} />
                </label>
                <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Or paste external image URL" style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid rgba(0,0,0,0.14)" }} />
              </div>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              Button Text
              <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Discover Goa" style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(0,0,0,0.14)" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              Button Link
              <input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="/explore?cat=Beaches" style={{ padding: 10, borderRadius: 8, border: "1px solid rgba(0,0,0,0.14)" }} />
            </label>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setCreating(false)} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#f0ede6", cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={saving || uploading} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", background: "var(--color-brand, #f06a3a)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
                <span>{saving ? "Publishing…" : "Publish to Home"}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="ops-panel">
        {loading ? (
          <div style={{ padding: 24, display: "flex", gap: 8, opacity: 0.6 }}><LoaderCircle size={16} className="animate-spin" /> Loading banners…</div>
        ) : banners.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", opacity: 0.6 }}>No custom banners. Default curated hero slides are active.</div>
        ) : (
          banners.map((b, idx) => (
            <div key={b.id ?? idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <img src={b.imageUrl} alt={b.title} style={{ width: 88, height: 56, objectFit: "cover", borderRadius: 8 }} />
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-brand, #f06a3a)" }}>{b.badge}</span>
                  <h4 style={{ margin: "2px 0 3px", fontSize: 15 }}>{b.title}</h4>
                  <small style={{ opacity: 0.65 }}>{b.subtitle}</small>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button
                  onClick={() => b.id && toggleBannerActive(b.id, b.active)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 20,
                    border: "none",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    background: b.active ? "#e6f4f1" : "rgba(0,0,0,0.08)",
                    color: b.active ? "#2d7a6a" : "#666",
                  }}
                >
                  {b.active ? "Active" : "Hidden"}
                </button>
                {b.id && (
                  <button onClick={() => handleDeleteBanner(b.id!)} style={{ background: "none", border: "none", color: "#cc4444", cursor: "pointer", padding: 4 }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}

// ─── Support Desk ─────────────────────────────────────────────────────────────
function SupportDesk({ adminProfile }: { adminProfile: { uid: string; name: string } | null }) {
  const [tickets, setTickets] = useState<Array<{
    id?: string;
    ticketCode: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    subject: string;
    body: string;
    status: "open" | "in_progress" | "waiting_on_user" | "resolved" | "closed";
    category: string;
    priority: string;
    bookingCode?: string;
    createdAt?: unknown;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTicket, setActiveTicket] = useState<{ id?: string; ticketCode: string; userName: string; subject: string; status: string } | null>(null);
  const [messages, setMessages] = useState<Array<{ id?: string; senderName: string; senderRole: string; text: string }>>([]);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    import("@/lib/firebaseSupport").then(({ subscribeToAllTickets }) => {
      unsub = subscribeToAllTickets((tList) => {
        setTickets(tList as typeof tickets);
        setLoading(false);
      });
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!activeTicket?.id) return;
    let unsub = () => {};
    import("@/lib/firebaseSupport").then(({ subscribeToTicketMessages }) => {
      unsub = subscribeToTicketMessages(activeTicket.id!, (mList) => {
        setMessages(mList);
      });
    });
    return () => unsub();
  }, [activeTicket?.id]);

  const changeStatus = async (ticketId: string, status: "open" | "in_progress" | "resolved" | "closed") => {
    try {
      const { updateTicketStatus } = await import("@/lib/firebaseSupport");
      await updateTicketStatus(ticketId, status);
      toast.success(`Ticket marked as ${status.replace("_", " ")}`);
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const sendAdminReply = async () => {
    if (!activeTicket?.id || !replyText.trim() || !adminProfile) return;
    setReplying(true);
    try {
      const { sendTicketMessage } = await import("@/lib/firebaseSupport");
      await sendTicketMessage(activeTicket.id, {
        senderId: adminProfile.uid,
        senderName: adminProfile.name || "VOYAGR Concierge",
        senderRole: "admin",
        text: replyText.trim(),
      });
      setReplyText("");
      toast.success("Reply sent to traveler!");
    } catch {
      toast.error("Could not send reply.");
    } finally {
      setReplying(false);
    }
  };

  return (
    <>
      <OpsHeading kicker={`CONCIERGE / ${tickets.filter(t => t.status !== "resolved" && t.status !== "closed").length} ACTIVE`} title="Support desk" />
      <div style={{ display: "grid", gridTemplateColumns: activeTicket ? "1.2fr 1fr" : "1fr", gap: 20 }}>
        <section className="ops-panel">
          {loading ? (
            <div style={{ padding: 24, display: "flex", gap: 8, opacity: 0.6 }}>
              <LoaderCircle size={16} className="animate-spin" /> Loading support queue…
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", opacity: 0.6 }}>No support tickets in queue.</div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id ?? t.ticketCode}
                onClick={() => setActiveTicket(t)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 18px",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  cursor: "pointer",
                  background: activeTicket?.id === t.id ? "rgba(240,106,58,0.06)" : "transparent",
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <b style={{ fontFamily: "monospace", fontSize: 13, color: "var(--color-brand, #f06a3a)" }}>{t.ticketCode}</b>
                    <small style={{ opacity: 0.6 }}>{t.userName} · {t.userPhone || t.userEmail}</small>
                  </div>
                  <h4 style={{ margin: "4px 0 2px", fontSize: 14 }}>{t.subject}</h4>
                  <p style={{ margin: 0, fontSize: 13, opacity: 0.7, maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.body}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    value={t.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => t.id && changeStatus(t.id, e.target.value as "open" | "in_progress" | "resolved" | "closed")}
                    style={{ padding: "4px 8px", borderRadius: 6, fontSize: 12, border: "1px solid rgba(0,0,0,0.15)", background: "white" }}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </section>

        {activeTicket && (
          <section className="ops-panel" style={{ display: "flex", flexDirection: "column", height: 500, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              <div>
                <b style={{ fontFamily: "monospace", fontSize: 13, color: "var(--color-brand, #f06a3a)" }}>{activeTicket.ticketCode}</b>
                <h3 style={{ margin: "2px 0 0", fontSize: 15 }}>{activeTicket.subject}</h3>
                <small style={{ opacity: 0.6 }}>Traveler: {activeTicket.userName}</small>
              </div>
              <button onClick={() => setActiveTicket(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "16px 0" }}>
              {messages.map((m, idx) => (
                <div
                  key={m.id ?? idx}
                  style={{
                    alignSelf: m.senderRole === "admin" ? "flex-end" : "flex-start",
                    background: m.senderRole === "admin" ? "var(--color-brand, #f06a3a)" : "rgba(0,0,0,0.06)",
                    color: m.senderRole === "admin" ? "white" : "inherit",
                    padding: "8px 14px",
                    borderRadius: 10,
                    maxWidth: "80%",
                    fontSize: 13,
                  }}
                >
                  <small style={{ display: "block", fontSize: 10, opacity: 0.75, marginBottom: 2 }}>
                    {m.senderName} ({m.senderRole})
                  </small>
                  {m.text}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.08)" }}>
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendAdminReply()}
                placeholder="Reply as Concierge…"
                style={{ flex: 1, padding: "8px 12px", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: 8, fontSize: 13 }}
              />
              <button
                onClick={sendAdminReply}
                disabled={replying || !replyText.trim()}
                style={{ padding: "8px 16px", background: "var(--color-brand, #f06a3a)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
              >
                <Send size={14} />
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────
function OpsHeading({ kicker, title, action, onAction }: {
  kicker: string; title: string | React.ReactNode; action?: string; onAction?: () => void;
}) {
  return (
    <div className="ops-heading">
      <div><span className="admin-overline">{kicker}</span><h2>{title}</h2></div>
      {action && <button onClick={onAction}>{action} <ChevronRight size={15} /></button>}
    </div>
  );
}

function OpsDrawer({ title, onClose, onSave }: { title: string; onClose: () => void; onSave: () => void }) {
  return (
    <div className="ops-drawer-backdrop" onClick={onClose}>
      <aside className="ops-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="ops-drawer-head">
          <div><span className="admin-overline">OPERATIONS / DRAFT</span><h2>{title}</h2></div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <label>Title or name<input defaultValue={title.replace(/^(Edit |Booking |Traveler \/ )/, "")} /></label>
        <label>Notes<textarea placeholder="Add context for the next person on the team." /></label>
        <label>Status
          <select defaultValue="Draft"><option>Draft</option><option>Ready for review</option><option>Live</option></select>
        </label>
        <div className="drawer-checks">
          <span><input type="checkbox" defaultChecked /> Notify affected travelers</span>
          <span><input type="checkbox" /> Schedule for later</span>
        </div>
        <button className="ops-cta" onClick={onSave}>Save draft <Send size={15} /></button>
      </aside>
    </div>
  );
}

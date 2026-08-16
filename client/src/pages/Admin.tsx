// Monsoon Modern: admin dashboard — real-time Firebase data
import { useEffect, useState, type ElementType } from "react";
import { Link, useLocation } from "wouter";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import {
  BarChart3, Bell, CalendarDays, ChevronRight, CircleDollarSign,
  FileText, LayoutDashboard, LoaderCircle, LogOut, Menu, Package,
  Settings2, ShieldCheck, Users, X, TrendingUp, TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  subscribeToAdminStats,
  subscribeToTravelers,
  formatRevenue,
  type AdminStats,
  type TravelerProfile,
} from "@/lib/firebaseAdmin";
import {
  subscribeToAllBookings,
  bookingStatusLabel,
  type FirebaseBooking,
} from "@/lib/firebaseBookings";

export default function Admin() {
  const [active, setActive] = useState("Overview");
  const { profile, signOut } = useTravelSession();
  const [, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Real-time Firebase data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<FirebaseBooking[]>([]);
  const [travelers, setTravelers] = useState<TravelerProfile[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const unsubStats = subscribeToAdminStats((s) => {
      setStats(s);
      setStatsLoading(false);
    });
    const unsubBookings = subscribeToAllBookings(setBookings);
    const unsubTravelers = subscribeToTravelers(setTravelers);
    return () => {
      unsubStats();
      unsubBookings();
      unsubTravelers();
    };
  }, []);

  const logout = () => { signOut(); navigate("/"); };
  const notify = (message: string) => toast(message);

  const navItems = [
    [LayoutDashboard, "Overview"],
    [Package, "Packages"],
    [CalendarDays, "Bookings"],
    [Users, "Travelers"],
    [BarChart3, "Analytics"],
  ] as const;

  const recentBookings = bookings.slice(0, 4);
  const revenueMonthly = stats?.monthlyRevenue ?? 0;
  const prevMonthRevenue = revenueMonthly * 0.87; // placeholder ratio

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase();

  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="admin-brand">
          <a href="/">
            <span className="admin-symbol">V</span>
            <span>VOYAGR <small>OPERATIONS</small></span>
          </a>
          <button className="admin-close" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>
        <div className="admin-side-label">Workspace</div>
        <nav>
          {navItems.map(([Icon, label]) => (
            <button
              key={label}
              className={active === label ? "active" : ""}
              onClick={() => { setActive(label); setMobileOpen(false); }}
            >
              <Icon size={17} />
              <span>{label}</span>
              {label === "Bookings" && stats && stats.pendingBookings > 0 && (
                <b>{stats.pendingBookings}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="admin-side-label secondary-label">Manage</div>
        <nav>
          {([
            [Bell, "Broadcasts", "/admin/broadcasts"],
            [FileText, "Documents", null],
            [Settings2, "Settings", "/admin/settings"],
          ] as const).map(([Icon, label, href]) => (
            <button
              key={label}
              onClick={() => href ? navigate(href) : notify(`${label} tools are ready for integration.`)}
            >
              <Icon size={17} />
              <span>{label as string}</span>
            </button>
          ))}
        </nav>
        <Link className="admin-settings-link" href="/admin/settings">
          <Settings2 size={16} />
          <span>Profile settings</span>
        </Link>
        <div className="admin-user">
          <div className="admin-avatar">{profile?.name?.slice(0, 2).toUpperCase() ?? "AD"}</div>
          <div>
            <strong>{profile?.name ?? "Administrator"}</strong>
            <small>{profile?.role?.replaceAll("_", " ") ?? "Admin"}</small>
          </div>
          <button className="admin-logout-button" onClick={logout} aria-label="Sign out"><LogOut size={15} /></button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <button className="admin-menu" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
          <div>
            <span className="admin-overline">{dateStr}</span>
            <h1>{active}</h1>
          </div>
          <div className="admin-head-actions">
            <button onClick={() => notify(stats?.openRequests ? `${stats.openRequests} pending bookings need attention.` : "No new notifications.")}>
              <Bell size={18} />
              {stats && stats.openRequests > 0 && <i />}
            </button>
            <Link className="admin-head-avatar admin-profile-link" href="/admin/settings" aria-label="Open profile settings">
              {profile?.name?.slice(0, 2).toUpperCase() ?? "AD"}
            </Link>
          </div>
        </header>

        <main className="admin-content">
          <div className="admin-welcome">
            <div>
              <span className="admin-overline">GOOD {getTimeOfDay()}, {profile?.name?.split(" ")[0]?.toUpperCase() ?? "ADMIN"}</span>
              <h2>Here's the shape<br /><i>of your day.</i></h2>
            </div>
            <button className="admin-primary" onClick={() => navigate("/admin/packages/new")}>
              Create package <ChevronRight size={16} />
            </button>
          </div>

          {/* Stats Grid — Real Firebase Data */}
          <div className="stat-grid">
            {statsLoading ? (
              <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: "8px", opacity: 0.6 }}>
                <LoaderCircle size={16} className="animate-spin" />
                <span style={{ fontSize: "14px" }}>Loading live stats from Firebase…</span>
              </div>
            ) : (
              <>
                <StatCard
                  label="Active bookings"
                  value={String(stats?.totalBookings ?? 0)}
                  change={`${stats?.confirmedBookings ?? 0} confirmed`}
                  icon={CalendarDays}
                  positive
                />
                <StatCard
                  label="Package revenue"
                  value={formatRevenue(stats?.totalRevenue ?? 0)}
                  change={`This month: ${formatRevenue(stats?.monthlyRevenue ?? 0)}`}
                  icon={CircleDollarSign}
                  positive
                />
                <StatCard
                  label="Total travelers"
                  value={String(stats?.totalTravelers ?? 0)}
                  change={`${stats?.totalPackages ?? 0} live packages`}
                  icon={Users}
                  positive
                />
                <StatCard
                  label="Open requests"
                  value={String(stats?.openRequests ?? 0)}
                  change={stats?.openRequests ? "Needs attention" : "All clear"}
                  icon={Bell}
                  positive={!stats?.openRequests}
                />
              </>
            )}
          </div>

          <div className="admin-columns">
            {/* Recent Bookings — Real Data */}
            <section className="panel bookings-panel">
              <div className="panel-heading">
                <div>
                  <span className="admin-overline">LIVE PIPELINE</span>
                  <h3>Recent bookings</h3>
                </div>
                <button onClick={() => navigate("/admin/operations")}>View all <ChevronRight size={15} /></button>
              </div>
              <div className="booking-table">
                <div className="table-head">
                  <span>Booking</span>
                  <span>Traveler</span>
                  <span>Value</span>
                  <span>Status</span>
                </div>
                {recentBookings.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", opacity: 0.5, fontSize: "14px" }}>
                    {statsLoading ? "Loading bookings…" : "No bookings yet. Share your packages to get started!"}
                  </div>
                ) : recentBookings.map((b) => (
                  <button
                    className="table-row"
                    key={b.id}
                    onClick={() => navigate(`/admin/bookings/${b.bookingCode}`)}
                  >
                    <span>
                      <strong>{b.bookingCode}</strong>
                      <small>{b.packageName}</small>
                    </span>
                    <span>{b.travelerName}</span>
                    <span>₹{(b.grandTotal ?? 0).toLocaleString("en-IN")}</span>
                    <span className={`status status-${b.status.replaceAll("_", "-")}`}>
                      {bookingStatusLabel(b.status)}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Revenue Chart */}
            <section className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <span className="admin-overline">THIS MONTH</span>
                  <h3>Revenue pulse</h3>
                </div>
                <button onClick={() => notify("Date range filter coming soon.")}>30 days <ChevronRight size={15} /></button>
              </div>
              <div className="revenue-total">
                <strong>{formatRevenue(stats?.monthlyRevenue ?? 0)}</strong>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {revenueMonthly >= prevMonthRevenue
                    ? <TrendingUp size={14} style={{ color: "var(--color-sage)" }} />
                    : <TrendingDown size={14} style={{ color: "#e05" }} />
                  }
                  {stats?.monthlyBookings ?? 0} bookings this month
                </span>
              </div>
              <div className="chart-bars">
                {generateBarData(bookings).map((height, index) => (
                  <div className="bar-col" key={index}>
                    <div className="bar" style={{ height: `${height}%` }} />
                    <small>{String(index + 1).padStart(2, "0")}</small>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Bottom Grid */}
          <div className="admin-bottom-grid">
            <section className="panel package-health">
              <div className="panel-heading">
                <div>
                  <span className="admin-overline">INVENTORY</span>
                  <h3>Package health</h3>
                </div>
                <button onClick={() => navigate("/admin/tools")}>Manage <ChevronRight size={15} /></button>
              </div>
              <PackageHealthList bookings={bookings} />
            </section>

            <section className="panel quick-panel">
              <span className="admin-overline">QUICK ACTIONS</span>
              <h3>Keep things moving.</h3>
              <div className="quick-actions">
                <button onClick={() => navigate("/admin/broadcasts")}><Bell size={17} /> Send broadcast</button>
                <button onClick={() => navigate("/admin/travelers/1")}><Users size={17} /> Manage travelers</button>
                <button onClick={() => navigate("/admin/packages/new")}><Package size={17} /> New package</button>
                <button onClick={() => navigate("/admin/operations")}><ShieldCheck size={17} /> All bookings</button>
                <button onClick={async () => {
                  if (!profile?.uid) { toast.error("Must be logged in."); return; }
                  try {
                    const { seedPackagesIfEmpty } = await import("@/lib/firebasePackages");
                    const seeded = await seedPackagesIfEmpty(profile.uid);
                    if (seeded) toast.success("Initial packages catalog seeded to Firestore!");
                    else toast.info("Packages already exist in Firestore.");
                  } catch { toast.error("Could not seed packages."); }
                }}><Package size={17} /> Seed sample packages</button>
                <button onClick={async () => {
                  if (!profile?.uid) { toast.error("Must be logged in."); return; }
                  try {
                    const { seedAnnouncementsIfEmpty } = await import("@/lib/firebaseCampaigns");
                    const seeded = await seedAnnouncementsIfEmpty(profile.uid);
                    if (seeded) toast.success("Sample announcements seeded!");
                    else toast.info("Announcements already exist.");
                  } catch { toast.error("Could not seed announcements."); }
                }}><Bell size={17} /> Seed announcements</button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, icon: Icon, positive }: {
  label: string; value: string; change: string; icon: ElementType; positive?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon"><Icon size={18} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small className={positive ? "positive" : "attention"}>{change}</small>
    </div>
  );
}

function PackageHealthList({ bookings }: { bookings: FirebaseBooking[] }) {
  // Package booking counts compute karo
  const packageCounts: Record<string, { name: string; count: number }> = {};
  for (const b of bookings) {
    if (!packageCounts[b.packageId]) {
      packageCounts[b.packageId] = { name: b.packageName, count: 0 };
    }
    packageCounts[b.packageId].count += 1;
  }

  const sorted = Object.entries(packageCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4);

  const maxCount = sorted[0]?.[1].count || 1;

  if (sorted.length === 0) {
    return (
      <div style={{ padding: "24px 0", opacity: 0.5, fontSize: "14px" }}>
        No booking data yet. Create packages and share them to see health metrics.
      </div>
    );
  }

  return (
    <>
      {sorted.map(([id, { name, count }]) => {
        const pct = Math.round((count / maxCount) * 100);
        const note = pct >= 80 ? "High demand" : pct >= 50 ? "Healthy" : "Watch";
        return (
          <div className="health-row" key={id}>
            <span className="health-avatar">{name.charAt(0)}</span>
            <div>
              <strong>{name}</strong>
              <small>{note} · {count} booking{count === 1 ? "" : "s"}</small>
            </div>
            <div className="health-progress"><span style={{ width: `${pct}%` }} /></div>
            <b>{pct}%</b>
          </div>
        );
      })}
    </>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "MORNING";
  if (h < 17) return "AFTERNOON";
  return "EVENING";
}

function generateBarData(bookings: FirebaseBooking[]): number[] {
  // Last 12 days ke booking counts
  const days = 12;
  const counts = Array.from({ length: days }, () => 0);
  const now = new Date();
  for (const b of bookings) {
    if (!b.createdAt) continue;
    const ts = (b.createdAt as { toDate?: () => Date }).toDate?.();
    if (!ts) continue;
    const diff = Math.floor((now.getTime() - ts.getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < days) {
      counts[days - 1 - diff] += 1;
    }
  }
  const max = Math.max(...counts, 1);
  return counts.map((c) => Math.max(5, Math.round((c / max) * 100)));
}

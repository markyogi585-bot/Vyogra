import { useState, useEffect } from "react";
import { AlertTriangle, Bell, Flame, LoaderCircle, Megaphone, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  subscribeToAllBroadcastsAdmin,
  createBroadcast,
  toggleBroadcastStatus,
  deleteBroadcast,
  type LiveBroadcast,
  type BroadcastType,
} from "@/lib/firebaseBroadcasts";

export function AdminBroadcasts() {
  const [broadcasts, setBroadcasts] = useState<LiveBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<BroadcastType>("flash_offer");
  const [actionText, setActionText] = useState("View Details");
  const [actionLink, setActionLink] = useState("/explore");
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAllBroadcastsAdmin((list) => {
      setBroadcasts(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Please provide title and message.");
      return;
    }
    setSaving(true);
    try {
      await createBroadcast({
        title: title.trim(),
        message: message.trim(),
        type,
        actionText: actionText.trim(),
        actionLink: actionLink.trim(),
        active: true,
        pinned,
      });
      toast.success("Broadcast published live to web app!");
      setCreating(false);
      setTitle("");
      setMessage("");
    } catch {
      toast.error("Failed to publish broadcast.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleBroadcastStatus(id, !current);
      toast.success(`Broadcast ${!current ? "Activated" : "Deactivated"}`);
    } catch {
      toast.error("Could not update status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this broadcast?")) return;
    try {
      await deleteBroadcast(id);
      toast.success("Broadcast removed.");
    } catch {
      toast.error("Failed to delete broadcast.");
    }
  };

  return (
    <div className="admin-broadcasts-module">
      <div className="ops-toolbar">
        <div>
          <span className="admin-overline">LIVE WEB TICKER / ALERTS</span>
          <h2 style={{ margin: "2px 0 0", fontSize: 20 }}>Global Announcements & Broadcasts</h2>
        </div>
        <button className="ops-cta" onClick={() => setCreating(!creating)}>
          <Plus size={15} /> {creating ? "Close form" : "Create New Broadcast"}
        </button>
      </div>

      {creating && (
        <section className="ops-panel" style={{ padding: 24, marginBottom: 20 }}>
          <span className="admin-overline">NEW LIVE BROADCAST</span>
          <h3 style={{ margin: "4px 0 16px" }}>Publish instant notice to top ticker of web app</h3>

          <form onSubmit={handleCreate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              Broadcast Type
              <select value={type} onChange={(e) => setType(e.target.value as BroadcastType)} style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }}>
                <option value="flash_offer">🔥 Flash Deal / Promo Offer</option>
                <option value="urgent_alert">🚨 Urgent Travel Alert</option>
                <option value="weather_warning">⛈️ Weather Warning</option>
                <option value="route_update">🧭 Route Update</option>
                <option value="general_notice">📢 General Notice</option>
              </select>
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              Broadcast Headline
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Monsoon Flash Sale Live!" required style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }} />
            </label>

            <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              Message Body (Shown on Top Ticker)
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Use code GOA2500 for ₹2,500 instant off on all coastal departures this weekend." rows={2} required style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              CTA Button Text (Optional)
              <input value={actionText} onChange={(e) => setActionText(e.target.value)} placeholder="Explore Deals" style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              CTA Link URL
              <input value={actionLink} onChange={(e) => setActionLink(e.target.value)} placeholder="/explore?cat=Beaches" style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }} />
            </label>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button type="button" onClick={() => setCreating(false)} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#f0ede6", cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", background: "var(--color-brand, #f06a3a)", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
                {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Megaphone size={16} />}
                <span>Publish Live</span>
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="ops-panel">
        {loading ? (
          <div style={{ padding: 24, display: "flex", gap: 8, opacity: 0.6 }}><LoaderCircle size={16} className="animate-spin" /> Loading broadcasts…</div>
        ) : broadcasts.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", opacity: 0.6 }}>No active broadcasts. Create one to display on the top ticker.</div>
        ) : (
          broadcasts.map((b) => (
            <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", padding: "2px 8px", borderRadius: 10, background: "#eee" }}>
                    {b.type.replaceAll("_", " ")}
                  </span>
                  <b style={{ fontSize: 14 }}>{b.title}</b>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.8 }}>{b.message}</p>
                {b.actionLink && <small style={{ color: "var(--color-brand, #f06a3a)" }}>Link: {b.actionLink}</small>}
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`🚩 *HAR HAR MAHADEV TOURS & TRAVELS*\n📢 *${b.title}*\n━━━━━━━━━━━━━━━━━\n${b.message}\n\n📲 *वेबसाइट लिंक:* ${window.location.origin}${b.actionLink || "/"}\n📞 *हेल्पलाइन:* +91 96306 42541 (Vijay Singh)`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    border: "none",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer",
                    background: "#dcfce7",
                    color: "#166534",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                  title="Share this announcement on WhatsApp"
                >
                  📲 WhatsApp Share
                </a>
                <button
                  onClick={() => b.id && handleToggle(b.id, b.active)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    border: "none",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    background: b.active ? "#e6f4f1" : "rgba(0,0,0,0.08)",
                    color: b.active ? "#2d7a6a" : "#666",
                  }}
                >
                  {b.active ? "Live On Web" : "Paused"}
                </button>
                {b.id && (
                  <button onClick={() => handleDelete(b.id!)} style={{ background: "none", border: "none", color: "#cc4444", cursor: "pointer", padding: 6 }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

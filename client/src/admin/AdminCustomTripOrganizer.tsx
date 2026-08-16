import { useState, useEffect } from "react";
import {
  Calendar, Check, ChevronRight, Clock, MapPin, MessageCircle, Phone, Plus,
  Share2, Shield, Trash2, UserPlus, Users, X, Download, Printer,
} from "lucide-react";
import { toast } from "sonner";
import {
  collection, doc, addDoc, onSnapshot, updateDoc, deleteDoc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase";
import { ImgBBDropzone } from "@/components/common/ImgBBDropzone";
import { siteConfig } from "@/config/siteConfig";

export interface GroupMember {
  id: string;
  name: string;
  phone: string;
  roomPreference: "Single" | "Double" | "Twin Shared";
  dietaryPreference?: string;
  isLeader?: boolean;
}

export interface CustomGroupTrip {
  id?: string;
  tripCode: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  bannerImage: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  status: "planning" | "confirmed" | "live_on_road" | "completed";
  members: GroupMember[];
  itineraryNotes: string;
  createdAt?: unknown;
}

const STORAGE_KEY = "voyagr-custom-group-trips";

function getLocalGroupTrips(): CustomGroupTrip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalGroupTrip(trip: CustomGroupTrip) {
  try {
    const list = getLocalGroupTrips();
    const idx = list.findIndex((t) => t.id === trip.id || t.tripCode === trip.tripCode);
    if (idx >= 0) list[idx] = { ...list[idx], ...trip };
    else list.unshift(trip);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export function AdminCustomTripOrganizer() {
  const [trips, setTrips] = useState<CustomGroupTrip[]>(getLocalGroupTrips);
  const [loading, setLoading] = useState(true);
  const [activeTrip, setActiveTrip] = useState<CustomGroupTrip | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // New trip form state
  const [title, setTitle] = useState("Haridwar Kedarnath Sacred Yatra Group");
  const [destination, setDestination] = useState("Haridwar · Guptkashi · Kedarnath · Badrinath · Rishikesh");
  const [startDate, setStartDate] = useState("2026-10-15");
  const [endDate, setEndDate] = useState("2026-10-22");
  const [bannerImage, setBannerImage] = useState("https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&auto=format&fit=crop&q=85");
  const [driverName, setDriverName] = useState("Vijay Singh (Tour Lead)");
  const [driverPhone, setDriverPhone] = useState("+91 96306 42541");
  const [vehicleNumber, setVehicleNumber] = useState("UK 07 TA 2026 (50 Seater Luxury AC Coach)");
  const [itineraryNotes, setItineraryNotes] = useState("Special VIP temple pass, pure satvik meals, and Har Ki Pauri Ganga Aarti boat passes included.");

  // Member add form state
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberRoom, setNewMemberRoom] = useState<GroupMember["roomPreference"]>("Double");

  useEffect(() => {
    if (!firebaseDb) {
      setLoading(false);
      return;
    }
    const q = query(collection(firebaseDb, "customGroupTrips"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CustomGroupTrip);
      const local = getLocalGroupTrips();
      const map = new Map<string, CustomGroupTrip>();
      local.forEach((t) => map.set(t.tripCode || t.id || "", t));
      list.forEach((t) => map.set(t.tripCode || t.id || "", t));
      setTrips(Array.from(map.values()));
      setLoading(false);
    }, () => {
      setTrips(getLocalGroupTrips());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const tripCode = `GRP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTrip: CustomGroupTrip = {
      id: `grp_${Date.now()}`,
      tripCode,
      title,
      destination,
      startDate,
      endDate,
      bannerImage,
      driverName,
      driverPhone,
      vehicleNumber,
      status: "confirmed",
      members: [
        {
          id: "m_1",
          name: "Group Organizer",
          phone: "+91 96306 42541",
          roomPreference: "Double",
          isLeader: true,
        },
      ],
      itineraryNotes,
      createdAt: new Date().toISOString(),
    };

    saveLocalGroupTrip(newTrip);

    if (firebaseDb) {
      try {
        const docRef = await addDoc(collection(firebaseDb, "customGroupTrips"), {
          ...newTrip,
          createdAt: serverTimestamp(),
        });
        newTrip.id = docRef.id;
        saveLocalGroupTrip(newTrip);
      } catch {}
    }

    setTrips((prev) => [newTrip, ...prev]);
    toast.success("🚩 Custom Group Yatra Created & Saved to Firestore!");
    setCreating(false);
    setSaving(false);
  };

  const handleAddMember = async () => {
    if (!activeTrip || !newMemberName.trim()) return;
    const newMember: GroupMember = {
      id: `m_${Date.now()}`,
      name: newMemberName.trim(),
      phone: newMemberPhone.trim() || "+91 96306 42541",
      roomPreference: newMemberRoom,
    };
    const updatedMembers = [...(activeTrip.members || []), newMember];
    const updatedTrip = { ...activeTrip, members: updatedMembers };

    saveLocalGroupTrip(updatedTrip);
    setActiveTrip(updatedTrip);
    setTrips((prev) => prev.map((t) => t.id === activeTrip.id ? updatedTrip : t));
    setNewMemberName("");
    setNewMemberPhone("");
    toast.success(`${newMember.name} added to group manifest!`);

    if (firebaseDb && activeTrip.id && !activeTrip.id.startsWith("grp_")) {
      try {
        await updateDoc(doc(firebaseDb, "customGroupTrips", activeTrip.id), {
          members: updatedMembers,
        });
      } catch {}
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeTrip) return;
    const updated = (activeTrip.members || []).filter((m) => m.id !== memberId);
    const updatedTrip = { ...activeTrip, members: updated };

    saveLocalGroupTrip(updatedTrip);
    setActiveTrip(updatedTrip);
    setTrips((prev) => prev.map((t) => t.id === activeTrip.id ? updatedTrip : t));
    toast.success("Member removed.");

    if (firebaseDb && activeTrip.id && !activeTrip.id.startsWith("grp_")) {
      try {
        await updateDoc(doc(firebaseDb, "customGroupTrips", activeTrip.id), {
          members: updated,
        });
      } catch {}
    }
  };

  const handleStatusChange = async (tripId: string, status: CustomGroupTrip["status"]) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;
    const updatedTrip = { ...trip, status };
    saveLocalGroupTrip(updatedTrip);
    setTrips((prev) => prev.map((t) => t.id === tripId ? updatedTrip : t));
    if (activeTrip?.id === tripId) setActiveTrip(updatedTrip);
    toast.success(`Group trip status set to ${status.toUpperCase()}`);

    if (firebaseDb && tripId && !tripId.startsWith("grp_")) {
      try {
        await updateDoc(doc(firebaseDb, "customGroupTrips", tripId), { status });
      } catch {}
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!window.confirm("Are you sure you want to delete this custom group trip?")) return;
    const updated = trips.filter((t) => t.id !== tripId);
    setTrips(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    if (activeTrip?.id === tripId) setActiveTrip(null);
    toast.success("Group trip removed.");

    if (firebaseDb && tripId && !tripId.startsWith("grp_")) {
      try {
        await deleteDoc(doc(firebaseDb, "customGroupTrips", tripId));
      } catch {}
    }
  };

  const generateWhatsAppBroadcast = () => {
    if (!activeTrip) return "";
    const memberList = (activeTrip.members || []).map((m, i) => `${i + 1}. ${m.name} (${m.phone})`).join("\n");
    const text = `🚩 *HAR HAR MAHADEV TOURS & TRAVELS* 🎫\n*GROUP YATRA MANIFEST / ${activeTrip.tripCode}*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n*Trip*: ${activeTrip.title}\n*Dates*: ${activeTrip.startDate} to ${activeTrip.endDate}\n*Coordinator*: ${activeTrip.driverName} (${activeTrip.driverPhone})\n*Vehicle*: ${activeTrip.vehicleNumber}\n\n*Confirmed Travelers (${activeTrip.members?.length || 0})*:\n${memberList}\n\n*Special Notes*: ${activeTrip.itineraryNotes}\n\n📞 Operations Head: Vijay Singh (${siteConfig.contact.primaryPhone})`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="custom-trip-organizer-wrap" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="ops-toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
        <div>
          <span className="admin-overline" style={{ color: "#f06a3a", fontWeight: 900, fontSize: 10 }}>CUSTOM YATRA & GROUP EXPEDITIONS</span>
          <h2 style={{ margin: "2px 0 0", fontSize: 20, color: "#183a37" }}>Group Travel & Custom Departures</h2>
        </div>
        <button className="ops-cta" onClick={() => setCreating(!creating)}>
          <Plus size={15} /> {creating ? "Close builder" : "Organize New Group Trip"}
        </button>
      </div>

      {/* New Trip Builder */}
      {creating && (
        <section className="ops-panel" style={{ padding: 24, marginBottom: 24, background: "white", borderRadius: 16 }}>
          <span className="admin-overline" style={{ color: "#f06a3a", fontWeight: 900, fontSize: 10 }}>CUSTOM TRIP BUILDER</span>
          <h3 style={{ margin: "4px 0 16px", color: "#183a37" }}>Organize on-demand group departure</h3>

          <form onSubmit={handleCreateTrip} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              Group Expedition Name
              <input value={title} onChange={(e) => setTitle(e.target.value)} required style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              Route / Destination
              <input value={destination} onChange={(e) => setDestination(e.target.value)} required style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              Start Date
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              End Date
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              Assigned Tour Coordinator / Driver
              <input value={driverName} onChange={(e) => setDriverName(e.target.value)} required style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              Driver / Coordinator Phone Helpline
              <input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} required style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }} />
            </label>

            <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              Vehicle Assignment (Make / Model / Reg No.)
              <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="e.g. 50 Seater Luxury AC Coach UK 07 TA 2026" style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }} />
            </label>

            <div style={{ gridColumn: "1 / -1" }}>
              <ImgBBDropzone value={bannerImage} onChange={setBannerImage} label="Trip Cover Photo (Free ImgBB CDN)" />
            </div>

            <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700 }}>
              Special Itinerary Inclusions & Notes
              <textarea value={itineraryNotes} onChange={(e) => setItineraryNotes(e.target.value)} rows={2} style={{ padding: 10, borderRadius: 8, border: "1px solid #ccc" }} />
            </label>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={() => setCreating(false)} style={{ padding: "10px 18px", borderRadius: 8, border: "none", background: "#eee", cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ padding: "10px 24px", background: "#f06a3a", color: "white", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>
                {saving ? "Saving Expedition…" : "Launch Group Trip"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Trips List & Detail Drawer */}
      <div style={{ display: "grid", gridTemplateColumns: activeTrip ? "1.2fr 1fr" : "1fr", gap: 20 }}>
        <section className="ops-panel" style={{ background: "white", borderRadius: 16 }}>
          {trips.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", opacity: 0.6 }}>No custom group trips organized yet. Click "Organize New Group Trip" to begin.</div>
          ) : (
            trips.map((t) => (
              <div
                key={t.id || t.tripCode}
                onClick={() => setActiveTrip(t)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                  cursor: "pointer",
                  background: activeTrip?.id === t.id ? "rgba(240,106,58,0.06)" : "transparent",
                }}
              >
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <img src={t.bannerImage} alt={t.title} style={{ width: 64, height: 44, objectFit: "cover", borderRadius: 8 }} onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200"; }} />
                  <div>
                    <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#f06a3a" }}>{t.tripCode}</span>
                    <h4 style={{ margin: "2px 0", fontSize: 15, color: "#183a37" }}>{t.title}</h4>
                    <small style={{ opacity: 0.65 }}><MapPin size={12} style={{ display: "inline" }} /> {t.destination} · {t.members?.length || 0} Travelers</small>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 10, background: t.status === "confirmed" ? "#dcfce7" : "#e6f4f1", color: t.status === "confirmed" ? "#166534" : "#2d7a6a" }}>
                    {t.status.toUpperCase()}
                  </span>
                  <ChevronRight size={16} />
                </div>
              </div>
            ))
          )}
        </section>

        {/* Group Manifest & Itinerary Desk */}
        {activeTrip && (
          <aside className="ops-panel" style={{ padding: 24, background: "white", borderRadius: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <span className="admin-overline" style={{ color: "#f06a3a", fontWeight: 900, fontSize: 10 }}>GROUP MANIFEST / {activeTrip.tripCode}</span>
                <h3 style={{ margin: "2px 0 0", color: "#183a37" }}>{activeTrip.title}</h3>
                <small style={{ color: "#666" }}>{activeTrip.startDate} to {activeTrip.endDate}</small>
              </div>
              <button onClick={() => setActiveTrip(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} /></button>
            </div>

            {/* Chauffeur Info */}
            <div style={{ background: "#faf8f5", padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
              <b>Assigned Coordinator:</b> {activeTrip.driverName} ({activeTrip.driverPhone})<br />
              <b>Vehicle:</b> {activeTrip.vehicleNumber}
            </div>

            {/* Status Selector */}
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>Trip Status:</span>
              <select
                value={activeTrip.status}
                onChange={(e) => activeTrip.id && handleStatusChange(activeTrip.id, e.target.value as any)}
                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 12, fontWeight: 700 }}
              >
                <option value="planning">PLANNING</option>
                <option value="confirmed">CONFIRMED</option>
                <option value="live_on_road">LIVE ON ROAD</option>
                <option value="completed">COMPLETED</option>
              </select>

              {activeTrip.id && (
                <button
                  onClick={() => handleDeleteTrip(activeTrip.id!)}
                  style={{ marginLeft: "auto", padding: "4px 8px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  <Trash2 size={12} style={{ display: "inline" }} /> Delete
                </button>
              )}
            </div>

            {/* Member List */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", color: "#666" }}>CONFIRMED TRAVELERS ({(activeTrip.members || []).length})</span>
                <a
                  href={generateWhatsAppBroadcast()}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#25D366", fontWeight: 700, textDecoration: "none" }}
                >
                  <MessageCircle size={14} /> WhatsApp Manifest
                </a>
              </div>

              {(activeTrip.members || []).map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#fbf9f4", border: "1px solid #eee", borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                  <div>
                    <b>{m.name}</b> {m.isLeader && <span style={{ fontSize: 10, background: "#fee2e2", color: "#b91c1c", padding: "1px 4px", borderRadius: 4, marginLeft: 4 }}>Leader</span>}
                    <small style={{ display: "block", color: "#777" }}>{m.phone} · {m.roomPreference}</small>
                  </div>
                  {!m.isLeader && (
                    <button onClick={() => handleRemoveMember(m.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Member Form */}
            <div style={{ borderTop: "1.5px solid #eee", paddingTop: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>Add Traveler to Manifest</span>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Traveler Name" style={{ flex: 1, padding: 6, borderRadius: 6, border: "1px solid #ccc", fontSize: 12 }} />
                <input value={newMemberPhone} onChange={(e) => setNewMemberPhone(e.target.value)} placeholder="Phone" style={{ width: 110, padding: 6, borderRadius: 6, border: "1px solid #ccc", fontSize: 12 }} />
              </div>
              <button onClick={handleAddMember} style={{ width: "100%", padding: "8px", background: "#183a37", color: "white", border: "none", borderRadius: 6, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
                <UserPlus size={13} style={{ display: "inline", marginRight: 4 }} /> Add Traveler
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

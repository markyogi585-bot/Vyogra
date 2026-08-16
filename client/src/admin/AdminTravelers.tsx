import { useState } from "react";
import { Check, Edit3, LoaderCircle, Mail, MapPin, MessageCircle, Phone, Search, ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase";
import { type TravelerProfile } from "@/lib/firebaseAdmin";

interface AdminTravelersProps {
  travelers: TravelerProfile[];
  search: string;
  setSearch: (query: string) => void;
}

export function AdminTravelers({ travelers, search, setSearch }: AdminTravelersProps) {
  const [selectedTraveler, setSelectedTraveler] = useState<TravelerProfile | null>(null);
  const [updating, setUpdating] = useState(false);

  // Filter travelers
  const filtered = travelers.filter((t) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      (t.email && t.email.toLowerCase().includes(q)) ||
      (t.phone && t.phone.includes(q)) ||
      (t.role && t.role.toLowerCase().includes(q))
    );
  });

  const changeRole = async (uid: string, newRole: TravelerProfile["role"]) => {
    if (!firebaseDb) return;
    setUpdating(true);
    try {
      await updateDoc(doc(firebaseDb, "travelerProfiles", uid), { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      if (selectedTraveler?.uid === uid) {
        setSelectedTraveler((prev) => prev ? { ...prev, role: newRole } : null);
      }
    } catch {
      toast.error("Failed to update user role.");
    } finally {
      setUpdating(false);
    }
  };

  const toggleStatus = async (uid: string, currentStatus?: string) => {
    if (!firebaseDb) return;
    const nextStatus = currentStatus === "suspended" ? "active" : "suspended";
    setUpdating(true);
    try {
      await updateDoc(doc(firebaseDb, "travelerProfiles", uid), { status: nextStatus });
      toast.success(`User marked as ${nextStatus}`);
      if (selectedTraveler?.uid === uid) {
        setSelectedTraveler((prev) => prev ? { ...prev, status: nextStatus } : null);
      }
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="admin-travelers-module">
      <div className="ops-toolbar">
        <div className="ops-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search traveler by name, email, phone, or role…"
          />
        </div>
        <div className="stats-badge">
          <Users size={15} />
          <span><b>{travelers.length}</b> Registered Travelers</span>
        </div>
      </div>

      <div className="travelers-grid-layout">
        {/* Travelers Table */}
        <section className="ops-panel ops-table">
          <div className="ops-table-head">
            <span>Traveler</span>
            <span>Contact Details</span>
            <span>Auth Provider</span>
            <span>Role</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {filtered.length === 0 ? (
            <p style={{ padding: 28, opacity: 0.5, fontSize: 14 }}>No registered travelers match your search.</p>
          ) : (
            filtered.map((t) => {
              const cleanPhone = (t.phone || "").replace(/\D/g, "");
              const isSuspended = t.status === "suspended";

              return (
                <div
                  className={`ops-table-row ${selectedTraveler?.uid === t.uid ? "selected" : ""}`}
                  key={t.uid}
                  onClick={() => setSelectedTraveler(t)}
                  style={{ cursor: "pointer", alignItems: "center" }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {t.photoURL ? (
                      <img src={t.photoURL} alt={t.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div className="avatar-chip">{t.name.slice(0, 2).toUpperCase() || "VG"}</div>
                    )}
                    <div>
                      <strong>{t.name}</strong>
                      <small style={{ display: "block", opacity: 0.6 }}>UID: {t.uid.slice(0, 8)}…</small>
                    </div>
                  </div>

                  <span>
                    <small>{t.email || "No email"}</small>
                    <b style={{ display: "block", fontSize: 12 }}>{t.phone || "No phone"}</b>
                  </span>

                  <span style={{ fontSize: 12, textTransform: "uppercase", fontWeight: 600 }}>
                    {t.provider || "Firebase Auth"}
                  </span>

                  <div>
                    <select
                      value={t.role}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => changeRole(t.uid, e.target.value as typeof t.role)}
                      disabled={updating}
                      style={{ padding: "4px 8px", borderRadius: 6, fontSize: 12, border: "1px solid #ccc" }}
                    >
                      <option value="user">Traveler</option>
                      <option value="sub_admin">Sub-Admin</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>

                  <div>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        background: isSuspended ? "#fee2e2" : "#e6f4f1",
                        color: isSuspended ? "#b91c1c" : "#2d7a6a",
                      }}
                    >
                      {isSuspended ? "Suspended" : "Active"}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ padding: 6, borderRadius: 6, background: "#25D366", color: "white" }}
                        title="WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </a>
                    )}
                    {t.phone && (
                      <a
                        href={`tel:${t.phone}`}
                        style={{ padding: 6, borderRadius: 6, background: "#222", color: "white" }}
                        title="Call"
                      >
                        <Phone size={14} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Traveler 360 Detail Drawer */}
        {selectedTraveler && (
          <aside className="ops-panel traveler-360-card" style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {selectedTraveler.photoURL ? (
                  <img src={selectedTraveler.photoURL} alt={selectedTraveler.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div className="avatar-chip large">{selectedTraveler.name.slice(0, 2).toUpperCase()}</div>
                )}
                <div>
                  <span className="admin-overline">{selectedTraveler.role.toUpperCase()}</span>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{selectedTraveler.name}</h3>
                  <small style={{ opacity: 0.6 }}>{selectedTraveler.email}</small>
                </div>
              </div>
              <button onClick={() => setSelectedTraveler(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>✕</button>
            </div>

            <div className="traveler-details-list">
              <div className="detail-item">
                <span>Phone Helpline</span>
                <b>{selectedTraveler.phone || "Not set"}</b>
              </div>
              <div className="detail-item">
                <span>Email Status</span>
                <b>{selectedTraveler.emailVerified ? "Verified" : "Pending Verification"}</b>
              </div>
              <div className="detail-item">
                <span>City / State</span>
                <b>{selectedTraveler.city || "Not provided"}</b>
              </div>
              <div className="detail-item">
                <span>Emergency Contact</span>
                <b>{selectedTraveler.emergencyPhone || "Not set"}</b>
              </div>
              <div className="detail-item">
                <span>Account Status</span>
                <b>{selectedTraveler.status === "suspended" ? "Suspended" : "Active & Good Standing"}</b>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button
                onClick={() => toggleStatus(selectedTraveler.uid, selectedTraveler.status)}
                disabled={updating}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: 8,
                  border: "none",
                  background: selectedTraveler.status === "suspended" ? "#2d7a6a" : "#dc2626",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {selectedTraveler.status === "suspended" ? "Reactivate User" : "Suspend Access"}
              </button>
            </div>
          </aside>
        )}
      </div>

      <style>{`
        .admin-travelers-module {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .stats-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: white;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          font-size: 13px;
        }
        .travelers-grid-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        .avatar-chip {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f0ede6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          color: #444;
        }
        .avatar-chip.large {
          width: 56px;
          height: 56px;
          font-size: 18px;
        }
        .traveler-details-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #faf8f5;
          padding: 16px;
          border-radius: 10px;
        }
        .detail-item {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }
        .detail-item span { color: #666; }
        .ops-table-row.selected {
          background: rgba(240,106,58,0.06);
        }
      `}</style>
    </div>
  );
}

// Monsoon Modern: Full Package Builder — Firestore backed
import { useState } from "react";
import { useLocation, Link } from "wouter";
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, ImageIcon, LoaderCircle,
  MapPin, Package, Plus, Tag, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import { createPackage, updatePackage, type FirebasePackage } from "@/lib/firebasePackages";
import { logAdminAction } from "@/lib/firebaseAdmin";
import { ImgBBDropzone } from "@/components/common/ImgBBDropzone";

const CATEGORIES = ["Heritage", "Beaches", "Mountains", "Nature", "Wellness", "Adventure", "Pilgrimage", "Wildlife"];

const STOCK_IMAGES = [
  { label: "Kedarnath Dham", url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&auto=format&fit=crop&q=85" },
  { label: "Rishikesh & Haridwar Ganga Aarti", url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&auto=format&fit=crop&q=85" },
  { label: "Varanasi Kashi Vishwanath Aarti", url: "https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=1200&auto=format&fit=crop&q=85" },
  { label: "Badrinath Himalaya", url: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=1200&auto=format&fit=crop&q=85" },
  { label: "Jyotirlinga Temple", url: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&auto=format&fit=crop&q=85" },
  { label: "Ayodhya Ram Mandir", url: "https://images.unsplash.com/photo-1627894483216-2138af692e32?w=1200&auto=format&fit=crop&q=85" },
  { label: "Goa Coastal Beach", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=85" },
  { label: "Kerala Backwaters", url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&auto=format&fit=crop&q=85" },
  { label: "Rajasthan Forts", url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&auto=format&fit=crop&q=85" },
];

const emptyPackage: Omit<FirebasePackage, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  location: "",
  duration: "",
  days: 5,
  nights: 4,
  price: 12999,
  childPrice: 6499,
  category: "Pilgrimage",
  image: STOCK_IMAGES[0].url,
  tag: "🚩 Char Dham Special",
  description: "",
  highlights: [""],
  inclusions: [""],
  exclusions: [""],
  itinerary: [{ day: 1, title: "", description: "" }],
  departureSlots: [
    "15 Oct 2026 - 22 Oct 2026 (Diwali Special Batch)",
    "02 Nov 2026 - 09 Nov 2026 (Chhath Puja Special Batch)",
    "20 Nov 2026 - 27 Nov 2026 (Kartik Purnima Holy Dip)",
  ],
  transportClass: "Train 3rd AC (3A) & AC Tempo Traveller",
  hotelTier: "3-Star Deluxe & Sacred Guest House",
  maxGroupSize: 25,
  minGroupSize: 2,
  whatsappGroupLink: "",
  status: "draft",
  sortOrder: 99,
};

export default function AdminPackageBuilderPage() {
  const { profile } = useTravelSession();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({ ...emptyPackage });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string>("");
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState("");

  const updateField = <K extends keyof typeof emptyPackage>(key: K, value: (typeof emptyPackage)[K]) =>
    setForm((prev: typeof emptyPackage) => ({ ...prev, [key]: value }));

  // ── Highlights / Inclusions / Exclusions helpers ──
  const updateListItem = (key: "highlights" | "inclusions" | "exclusions", index: number, value: string) => {
    const arr = [...(form[key] ?? [])];
    arr[index] = value;
    updateField(key, arr);
  };
  const addListItem = (key: "highlights" | "inclusions" | "exclusions") =>
    updateField(key, [...(form[key] ?? []), ""]);
  const removeListItem = (key: "highlights" | "inclusions" | "exclusions", index: number) => {
    const arr = [...(form[key] ?? [])];
    arr.splice(index, 1);
    updateField(key, arr);
  };

  // ── Itinerary helpers ──
  const updateItinDay = (index: number, field: "title" | "description", value: string) => {
    const itin = [...(form.itinerary ?? [])];
    itin[index] = { ...itin[index], [field]: value };
    updateField("itinerary", itin);
  };
  const addItinDay = () => {
    const itin = [...(form.itinerary ?? [])];
    itin.push({ day: itin.length + 1, title: "", description: "" });
    updateField("itinerary", itin);
  };
  const removeItinDay = (index: number) => {
    const itin = [...(form.itinerary ?? [])].filter((_, i) => i !== index)
      .map((d, i) => ({ ...d, day: i + 1 }));
    updateField("itinerary", itin);
  };

  const auto_duration = () => `${form.nights} nights · ${form.days} days`;

  const validate = (): string | null => {
    if (!form.name.trim()) return "Package name is required.";
    if (!form.location.trim()) return "Location is required.";
    if (!form.description.trim()) return "Description is required.";
    if (form.price < 100) return "Price must be at least ₹100.";
    if (form.days < 1) return "Duration must be at least 1 day.";
    return null;
  };

  const savePackage = async (publishStatus: "draft" | "live") => {
    const err = validate();
    if (err) { toast.error(err); return; }
    if (!profile?.uid) { toast.error("You must be signed in as an admin."); return; }

    setSaving(true);
    try {
      const packageData = {
        ...form,
        duration: form.duration || auto_duration(),
        status: publishStatus,
        highlights: form.highlights?.filter(Boolean),
        inclusions: form.inclusions?.filter(Boolean),
        exclusions: form.exclusions?.filter(Boolean),
        itinerary: form.itinerary?.filter((d: { day: number; title: string; description: string }) => d.title.trim()),
      };

      const id = await createPackage(packageData, profile.uid);
      await logAdminAction(profile.uid, "create_package", form.name, { status: publishStatus });
      setSavedId(id);
      setSaved(true);
      toast.success(publishStatus === "live" ? "Package published successfully!" : "Package saved as draft.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save package. Check your Firebase connection.");
    } finally {
      setSaving(false);
    }
  };

  if (saved) return (
    <main className="pkg-builder-page">
      <div className="pkg-builder-success">
        <div className="pkg-builder-success-icon"><Check size={32} /></div>
        <span className="admin-overline">PACKAGE SAVED</span>
        <h1>{form.status === "live" ? "Package is live!" : "Saved as draft."}</h1>
        <p>Your travel package <strong>{form.name}</strong> has been {form.status === "live" ? "published to the catalog." : "saved as a draft and is not visible to travelers yet."}</p>
        <div className="pkg-builder-success-actions">
          <button onClick={() => { setSaved(false); setForm({ ...emptyPackage }); setStep(1); }}>
            <Plus size={16} /> Create another
          </button>
          <Link href="/admin/tools"><ChevronRight size={16} /> View all packages</Link>
          <Link href={`/package/${savedId}`}><ArrowRight size={16} /> Preview package</Link>
        </div>
      </div>
    </main>
  );

  return (
    <main className="pkg-builder-page">
      <header className="pkg-builder-header">
        <Link href="/admin/tools"><ArrowLeft size={17} /> Back to admin</Link>
        <div className="pkg-builder-steps">
          {([1, 2, 3] as const).map((s) => (
            <button
              key={s}
              className={`pkg-step ${step === s ? "active" : ""} ${step > s ? "done" : ""}`}
              onClick={() => setStep(s)}
            >
              {step > s ? <Check size={13} /> : s}
            </button>
          ))}
        </div>
        <span className="admin-overline">
          {step === 1 ? "01 / BASIC INFO" : step === 2 ? "02 / DETAILS" : "03 / ITINERARY"}
        </span>
      </header>

      <div className="pkg-builder-layout">
        {/* ── Step 1: Basic Info ── */}
        {step === 1 && (
          <section className="pkg-builder-form">
            <span className="admin-overline">PACKAGE BASICS</span>
            <h1>What's the route<br /><i>called?</i></h1>
            <div className="pkg-field-grid">
              <label className="pkg-field full">
                Package name
                <input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Rajasthan Heritage Trail"
                />
              </label>
              <label className="pkg-field full">
                Location
                <div className="pkg-field-icon-wrap">
                  <MapPin size={15} />
                  <input
                    value={form.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    placeholder="e.g. Jaipur · Jodhpur · Udaipur"
                  />
                </div>
              </label>
              <label className="pkg-field">
                Category
                <select value={form.category} onChange={(e) => updateField("category", e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="pkg-field">
                Tag / Badge
                <div className="pkg-field-icon-wrap">
                  <Tag size={15} />
                  <input
                    value={form.tag}
                    onChange={(e) => updateField("tag", e.target.value)}
                    placeholder="e.g. Most loved"
                  />
                </div>
              </label>
              <label className="pkg-field">
                Days
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.days}
                  onChange={(e) => {
                    const d = Number(e.target.value);
                    updateField("days", d);
                    updateField("nights", Math.max(0, d - 1));
                  }}
                />
              </label>
              <label className="pkg-field">
                Nights
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={form.nights}
                  onChange={(e) => updateField("nights", Number(e.target.value))}
                />
              </label>
              <label className="pkg-field">
                Adult Base Price (₹)
                <input
                  type="number"
                  min={100}
                  value={form.price}
                  onChange={(e) => updateField("price", Number(e.target.value))}
                  placeholder="12999"
                />
              </label>
              <label className="pkg-field">
                Child Price (₹ · 2-11 yrs)
                <input
                  type="number"
                  min={0}
                  value={form.childPrice ?? Math.round(form.price * 0.5)}
                  onChange={(e) => updateField("childPrice", Number(e.target.value))}
                  placeholder="6499"
                />
              </label>
              <label className="pkg-field">
                Max Group Capacity
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.maxGroupSize}
                  onChange={(e) => updateField("maxGroupSize", Number(e.target.value))}
                />
              </label>
              <label className="pkg-field">
                Transport Class
                <input
                  value={form.transportClass ?? ""}
                  onChange={(e) => updateField("transportClass", e.target.value)}
                  placeholder="e.g. Train 3A & AC Innova"
                />
              </label>
            </div>

            {/* Departure Batch Slots */}
            <div style={{ marginTop: 14, background: "#fbf9f4", padding: 14, borderRadius: 12, border: "1px solid #e2ddd3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <b style={{ fontSize: 13, color: "#183a37" }}>🗓️ Departure Batch Slots ({form.departureSlots?.length || 0})</b>
                <button
                  type="button"
                  onClick={() => {
                    const current = form.departureSlots || [];
                    updateField("departureSlots", [...current, "15 Oct 2026 - 22 Oct 2026 (New Batch)"]);
                  }}
                  style={{ padding: "4px 10px", background: "#183a37", color: "white", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  + Add Batch Slot
                </button>
              </div>

              {(form.departureSlots || []).map((slot, sIdx) => (
                <div key={sIdx} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <input
                    value={slot}
                    onChange={(e) => {
                      const next = [...(form.departureSlots || [])];
                      next[sIdx] = e.target.value;
                      updateField("departureSlots", next);
                    }}
                    placeholder="e.g. 15 Oct 2026 - 22 Oct 2026 (Diwali Special Batch - 18 Seats Left)"
                    style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 12 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = (form.departureSlots || []).filter((_, i) => i !== sIdx);
                      updateField("departureSlots", next);
                    }}
                    style={{ padding: "6px 10px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 800 }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Custom WhatsApp Community Group for this Tour */}
            <div style={{ marginTop: 14 }}>
              <label className="pkg-field full">
                Custom WhatsApp Group Link (Optional)
                <input
                  value={form.whatsappGroupLink || ""}
                  onChange={(e) => updateField("whatsappGroupLink", e.target.value)}
                  placeholder="e.g. https://chat.whatsapp.com/XXXXX (Devotees can join after booking)"
                />
              </label>
            </div>

            <label className="pkg-field full" style={{ marginTop: 8 }}>
              Short description
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="A warm, editorial 1-2 sentence description of this route."
                rows={3}
              />
            </label>

            {/* ImgBB Free Image Uploader */}
            <div className="pkg-image-section" style={{ marginTop: 14 }}>
              <ImgBBDropzone
                value={form.image}
                onChange={(url) => updateField("image", url)}
                label="Package Cover Photo (Free ImgBB CDN Upload)"
                hint="Upload high-res tour cover photo without Firebase storage cost"
              />
            </div>

            <div className="pkg-builder-actions">
              <button className="pkg-primary-btn" onClick={() => setStep(2)}>
                Next: Package details <ArrowRight size={16} />
              </button>
            </div>
          </section>
        )}

        {/* ── Step 2: Details ── */}
        {step === 2 && (
          <section className="pkg-builder-form">
            <span className="admin-overline">PACKAGE DETAILS</span>
            <h1>What's included<br /><i>in the route?</i></h1>

            <div className="pkg-list-section">
              <div className="pkg-list-head">
                <span className="admin-overline">HIGHLIGHTS</span>
                <button onClick={() => addListItem("highlights")}><Plus size={14} /> Add</button>
              </div>
              {form.highlights?.map((h, i) => (
                <div className="pkg-list-row" key={i}>
                  <input
                    value={h}
                    onChange={(e) => updateListItem("highlights", i, e.target.value)}
                    placeholder="e.g. Amber Fort sunrise walk"
                  />
                  <button onClick={() => removeListItem("highlights", i)}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            <div className="pkg-list-section">
              <div className="pkg-list-head">
                <span className="admin-overline">INCLUSIONS</span>
                <button onClick={() => addListItem("inclusions")}><Plus size={14} /> Add</button>
              </div>
              {form.inclusions?.map((h, i) => (
                <div className="pkg-list-row" key={i}>
                  <input
                    value={h}
                    onChange={(e) => updateListItem("inclusions", i, e.target.value)}
                    placeholder="e.g. Hotel stays (twin-sharing)"
                  />
                  <button onClick={() => removeListItem("inclusions", i)}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            <div className="pkg-list-section">
              <div className="pkg-list-head">
                <span className="admin-overline">EXCLUSIONS</span>
                <button onClick={() => addListItem("exclusions")}><Plus size={14} /> Add</button>
              </div>
              {form.exclusions?.map((h, i) => (
                <div className="pkg-list-row" key={i}>
                  <input
                    value={h}
                    onChange={(e) => updateListItem("exclusions", i, e.target.value)}
                    placeholder="e.g. Flights / Personal shopping"
                  />
                  <button onClick={() => removeListItem("exclusions", i)}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            {/* Multi-Photo Gallery */}
            <div className="pkg-list-section" style={{ marginTop: 24 }}>
              <div className="pkg-list-head">
                <span className="admin-overline">MORE GALLERY PHOTOS ({form.galleryImages?.length || 0})</span>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: 11, color: "#666" }}>
                Upload additional high-resolution photos for the package photo gallery & lightbox.
              </p>
              <ImgBBDropzone
                label="Add Gallery Photo (ImgBB Free CDN)"
                onChange={(url) => {
                  if (url) {
                    const current = form.galleryImages || [];
                    updateField("galleryImages", [...current, url]);
                    toast.success("Photo added to gallery!");
                  }
                }}
              />
              {form.galleryImages && form.galleryImages.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                  {form.galleryImages.map((imgUrl, idx) => (
                    <div key={idx} style={{ position: "relative", width: 84, height: 64, borderRadius: 8, overflow: "hidden", border: "1px solid #ccc" }}>
                      <img src={imgUrl} alt={`Gallery ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => {
                          const next = form.galleryImages?.filter((_, i) => i !== idx);
                          updateField("galleryImages", next);
                        }}
                        style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.7)", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20, display: "grid", placeItems: "center", cursor: "pointer" }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cancellation Policy & Refund Terms */}
            <div className="pkg-list-section" style={{ marginTop: 24 }}>
              <div className="pkg-list-head">
                <span className="admin-overline">CANCELLATION & REFUND POLICY</span>
              </div>
              <label className="pkg-field full">
                Cancellation Policy Option
                <select
                  value={form.cancellationPolicy || "Flexible: Free cancellation up to 7 days before departure (100% Refund)"}
                  onChange={(e) => updateField("cancellationPolicy", e.target.value)}
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13, width: "100%", marginTop: 6 }}
                >
                  <option value="Flexible: Free cancellation up to 7 days before departure (100% Refund)">Flexible: Free cancellation up to 7 days before departure (100% Refund)</option>
                  <option value="Moderate: 50% refund up to 3 days before departure">Moderate: 50% refund up to 3 days before departure</option>
                  <option value="Non-Refundable: Strict non-cancellation once booked">Non-Refundable: Strict non-cancellation once booked</option>
                  <option value="Custom Policy">Custom Policy (specified below)</option>
                </select>
              </label>
            </div>

            {/* Terms & Conditions / Luggage Guidelines */}
            <div className="pkg-list-section" style={{ marginTop: 24 }}>
              <div className="pkg-list-head">
                <span className="admin-overline">TERMS, CONDITIONS & TRAVEL GUIDELINES (BILINGUAL)</span>
              </div>
              <label className="pkg-field full" style={{ marginTop: 6 }}>
                Traveler Guidelines & Safety Notes
                <textarea
                  rows={4}
                  value={form.termsAndConditions || "1. Original Govt Photo ID (Aadhaar/Passport) mandatory for all travelers.\n2. Luggage allowance: 15kg per person.\n3. AC vehicle provided for all road transfers.\n4. Local host assistance available 24x7 during the journey."}
                  onChange={(e) => updateField("termsAndConditions", e.target.value)}
                  placeholder="Specify safety guidelines, ID requirements, and baggage limits…"
                  style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 12, width: "100%", marginTop: 6 }}
                />
              </label>
            </div>

            <div className="pkg-builder-actions">
              <button className="pkg-outline-btn" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button>
              <button className="pkg-primary-btn" onClick={() => setStep(3)}>
                Next: Itinerary <ArrowRight size={16} />
              </button>
            </div>
          </section>
        )}

        {/* ── Step 3: Itinerary ── */}
        {step === 3 && (
          <section className="pkg-builder-form">
            <span className="admin-overline">DAY-BY-DAY ITINERARY</span>
            <h1>The route, one day<br /><i>at a time.</i></h1>

            <div className="pkg-itin-list">
              {form.itinerary?.map((day, i) => (
                <div className="pkg-itin-day" key={i}>
                  <div className="pkg-itin-day-head">
                    <span>DAY {day.day}</span>
                    {(form.itinerary?.length ?? 0) > 1 && (
                      <button onClick={() => removeItinDay(i)}><X size={14} /></button>
                    )}
                  </div>
                  <input
                    value={day.title}
                    onChange={(e) => updateItinDay(i, "title", e.target.value)}
                    placeholder="Day title e.g. Jaipur Arrival"
                  />
                  <textarea
                    value={day.description}
                    onChange={(e) => updateItinDay(i, "description", e.target.value)}
                    placeholder="Brief description of the day's activities…"
                    rows={2}
                  />
                </div>
              ))}
              <button className="pkg-add-day-btn" onClick={addItinDay}>
                <Plus size={15} /> Add day {(form.itinerary?.length ?? 0) + 1}
              </button>
            </div>

            {/* Status selector */}
            <div className="pkg-status-row">
              <span className="admin-overline">PUBLISH STATUS</span>
              <div className="pkg-status-options">
                <label>
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={form.status === "draft"}
                    onChange={() => updateField("status", "draft")}
                  />
                  Save as draft — not visible to travelers
                </label>
                <label>
                  <input
                    type="radio"
                    name="status"
                    value="live"
                    checked={form.status === "live"}
                    onChange={() => updateField("status", "live")}
                  />
                  Publish live — visible in package catalog
                </label>
              </div>
            </div>

            <div className="pkg-builder-actions">
              <button className="pkg-outline-btn" onClick={() => setStep(2)}><ArrowLeft size={16} /> Back</button>
              <button
                className="pkg-secondary-btn"
                disabled={saving}
                onClick={() => savePackage("draft")}
              >
                {saving ? <LoaderCircle size={15} className="animate-spin" /> : null}
                Save draft
              </button>
              <button
                className="pkg-primary-btn"
                disabled={saving}
                onClick={() => savePackage("live")}
              >
                {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Package size={15} />}
                Publish package
              </button>
            </div>
          </section>
        )}

        {/* Preview Side Panel */}
        <aside className="pkg-builder-preview">
          <span className="admin-overline">LIVE PREVIEW</span>
          <div className="pkg-preview-card">
            {form.image ? (
              <div className="pkg-preview-img">
                <img src={form.image} alt={form.name || "Package"} />
                {form.tag && <span>{form.tag}</span>}
              </div>
            ) : (
              <div className="pkg-preview-img-placeholder"><ImageIcon size={24} /></div>
            )}
            <div className="pkg-preview-body">
              <small>{auto_duration()}</small>
              <h3>{form.name || "Package name"}</h3>
              <p>{form.location || "Location"}</p>
              <div className="pkg-preview-price">
                <strong>From ₹{form.price.toLocaleString("en-IN")}</strong>
                <span className={`pkg-status-badge ${form.status}`}>
                  {form.status === "live" ? "LIVE" : "DRAFT"}
                </span>
              </div>
            </div>
          </div>
          <p className="pkg-preview-note">{form.description || "Your package description will appear here."}</p>
        </aside>
      </div>
    </main>
  );
}

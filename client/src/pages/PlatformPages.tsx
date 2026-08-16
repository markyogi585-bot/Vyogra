// Monsoon Modern: route-led traveler surfaces with Firebase integration.
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Bell, CalendarDays, Check, ChevronDown, ChevronRight, Clock3, Download, Heart, LoaderCircle, LogOut, MapPin, MessageCircle, Minus, Phone, Plus, Search, Send, ShieldCheck, SlidersHorizontal, Star, Ticket, UserRound, Wallet, X } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { PageIntro, VoyagrShell } from "@/components/VoyagrShell";
import { catalog, tripStages, upcomingTrips, voyageImages } from "@/lib/voyagrData";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import { trpc } from "@/lib/trpcClient";
import { travelerCopy } from "@/lib/travelerCopy";
import { usePackages, usePackage } from "@/hooks/usePackages";
import {
  subscribeToUserBookings,
  bookingStatusLabel,
  type FirebaseBooking,
} from "@/lib/firebaseBookings";
import { PackageCardSkeleton, TableSkeleton } from "@/components/common/ModernLoadingSkeleton";

import { handleImgError } from "@/lib/imageFallback";

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const notify = (message: string) => toast(message);

export function Explore() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All routes");
  const [sort, setSort] = useState("Popular");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const { locale } = useTravelSession();
  const copy = travelerCopy(locale);
  const categories = ["All routes", "Mountains", "Beaches", "Heritage", "Nature", "Wellness", "Adventure", "Wellness", "Pilgrimage"];
  const { packages, isLoading: pkgLoading } = usePackages();

  const results = useMemo(() => {
    let list = packages.filter((item) =>
      `${item.name} ${item.location} ${item.category} ${item.tag}`.toLowerCase().includes(query.toLowerCase()) &&
      (category === "All routes" ||
        item.category?.toLowerCase() === category.toLowerCase() ||
        (category === "Pilgrimage" && (item.category?.toLowerCase().includes("pilgrim") || item.tag?.toLowerCase().includes("sacred") || item.tag?.toLowerCase().includes("dham")))),
    );
    if (sort === "Price low to high") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "Price high to low") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [packages, query, category, sort]);

  return (
    <VoyagrShell title="EXPLORE">
      <div className="platform-page">
        <PageIntro kicker={copy.explore.kicker} title={<>{copy.explore.lineOne}<br /><i>{copy.explore.lineTwo}</i></>} body={copy.explore.body} />
        <div className="listing-toolbar">
          <div className="listing-search">
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search destinations, packages, or tags" />
          </div>
          <button className="filter-trigger" onClick={() => setFilterOpen(true)}><SlidersHorizontal size={16} /> Filters</button>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option>Popular</option>
            <option>Price low to high</option>
            <option>Price high to low</option>
          </select>
          <div className="view-toggle">
            <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}>Grid</button>
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>List</button>
          </div>
        </div>
        <div className="filter-chips">
          {[
            { label: "All routes", key: "All routes" },
            { label: "🚩 Pilgrimage (तीर्थ यात्रा)", key: "Pilgrimage" },
            { label: "🏰 Royal Heritage", key: "Heritage" },
            { label: "🏖️ Beaches & Coastal", key: "Beaches" },
            { label: "🏔️ Mountains & Hills", key: "Mountains" },
            { label: "🌿 Nature & Wellness", key: "Wellness" },
          ].map((item) => (
            <button
              key={item.key}
              className={category === item.key || (category === "All routes" && item.key === "All routes") ? "active" : ""}
              onClick={() => setCategory(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {pkgLoading ? (
          <div style={{ padding: "20px 0" }}>
            <PackageCardSkeleton count={6} />
          </div>
        ) : (
          <div className={`explore-results ${view === "list" ? "list-view" : ""}`}>
            {results.map((item, index) => (
              <Link href={`/package/${item.id}`} className={`explore-card ${index === 0 ? "featured-explore" : ""}`} key={item.id ?? item.name}>
                <div className="explore-image">
                  <img src={item.image} alt={item.name} onError={handleImgError} />
                  <span>{item.tag}</span>
                  <b className="explore-index">0{index + 1}</b>
                </div>
                <div className="explore-card-copy">
                  <div className="explore-card-top"><span>{item.duration}</span><Heart size={17} /></div>
                  <h2>{item.name}</h2>
                  <p><MapPin size={14} /> {item.location}</p>
                  <div className="explore-card-bottom">
                    <strong>From {money(item.price)}</strong>
                    <span>View route <ArrowRight size={14} /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!pkgLoading && results.length === 0 && (
          <div className="empty-state">
            <Search size={24} />
            <h3>No route found yet.</h3>
            <p>Try a broader place, feeling, or category.</p>
            <button onClick={() => { setQuery(""); setCategory("All routes"); }}>Clear search</button>
          </div>
        )}
      </div>
      {filterOpen && (
        <div className="sheet-backdrop" onClick={() => setFilterOpen(false)}>
          <section className="filter-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div><span className="admin-overline">REFINE THE ROUTE</span><h3>Find your fit.</h3></div>
              <button className="close-button" onClick={() => setFilterOpen(false)}><X size={18} /></button>
            </div>
            <label>Duration</label>
            <div className="filter-options">
              <button className="active">Any duration</button>
              <button>1–3 days</button><button>4–7 days</button><button>8–14 days</button>
            </div>
            <label>Category</label>
            <div className="filter-options">
              {["All", "Heritage", "Beaches", "Mountains", "Nature", "Wellness"].map((c) => (
                <button key={c} className={category === c || (c === "All" && category === "All routes") ? "active" : ""} onClick={() => { setCategory(c === "All" ? "All routes" : c); setFilterOpen(false); }}>{c}</button>
              ))}
            </div>
            <button className="book-cta" onClick={() => setFilterOpen(false)}>Apply filters <ArrowRight size={17} /></button>
          </section>
        </div>
      )}
    </VoyagrShell>
  );
}


export function PackageDetail({ id }: { id: string }) {
  const { pkg: fbPkg, isLoading: pkgLoading } = usePackage(id);
  const staticFallback = catalog.find((entry) => entry.id === id) ?? catalog[0];
  const item = fbPkg || {
    id: staticFallback.id,
    name: staticFallback.name,
    location: staticFallback.location,
    duration: staticFallback.duration,
    days: staticFallback.days,
    nights: staticFallback.days - 1,
    price: staticFallback.price,
    category: staticFallback.category,
    image: staticFallback.image,
    tag: staticFallback.tag,
    description: staticFallback.description,
    status: "live" as const,
    highlights: ["Sunrise Heritage Walk", "Handpicked Boutique Stays", "Verified Chauffeur"],
    inclusions: ["All transfers in private vehicle", "Daily gourmet breakfast", "24x7 local host support"],
    exclusions: ["Flight tickets", "Personal expenses"],
    cancellationPolicy: "Flexible: Free cancellation up to 7 days before departure (100% Refund)",
    termsAndConditions: "1. Original Govt ID (Aadhaar/Passport) mandatory.\n2. Luggage limit 15kg per person.\n3. AC vehicle provided for all road transfers.",
    galleryImages: [
      staticFallback.image,
      "https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=1200&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&auto=format&fit=crop&q=85",
    ],
  };

  const [tab, setTab] = useState("Overview");
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const { profile, openAuth, openDateSheet } = useTravelSession();

  const allPhotos = [item.image, ...(item.galleryImages || [])].filter((url, idx, self) => url && self.indexOf(url) === idx);

  const tabContent = {
    Overview: (
      <div className="detail-grid">
        <div>
          <p className="lead-copy">{item.description} Handcrafted with generous gaps between highlights for a serene, memorable journey.</p>
          <h3>Highlights of this route</h3>
          <div className="highlight-list">
            {(item.highlights || ["Boutique stays with breakfast", "24x7 Local Host On Call", "Scenic road transfers"]).map((h: string, i: number) => (
              <span key={i}><Check size={16} color="#22c55e" /> {h}</span>
            ))}
          </div>

          <h3 style={{ marginTop: 28 }}>Upcoming Departure Batches & Available Slots</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {(item.departureSlots && item.departureSlots.length > 0
              ? item.departureSlots
              : [
                  "15 Oct 2026 - 22 Oct 2026 (Diwali Sacred Darshan Batch - 18 Seats Left)",
                  "02 Nov 2026 - 09 Nov 2026 (Chhath Puja Special Batch - 12 Seats Left)",
                  "20 Nov 2026 - 27 Nov 2026 (Kartik Purnima Holy Dip - 15 Seats Left)",
                ]
            ).map((slot: string, sIdx: number) => (
              <div
                key={sIdx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 18px",
                  background: "#fbf9f4",
                  borderRadius: 12,
                  border: "1px solid #e2ddd3",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <div>
                  <b style={{ color: "#183a37", fontSize: 13, display: "block" }}>🚩 {slot}</b>
                  <small style={{ color: "#166534", fontSize: 11, fontWeight: 700 }}>🟢 Online Manual Verification Open</small>
                </div>
                <Link
                  href={`/checkout?packageId=${item.id}`}
                  style={{
                    padding: "6px 14px",
                    background: "#f06a3a",
                    color: "white",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  Book This Batch →
                </Link>
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: 28 }}>Cancellation & Refund Policy</h3>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "14px 18px", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <ShieldCheck size={20} color="#16a34a" />
            <div>
              <b style={{ color: "#166534", fontSize: 13 }}>{item.cancellationPolicy || "Flexible Cancellation Policy"}</b>
              <p style={{ margin: 0, fontSize: 11, color: "#15803d" }}>Full transparency on all booking adjustments and refunds.</p>
            </div>
          </div>
        </div>
        <div className="detail-side-note">
          <span className="admin-overline">GOOD TO KNOW</span>
          <p>Verified local hosts, intimate stays, and unhurried transfers beyond the brochure.</p>
          <a
            href={`https://wa.me/919630642541?text=हर%20हर%20महादेव!%20मैं%20${encodeURIComponent(item.name)}%20पैकेज%20के%20बारे%20में%20जानकारी%20चाहता%20हूँ।`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              padding: "10px 16px",
              background: "#25D366",
              color: "white",
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            <MessageCircle size={15} />
            <span>Ask Organizer on WhatsApp</span>
          </a>
        </div>
      </div>
    ),
    Itinerary: (
      <div className="itinerary-large" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#fdfbf7", padding: "14px 18px", borderRadius: 12, border: "1px solid #f06a3a44", marginBottom: 8 }}>
          <b style={{ color: "#f06a3a", fontSize: 13 }}>🚩 संपूर्ण यात्रा मार्ग दर्शन (कहाँ-कहाँ जाएँगे)</b>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#666" }}>
            सभी मुख्य तीर्थ स्थल, मंदिर दर्शन, आरती समय, और प्राकृतिक विश्राम स्थल की विस्तृत कार्यसूची।
          </p>
        </div>

        {(item.itinerary && item.itinerary.length > 0 ? item.itinerary : [
          { day: 1, title: "Haridwar Arrival & Evening Ganga Aarti", description: "Arrive at Haridwar railway/airport. Hotel check-in, visit Har Ki Pauri for divine Ganga Aarti & sacred snan." },
          { day: 2, title: "Haridwar to Guptkashi / Rudraprayag", description: "Scenic mountain drive via Devprayag & Rudraprayag sangams. Check-in to deluxe mountain resort." },
          { day: 3, title: "Kedarnath Dham Darshan & Stay", description: "Early morning transfer to Kedarnath via trek / helicopter pass. Evening Shiva Temple Aarti and night stay." },
          { day: 4, title: "Kedarnath to Badrinath Dham", description: "Morning Mahadev Darshan, drive to Badrinath via Joshimath. Evening Tapt Kund holy bath & Badrinath Temple Darshan." },
          { day: 5, title: "Mana Village, Rishikesh & Departure", description: "Explore India's first village Mana, Vyas Gufa, and evening Rishikesh Triveni Ghat Aarti with safe transfer." },
        ]).map((day: any, index: number) => {
          const sampleImg = (item.galleryImages && item.galleryImages[index % item.galleryImages.length]) || item.image;
          return (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                gap: 16,
                padding: "16px",
                background: "#ffffff",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative" }}>
                <img
                  src={sampleImg}
                  alt={day.title}
                  style={{ width: 100, height: 75, borderRadius: 10, objectFit: "cover" }}
                  onError={handleImgError}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: 4,
                    left: 4,
                    background: "rgba(24,58,55,0.85)",
                    color: "white",
                    fontSize: 9,
                    fontWeight: 900,
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  DAY 0{day.day || index + 1}
                </span>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <strong style={{ fontSize: 15, color: "#183a37" }}>{day.title}</strong>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 6px", background: "#fef3c7", color: "#92400e", borderRadius: 4 }}>
                    📍 Verified Stop
                  </span>
                </div>
                <p style={{ margin: "4px 0 0", color: "#555", fontSize: 13, lineHeight: 1.5 }}>{day.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    ),
    Inclusions: (
      <div className="inclusion-grid">
        <div>
          <h3>Included in Fare</h3>
          {(item.inclusions || ["Boutique stays with breakfast", "Private AC transfers", "Dedicated host on call"]).map((inc: string, i: number) => (
            <span key={i}><Check size={16} color="#16a34a" /> {inc}</span>
          ))}
        </div>
        <div>
          <h3>Exclusions</h3>
          {(item.exclusions || ["Flight tickets", "Personal shopping & gratuities"]).map((exc: string, i: number) => (
            <span key={i}><Minus size={16} color="#dc2626" /> {exc}</span>
          ))}
        </div>
      </div>
    ),
    "Terms & Guidelines": (
      <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px solid rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 12px" }}>Traveler Terms & Road Guidelines</h3>
        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13, color: "#555", lineHeight: 1.7 }}>
          {item.termsAndConditions || "1. Original Govt Photo ID (Aadhaar/Passport) mandatory for all travelers.\n2. Luggage allowance: 15kg per person.\n3. AC vehicle provided for all road transfers.\n4. Local host assistance available 24x7 during the journey."}
        </pre>
      </div>
    ),
    Gallery: (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {allPhotos.map((photo, i) => (
            <div
              key={i}
              onClick={() => setGalleryIndex(i)}
              style={{
                aspectRatio: "16/10",
                borderRadius: 12,
                overflow: "hidden",
                cursor: "pointer",
                position: "relative",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              <img src={photo} alt={`View ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }} />
              <span style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "white", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                Photo {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  } as Record<string, React.ReactNode>;

  return (
    <VoyagrShell title="ROUTE DETAIL">
      <div className="package-detail-page">
        <Link href="/explore" className="back-link"><ArrowLeft size={16} /> Back to route library</Link>
        <div className="package-detail-hero">
          <img src={item.image} alt={item.name} onError={handleImgError} />
          <div className="package-detail-overlay" />
          <div className="package-detail-title">
            <span>{item.tag || item.category}</span>
            <h1>{item.name}</h1>
            <p><MapPin size={15} /> {item.location}</p>
          </div>
        </div>

        <div className="sticky-detail-bar">
          <div>
            <span>{item.duration}</span>
            <strong>From {money(item.price)}</strong>
          </div>
          <Link href={`/checkout?packageId=${item.id}`} className="book-cta" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            Book this journey <ArrowRight size={17} />
          </Link>
        </div>

        <div className="detail-stat-strip">
          <span><CalendarDays size={17} /><b>{item.duration}</b><small>Duration</small></span>
          <span><UserRound size={17} /><b>{item.minGroupSize ?? 2}–{item.maxGroupSize ?? 25}</b><small>Group capacity</small></span>
          <span><ShieldCheck size={17} /><b>{item.transportClass || "Train 3A & AC Cab"}</b><small>Transport</small></span>
          <span><Wallet size={17} /><b>₹{(item.childPrice ?? Math.round(item.price * 0.5)).toLocaleString("en-IN")}</b><small>Child Fare (50%)</small></span>
        </div>

        <div className="detail-tabs-wide">
          {["Overview", "Itinerary", "Inclusions", "Terms & Guidelines", "Gallery"].map((entry) => (
            <button key={entry} className={tab === entry ? "active" : ""} onClick={() => setTab(entry)}>
              {entry} {entry === "Gallery" ? `(${allPhotos.length})` : ""}
            </button>
          ))}
        </div>

        <div className="detail-tab-content">{tabContent[tab]}</div>
      </div>

      {/* Lightbox Photo Carousel */}
      {galleryIndex !== null && (
        <div className="sheet-backdrop" onClick={() => setGalleryIndex(null)}>
          <section className="gallery-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 850, borderRadius: 20, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: "#183a37", color: "white" }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                {item.name} — Photo {galleryIndex + 1} of {allPhotos.length}
              </span>
              <button onClick={() => setGalleryIndex(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <img src={allPhotos[galleryIndex]} alt="Gallery" style={{ width: "100%", maxHeight: "65vh", objectFit: "contain", background: "#111" }} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", background: "#ffffff", alignItems: "center" }}>
              <button
                disabled={galleryIndex === 0}
                onClick={() => setGalleryIndex(Math.max(0, galleryIndex - 1))}
                style={{ padding: "8px 16px", background: "#f4f0e8", border: "none", borderRadius: 8, fontWeight: 700, cursor: galleryIndex === 0 ? "not-allowed" : "pointer" }}
              >
                ← Previous
              </button>
              <button
                disabled={galleryIndex === allPhotos.length - 1}
                onClick={() => setGalleryIndex(Math.min(allPhotos.length - 1, galleryIndex + 1))}
                style={{ padding: "8px 16px", background: "#183a37", color: "white", border: "none", borderRadius: 8, fontWeight: 700, cursor: galleryIndex === allPhotos.length - 1 ? "not-allowed" : "pointer" }}
              >
                Next Photo →
              </button>
            </div>
          </section>
        </div>
      )}
    </VoyagrShell>
  );
}

function DateSelector({ packageName, onClose }: { packageName: string; onClose: () => void }) { const [adults, setAdults] = useState(2); const [date, setDate] = useState("15 March 2026"); return <div className="sheet-backdrop" onClick={onClose}><section className="booking-sheet" onClick={(e) => e.stopPropagation()}><div className="sheet-handle" /><div className="sheet-header"><div><span className="admin-overline">START YOUR BOOKING</span><h3>Make it real.</h3></div><button className="close-button" onClick={onClose}><X size={18} /></button></div><p className="sheet-context">{packageName}</p><label>Departure date</label><div className="select-field"><CalendarDays size={17} /><select value={date} onChange={(e) => setDate(e.target.value)}><option>15 March 2026</option><option>09 April 2026</option><option>21 May 2026</option></select></div><label>Travelers</label><div className="counter-field"><span>Adults</span><div><button onClick={() => setAdults(Math.max(1, adults - 1))}><Minus size={15} /></button><b>{adults}</b><button onClick={() => setAdults(adults + 1)}><Plus size={15} /></button></div></div><div className="booking-summary"><span>Estimated total</span><strong>₹{(18999 * adults).toLocaleString("en-IN")}</strong></div><Link href="/checkout" className="book-cta" onClick={onClose}>Continue to traveler details <ArrowRight size={17} /></Link><button className="booking-note" onClick={() => window.location.assign("/support")}><MessageCircle size={15} /> Need help choosing a date?</button></section></div>; }

export function Booking() {
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  if (confirmed) {
    return (
      <VoyagrShell title="BOOKING">
        <div className="confirmation-page">
          <div className="confirmation-mark"><Check size={34} /></div>
          <span className="admin-overline">THE ROAD IS YOURS</span>
          <h1>Your journey<br /><i>is confirmed.</i></h1>
          <p>We've saved your booking and sent the details to your inbox. Your host will be in touch before you leave.</p>
          <div className="booking-confirm-card">
            <span>BOOKING ID</span>
            <strong>VYG-2026-08456</strong>
            <small>Goa, at your own pace · 15 Mar – 19 Mar 2026</small>
          </div>
          <div className="confirmation-actions">
            <Link href="/trips">Open My Trips <ArrowRight size={16} /></Link>
            <button onClick={() => notify("Your ticket download will be connected to the document service.")}>
              <Download size={16} /> Download ticket
            </button>
          </div>
        </div>
      </VoyagrShell>
    );
  }

  return (
    <VoyagrShell title="BOOKING">
      <div className="booking-page">
        <Link href="/explore" className="back-link"><ArrowLeft size={16} /> Back to routes</Link>
        <div className="booking-progress">
          <span className={step >= 1 ? "active" : ""}>01 Traveler details</span>
          <span className={step >= 2 ? "active" : ""}>02 Add-ons</span>
          <span className={step >= 3 ? "active" : ""}>03 Payment</span>
        </div>
        <div className="booking-layout">
          <section className="booking-form-panel">
            <span className="admin-overline">BOOKING / STEP 0{step}</span>
            <h1>{step === 1 ? "Who's coming along?" : step === 2 ? "Make it yours." : "Ready when you are."}</h1>
            {step === 1 && (
              <div className="form-grid">
                <label>Full name<input placeholder="As it appears on your ID" /></label>
                <label>Phone number<input placeholder="+91 00000 00000" /></label>
                <label className="full-span">Email address<input placeholder="you@example.com" /></label>
                <label className="full-span">Special notes<textarea placeholder="Anything your host should know?" /></label>
              </div>
            )}
            {step === 2 && (
              <div className="addon-list">
                <button className="addon-row">
                  <span><ShieldCheck size={19} /><b>Travel insurance</b><small>Coverage for the unexpected</small></span>
                  <strong>₹899</strong>
                </button>
                <button className="addon-row">
                  <span><Ticket size={19} /><b>Airport transfer</b><small>One less thing to think about</small></span>
                  <strong>₹1,200</strong>
                </button>
                <button className="addon-row">
                  <span><MessageCircle size={19} /><b>Private host call</b><small>30 minutes before departure</small></span>
                  <strong>Included</strong>
                </button>
              </div>
            )}
            {step === 3 && (
              <div className="payment-placeholder">
                <Wallet size={28} />
                <h3>Payment handoff</h3>
                <p>The payment gateway connects here. This prototype keeps the full summary visible before the handoff.</p>
                <div className="payment-method"><span>•••• 4242</span><b>VISA</b></div>
              </div>
            )}
            <button className="book-cta" onClick={() => (step < 3 ? setStep(step + 1) : setConfirmed(true))}>
              {step < 3 ? "Continue" : "Confirm booking"} <ArrowRight size={17} />
            </button>
          </section>
          <aside className="booking-summary-panel">
            <span className="admin-overline">YOUR JOURNEY</span>
            <h2>Goa, at your own pace</h2>
            <img src={voyageImages.goa} alt="Goa" />
            <div><span>15 Mar – 19 Mar 2026</span><strong>2 adults</strong></div>
            <hr />
            <div><span>Journey total</span><strong>₹37,998</strong></div>
            <small><ShieldCheck size={14} /> Your booking details are 100% protected by Har Har Mahadev Tours & Travels.</small>
          </aside>
        </div>
      </div>
    </VoyagrShell>
  );
}

export function Trips() {
  const [tab, setTab] = useState("UPCOMING");
  const [searchCode, setSearchCode] = useState("");
  const { profile, openAuth, locale } = useTravelSession();
  const [firebaseBookings, setFirebaseBookings] = useState<FirebaseBooking[]>([]);
  const [fbLoading, setFbLoading] = useState(true);
  const hindi = locale === "hi-IN";

  // Subscribe to Firebase bookings for this user
  useEffect(() => {
    if (!profile?.uid) {
      // Also check localStorage / cookie locked trip
      import("@/lib/sessionStorage").then(({ getLockedTripFromCookie }) => {
        const locked = getLockedTripFromCookie();
        if (locked) {
          import("@/lib/firebaseBookings").then(({ getBookingByCode }) => {
            getBookingByCode(locked.bookingCode).then((b) => {
              if (b) setFirebaseBookings([b]);
              setFbLoading(false);
            });
          });
        } else {
          setFbLoading(false);
        }
      });
      return;
    }
    setFbLoading(true);
    const unsub = subscribeToUserBookings(profile.uid, (bookings) => {
      setFirebaseBookings(bookings);
      setFbLoading(false);
    });
    return unsub;
  }, [profile?.uid]);

  const [, navigate] = useLocation();

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = searchCode.trim().toUpperCase();
    if (!code) return;
    setFbLoading(true);
    try {
      const { getBookingByCode } = await import("@/lib/firebaseBookings");
      const b = await getBookingByCode(code);
      if (b) {
        // Save for quick access next time
        try {
          const saved = JSON.parse(window.localStorage.getItem("voyagr-recent-bookings") ?? "[]") as string[];
          window.localStorage.setItem("voyagr-recent-bookings", JSON.stringify([code, ...saved.filter((c) => c !== code)].slice(0, 5)));
        } catch { /* ignore */ }
        // Redirect directly to the trip dashboard
        navigate(`/trip/${code}`);
      } else {
        toast.error(hindi ? "यह बुकिंग ID नहीं मिली।" : "Booking ID not found in database.");
      }
    } catch {
      toast.error(hindi ? "खोजने में त्रुटि हुई।" : "Could not search booking.");
    } finally {
      setFbLoading(false);
    }
  };

  const statusForTab: Record<string, string[]> = {
    UPCOMING: ["pending_approval", "confirmed", "awaiting_payment", "in_review"],
    ONGOING: ["on_trip", "documents_ready"],
    COMPLETED: ["completed"],
    CANCELLED: ["cancelled"],
  };

  const trips = firebaseBookings.filter((trip) => {
    const list = statusForTab[tab] || [];
    return list.includes(trip.status);
  });

  return (
    <VoyagrShell title={hindi ? "मेरी यात्राएं" : "MY TRIPS"}>
      <div className="platform-page" style={{ fontFamily: "'Manrope', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 30 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 900, color: "#f06a3a", letterSpacing: "0.12em" }}>
              🚩 {hindi ? "आपकी सभी पावन यात्राएं" : "PILGRIMAGE & YATRA DESK"}
            </span>
            <h1 style={{ margin: "6px 0 0", fontFamily: "'DM Serif Display', serif", fontSize: "clamp(34px, 5vw, 48px)", color: "#183a37" }}>
              {hindi ? "मेरी तीर्थ यात्राएं" : "My Booked Yatras"}
            </h1>
            <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>
              {hindi
                ? "सभी ई-पास, बुकिंग ID, सीट आवंटन व ड्राइवर संपर्क यहाँ देखें।"
                : "Manage your confirmed departure dates, allocated E-Pass, berths, and downloadable invoices."}
            </p>
          </div>

          {/* Quick Lookup by Booking Code */}
          <form onSubmit={handleManualSearch} style={{ display: "flex", gap: 8, background: "#fff", padding: 6, borderRadius: 12, border: "1px solid #ddd", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
            <input
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder={hindi ? "बुकिंग ID (e.g. VYG-...)" : "Enter Booking ID (VYG-...)"}
              style={{ border: "none", outline: "none", padding: "8px 12px", fontSize: 13, minWidth: 200 }}
            />
            <button
              type="submit"
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
              {hindi ? "खोजें" : "Find"}
            </button>
          </form>
        </div>

        {/* Tab Filters */}
        <div className="trip-tabs" style={{ display: "flex", gap: 10, borderBottom: "2px solid #eee", paddingBottom: 12, marginBottom: 24, overflowX: "auto" }}>
          {[
            ["UPCOMING", hindi ? "आगामी यात्राएं" : "Upcoming Trips"],
            ["ONGOING", hindi ? "लाइव सफर में" : "Live On Trip"],
            ["COMPLETED", hindi ? "सकुशल सम्पन्न" : "Completed Yatras"],
            ["CANCELLED", hindi ? "रद्द यात्राएं" : "Cancelled"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => setTab(key)}
              style={{
                padding: "8px 18px",
                borderRadius: 20,
                border: tab === key ? "none" : "1px solid #ddd",
                background: tab === key ? "#183a37" : "#ffffff",
                color: tab === key ? "#ffffff" : "#666",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {fbLoading ? (
          <div style={{ padding: "20px 0" }}>
            <TableSkeleton rows={3} />
          </div>
        ) : trips.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
            {trips.map((trip) => {
              const isApproved = trip.approvalStatus === "approved" || trip.status === "confirmed";
              const isCompleted = trip.status === "completed";
              const cleanDriverPhone = (trip.hostContact?.phone || "+919876543210").replace(/\D/g, "");

              return (
                <div
                  key={trip.bookingCode}
                  style={{
                    background: "#ffffff",
                    borderRadius: 20,
                    overflow: "hidden",
                    border: isCompleted ? "1.5px solid #86efac" : isApproved ? "1.5px solid #bbf7d0" : "1.5px solid #fde68a",
                    boxShadow: "0 10px 30px rgba(24,58,55,0.06)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Card Header Status */}
                  <div
                    style={{
                      padding: "12px 18px",
                      background: isCompleted ? "#f0fdf4" : isApproved ? "#ecfdf5" : "#fefce8",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#f06a3a", fontSize: 13 }}>
                      {trip.bookingCode}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "4px 10px",
                        borderRadius: 12,
                        background: isCompleted ? "#dcfce7" : isApproved ? "#d1fae5" : "#fef3c7",
                        color: isCompleted ? "#166534" : isApproved ? "#065f46" : "#92400e",
                      }}
                    >
                      {isCompleted
                        ? (hindi ? "🚩 यात्रा सकुशल सम्पन्न" : "🚩 Yatra Completed")
                        : isApproved
                          ? (hindi ? "🟢 कन्फर्म व वेरीफाइड" : "🟢 Confirmed & Verified")
                          : (hindi ? "🟡 वेरिफिकेशन पेंडिंग" : "🟡 Manual Review Pending")}
                    </span>
                  </div>

                  {/* Body Info */}
                  <div style={{ padding: "18px 20px", flex: 1 }}>
                    <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "#183a37", fontFamily: "'DM Serif Display', serif" }}>
                      {trip.packageName}
                    </h3>
                    <p style={{ margin: "0 0 12px", fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={13} style={{ color: "#f06a3a" }} /> {trip.packageLocation || "Sacred India Route"}
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, background: "#faf8f4", padding: 12, borderRadius: 12, marginBottom: 14 }}>
                      <div>
                        <small style={{ color: "#888", display: "block", fontSize: 10 }}>{hindi ? "प्रस्थान तिथि" : "Departure Date"}</small>
                        <strong style={{ fontSize: 12, color: "#183a37" }}>{trip.travelDate || "Scheduled 2026"}</strong>
                      </div>
                      <div>
                        <small style={{ color: "#888", display: "block", fontSize: 10 }}>{hindi ? "कुल यात्री" : "Travelers"}</small>
                        <strong style={{ fontSize: 12, color: "#183a37" }}>{trip.travelerCount || 2} Persons</strong>
                      </div>
                      {(trip as any).pnrNumber && (
                        <div>
                          <small style={{ color: "#888", display: "block", fontSize: 10 }}>E-Pass / Seat Allotment</small>
                          <strong style={{ fontSize: 12, color: "#f06a3a" }}>{(trip as any).pnrNumber}</strong>
                        </div>
                      )}
                      {(trip as any).seatNumbers && (
                        <div>
                          <small style={{ color: "#888", display: "block", fontSize: 10 }}>Seat / Berth</small>
                          <strong style={{ fontSize: 12, color: "#183a37" }}>{(trip as any).seatNumbers}</strong>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0ede6", paddingTop: 10 }}>
                      <span style={{ fontSize: 12, color: "#666" }}>{hindi ? "कुल राशि" : "Total Amount"}</span>
                      <strong style={{ fontSize: 16, color: "#183a37" }}>₹{(trip.grandTotal || 0).toLocaleString("en-IN")}</strong>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div style={{ padding: "12px 18px", background: "#fdfbf7", borderTop: "1px solid #f0ede6", display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <a
                      href={`/invoice/${trip.bookingCode}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "8px 12px",
                        background: "#183a37",
                        color: "#ffffff",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none",
                        textAlign: "center",
                      }}
                    >
                      <Download size={13} /> {hindi ? "ई-टिकट डाउनलोड" : "e-Ticket / Invoice"}
                    </a>

                    <a
                      href={`https://wa.me/${cleanDriverPhone}?text=Har%20Har%20Mahadev!%20Booking%20Code:%20${trip.bookingCode}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "8px 12px",
                        background: "#25D366",
                        color: "#ffffff",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                      title="Chat with Yatra Host on WhatsApp"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: "60px 20px", textAlign: "center", background: "#fbf9f4", borderRadius: 20 }}>
            <CalendarDays size={32} style={{ color: "#f06a3a", margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: 20, margin: "0 0 6px" }}>
              {hindi ? "इस श्रेणी में कोई यात्रा नहीं है" : "No journeys in this category"}
            </h3>
            <p style={{ color: "#666", fontSize: 13, margin: "0 0 16px" }}>
              {hindi ? "अपना नया तीर्थ यात्रा पैकेज बुक करें और दिव्य दर्शन पाएं।" : "Explore our curated sacred yatra packages and plan your spiritual journey."}
            </p>
            <Link
              href="/explore"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 20px",
                background: "#f06a3a",
                color: "white",
                borderRadius: 10,
                fontWeight: 800,
                textDecoration: "none",
                fontSize: 13,
              }}
            >
              {hindi ? "यात्रा पैकेज देखें" : "Explore Tour Packages"} <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </VoyagrShell>
  );
}


export function Account() {
  const quick = [
    [CalendarDays, "My trips", "/trips"],
    [Heart, "Saved routes", "/wishlist"],
    [MapPin, "Trip map", "/trips"],
    [Star, "Travel rewards", "/account"],
  ] as const;
  const links = [
    ["Booking ID access", "/access"],
    ["My trip desk", "/trips"],
    ["Invoices & documents", "/trips"],
    ["Notifications", "/notifications"],
    ["Saved routes", "/wishlist"],
    ["Customer support", "/support"],
  ] as const;
  const tiers = [
    ["EXPLORER", "₹0–24,999", "5%"],
    ["ADVENTURER", "₹25,000–99,999", "8%"],
    ["VOYAGER", "₹1,00,000–2,99,999", "12%"],
    ["ELITE", "₹3,00,000+", "15%"],
  ];
  const { profile, openAuth, signOut, locale, completeAuth } = useTravelSession();
  const hindi = locale === "hi-IN";
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);

  if (!profile) {
    return (
      <VoyagrShell title={hindi ? "यात्री प्रोफ़ाइल" : "TRAVELER PROFILE"}>
        <div className="account-page" style={{ maxWidth: 460, margin: "0 auto", padding: "20px 16px 80px" }}>
          <div style={{ background: "#ffffff", borderRadius: 24, padding: "28px 24px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff7ed", color: "#f06a3a", display: "grid", placeItems: "center", margin: "0 auto 12px", border: "1.5px solid #ffedd5" }}>
              <UserRound size={26} />
            </div>
            <span className="admin-overline" style={{ color: "#f06a3a" }}>
              {hindi ? "यात्री सुरक्षा व प्रोफ़ाइल" : "SECURE TRAVELER ACCESS"}
            </span>
            <h2 style={{ margin: "4px 0 8px", fontSize: 24, color: "#183a37", fontFamily: "'DM Serif Display', serif" }}>
              {hindi ? "यात्री प्रोफ़ाइल में लॉगिन करें" : "Sign In to Your Traveler Account"}
            </h2>
            <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5, margin: "0 0 20px" }}>
              {hindi
                ? "अपनी यात्रा बुकिंग, ई-पास, डिजिटल इनवॉइस और लाइव ट्रिप स्टेटस देखने के लिए लॉगिन करें।"
                : "Access your verified yatra bookings, e-passes, GST invoices, and live journey tracking."}
            </p>

            <button
              onClick={() => openAuth("account")}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #f06a3a, #e05320)",
                color: "#ffffff",
                border: "none",
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(240,106,58,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <span>⚡ {hindi ? "फास्ट-पास / साइन इन करें" : "Fast-Pass / Sign In Now"}</span>
              <ArrowRight size={16} />
            </button>

            <Link
              href="/access"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "11px 16px",
                background: "#f1f5f9",
                color: "#183a37",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 12,
                textDecoration: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <span>📋 {hindi ? "बुकिंग आईडी (Booking Code) से सीधे खोलें" : "Open with Booking Code directly"}</span>
            </Link>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9", fontSize: 11, color: "#94a3b8" }}>
              🛡️ Google Firebase 256-bit Encrypted Identity
            </div>
          </div>
        </div>
      </VoyagrShell>
    );
  }

  const initials =
    profile.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "V";

  const saveProfile = async () => {
    if (!name.trim()) { toast.error("Name cannot be empty."); return; }
    setSaving(true);
    try {
      if (profile.uid) {
        const { doc, updateDoc } = await import("firebase/firestore");
        const { firebaseDb, firebaseAuth } = await import("@/lib/firebase");
        const { updateProfile } = await import("firebase/auth");
        if (firebaseAuth?.currentUser) {
          await updateProfile(firebaseAuth.currentUser, { displayName: name });
        }
        if (firebaseDb) {
          await updateDoc(doc(firebaseDb, "travelerProfiles", profile.uid), {
            displayName: name,
            phone,
          });
        }
      }
      completeAuth({ ...profile, name, phone });
      setEditing(false);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <VoyagrShell title={hindi ? "यात्री प्रोफ़ाइल" : "TRAVELER PROFILE"}>
      <motion.div
        className="account-page"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ fontFamily: "'Manrope', sans-serif", maxWidth: 900, margin: "0 auto" }}
      >
        {/* Profile Card Header */}
        <div
          className="account-hero"
          style={{
            background: "linear-gradient(135deg, #183a37 0%, #0e2220 100%)",
            color: "#ffffff",
            padding: "32px 24px",
            borderRadius: 24,
            boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 20,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            className="account-avatar"
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f06a3a, #f39c12)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 900,
              boxShadow: "0 8px 24px rgba(240, 106, 58, 0.4)",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          <div style={{ flex: "1 1 240px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  color: "#4ade80",
                  letterSpacing: "0.14em",
                  background: "rgba(74, 222, 128, 0.15)",
                  padding: "3px 10px",
                  borderRadius: 20,
                  textTransform: "uppercase",
                }}
              >
                🚩 {profile.role === "super_admin" || profile.role === "admin" ? "ADMINISTRATOR" : "VERIFIED DEVOTEE"}
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                ID: {profile.uid ? profile.uid.slice(0, 12) : "Direct"}
              </span>
            </div>

            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    fontSize: 15,
                    outline: "none",
                  }}
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 00000 00000"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    style={{
                      padding: "6px 16px",
                      background: "#f06a3a",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {saving ? "सहेजा जा रहा है…" : "Save Changes"}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setName(profile.name); setPhone(profile.phone); }}
                    style={{
                      padding: "6px 14px",
                      background: "rgba(255,255,255,0.15)",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 style={{ margin: "6px 0 2px", fontSize: "clamp(22px, 4vw, 30px)", color: "#fffaf2", fontFamily: "'DM Serif Display', serif" }}>
                  {profile.name}
                </h1>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                  {profile.phone || "Phone not set"}{profile.email ? ` · ${profile.email}` : ""}
                </p>
                <button
                  onClick={() => { setName(profile.name); setPhone(profile.phone); setEditing(true); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#f39c12",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                    marginTop: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  ✏️ Edit profile details
                </button>
              </>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
            {(profile.role === "admin" || profile.role === "super_admin") && (
              <Link
                href="/admin"
                style={{
                  padding: "8px 16px",
                  background: "#f06a3a",
                  color: "#ffffff",
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 12,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 4px 12px rgba(240,106,58,0.3)",
                }}
              >
                ⚡ Admin Operations
              </Link>
            )}
            <button
              onClick={signOut}
              style={{
                padding: "8px 16px",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#fca5a5",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s",
              }}
            >
              <LogOut size={14} />
              <span>{hindi ? "लॉगआउट" : "Sign Out"}</span>
            </button>
          </div>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="quick-account-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, margin: "24px 0" }}>
          <Link
            href="/trips"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "18px 20px",
              background: "#ffffff",
              borderRadius: 18,
              border: "1px solid #e5e7eb",
              textDecoration: "none",
              color: "#183a37",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(240, 106, 58, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f06a3a", flexShrink: 0 }}>
              <CalendarDays size={22} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <strong style={{ fontSize: 14, fontWeight: 800 }}>{hindi ? "मेरी यात्राएं एवं ई-पास" : "My Bookings & Trips"}</strong>
              <small style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>{hindi ? "ई-पास, ड्राइवर व स्थिति" : "View E-Pass & Yatra status"}</small>
            </div>
            <ChevronRight size={16} style={{ marginLeft: "auto", color: "#9ca3af" }} />
          </Link>

          <Link
            href="/access"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "18px 20px",
              background: "#ffffff",
              borderRadius: 18,
              border: "1px solid #e5e7eb",
              textDecoration: "none",
              color: "#183a37",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(34, 197, 94, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", flexShrink: 0 }}>
              <Search size={22} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <strong style={{ fontSize: 14, fontWeight: 800 }}>{hindi ? "बुकिंग कोड से खोजें" : "Quick Booking Lookup"}</strong>
              <small style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>{hindi ? "VYG कोड दर्ज करें" : "Enter Booking ID / E-Pass Code"}</small>
            </div>
            <ChevronRight size={16} style={{ marginLeft: "auto", color: "#9ca3af" }} />
          </Link>

          <Link
            href="/support"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "18px 20px",
              background: "#ffffff",
              borderRadius: 18,
              border: "1px solid #e5e7eb",
              textDecoration: "none",
              color: "#183a37",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(59, 130, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", flexShrink: 0 }}>
              <ShieldCheck size={22} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <strong style={{ fontSize: 14, fontWeight: 800 }}>{hindi ? "24x7 तीर्थयात्री सहायता" : "Concierge & Help Desk"}</strong>
              <small style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>{hindi ? "लाइव चैट व सहायता टिकट" : "24x7 devotee yatra assistance"}</small>
            </div>
            <ChevronRight size={16} style={{ marginLeft: "auto", color: "#9ca3af" }} />
          </Link>
        </div>

        {/* Official WhatsApp Devotee Community Card */}
        <div
          className="loyalty-card"
          style={{
            background: "linear-gradient(135deg, #163630 0%, #0a1b18 100%)",
            color: "white",
            borderRadius: 20,
            padding: "26px 24px",
            margin: "24px 0",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <div>
            <span className="admin-overline" style={{ color: "#4ade80", fontSize: 11, letterSpacing: "0.14em" }}>
              🚩 OFFICIAL DEVOTEE COMMUNITY
            </span>
            <h2 style={{ color: "white", margin: "6px 0 8px", fontSize: "clamp(20px, 4vw, 24px)", fontFamily: "'DM Serif Display', serif" }}>
              हर हर महादेव तीर्थयात्री परिवार (Har Har Mahadev Yatra Group)
            </h2>
            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: 13, margin: "0 0 18px", lineHeight: 1.6, maxWidth: 580 }}>
              देश भर के साथी तीर्थयात्रियों से जुड़ें, आरती के समय, यात्रा मार्ग की लाइव अपडेट्स व पवित्र धामों के दर्शन फोटो साझा करें।
            </p>
            <a
              href="https://wa.me/919630642541?text=हर%20हर%20महादेव!%20मुझे%20आधिकारिक%20यात्री%20ग्रुप%20में%20जोड़ें।"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 22px",
                background: "#25D366",
                color: "white",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(37, 211, 102, 0.35)",
              }}
            >
              <MessageCircle size={18} />
              <span>WhatsApp परिवार से जुड़ें (निःशुल्क)</span>
            </a>
          </div>
        </div>

        {/* Preferences */}
        <div className="account-settings" style={{ background: "#ffffff", padding: "24px 20px", borderRadius: 20, border: "1px solid #e5e7eb", marginTop: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}>
          <span className="admin-overline" style={{ fontSize: 11, letterSpacing: "0.12em" }}>SYSTEM PREFERENCES</span>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}><span>Country</span><b>🇮🇳 India (भारत)</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}><span>Language</span><b>{locale === "hi-IN" ? "Hindi (हिंदी)" : "English"}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontSize: 13 }}><span>Currency</span><b>INR (₹ Indian Rupee)</b></div>
        </div>
      </motion.div>
    </VoyagrShell>
  );
}

export function Support() {
  const [open, setOpen] = useState<number | null>(0);
  const [subject, setSubject] = useState("Trip question");
  const [category, setCategory] = useState<"booking_help" | "payment_refund" | "route_customization" | "live_trip_issue" | "general_inquiry">("booking_help");
  const [message, setMessage] = useState("");
  const [bookingCodeInput, setBookingCodeInput] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [tickets, setTickets] = useState<Array<{
    id?: string;
    ticketCode: string;
    subject: string;
    status: string;
    lastMessageSnippet?: string;
  }>>([]);
  const [activeTicketChat, setActiveTicketChat] = useState<{ id: string; ticketCode: string; subject: string } | null>(null);
  const [threadMessages, setThreadMessages] = useState<Array<{ id?: string; senderName: string; senderRole: string; text: string }>>([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const { profile, openAuth } = useTravelSession();

  // Load user tickets from Firestore
  useEffect(() => {
    if (!profile?.uid) return;
    const userUid = profile.uid;
    let unsub = () => {};
    import("@/lib/firebaseSupport").then(({ subscribeToUserTickets }) => {
      unsub = subscribeToUserTickets(userUid, (tList) => {
        setTickets(tList);
      });
    });
    return () => unsub();
  }, [profile?.uid]);

  // Load thread messages when chat opened
  useEffect(() => {
    if (!activeTicketChat?.id) return;
    let unsub = () => {};
    import("@/lib/firebaseSupport").then(({ subscribeToTicketMessages }) => {
      unsub = subscribeToTicketMessages(activeTicketChat.id!, (mList) => {
        setThreadMessages(mList);
      });
    });
    return () => unsub();
  }, [activeTicketChat?.id]);

  const sendSupportRequest = async () => {
    if (!profile) {
      openAuth("account");
      return;
    }
    if (!message.trim()) {
      setStatus("Add a short message so the support team knows how to help.");
      return;
    }
    setSending(true);
    setStatus("");
    try {
      const { createSupportTicket } = await import("@/lib/firebaseSupport");
      const res = await createSupportTicket({
        userId: profile.uid || profile.email || "guest",
        userName: profile.name,
        userEmail: profile.email,
        userPhone: profile.phone,
        bookingCode: bookingCodeInput || undefined,
        category,
        subject,
        body: message,
      });
      setMessage("");
      setBookingCodeInput("");
      setStatus(`Support request ${res.ticketCode} is open in Firestore! Our team is on it.`);
      toast.success(`Request ${res.ticketCode} submitted!`);
    } catch {
      setStatus("We could not open the request. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const sendReply = async () => {
    if (!activeTicketChat?.id || !replyText.trim() || !profile) return;
    setSendingReply(true);
    try {
      const { sendTicketMessage } = await import("@/lib/firebaseSupport");
      await sendTicketMessage(activeTicketChat.id, {
        senderId: profile.uid || "traveler",
        senderName: profile.name,
        senderRole: "user",
        text: replyText.trim(),
      });
      setReplyText("");
    } catch {
      toast.error("Could not send reply.");
    } finally {
      setSendingReply(false);
    }
  };

  const faqs = [
    "What happens after I book?",
    "Can I change my departure date?",
    "What does a Har Har Mahadev tour host do?",
    "How do cancellations work?",
  ];

  return (
    <VoyagrShell title="SUPPORT">
      <div className="platform-page narrow-page">
        <PageIntro
          kicker="WE'RE HERE / 10"
          title={<>A good trip has<br /><i>someone behind it.</i></>}
          body="Ask a question, open a live support request, or reach our concierge team on WhatsApp."
        />

        <div className="support-actions">
          <button onClick={() => document.getElementById("support-request")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
            <MessageCircle size={20} />
            <span><b>Open secure support request</b><small>Linked to your protected traveler account</small></span>
            <ArrowRight size={16} />
          </button>
          <a href="https://wa.me/919630642541?text=हर%20हर%20महादेव!%20मैं%20सहायता%20चाहता%20हूँ।" target="_blank" rel="noreferrer">
            <Phone size={20} />
            <span><b>WhatsApp Support (Vijay Singh)</b><small>+91 96306 42541</small></span>
            <ArrowRight size={16} />
          </a>
          <a href="mailto:info@harharmahadevtours.com">
            <Send size={20} />
            <span><b>Support Email</b><small>info@harharmahadevtours.com</small></span>
            <ArrowRight size={16} />
          </a>
        </div>

        <section className="support-request-card" id="support-request">
          <span className="admin-overline">SECURE SUPPORT</span>
          <h2>Tell us what you need.</h2>
          <p>Your request enters the concierge live queue in Firestore. Track status and replies in real time below.</p>
          <label>
            Topic
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as typeof category);
                setSubject(e.target.selectedOptions[0].text);
              }}
            >
              <option value="booking_help">Booking Assistance</option>
              <option value="payment_refund">Payment, Invoice or Refund</option>
              <option value="route_customization">Custom Route Itinerary</option>
              <option value="live_trip_issue">Live Trip Support</option>
              <option value="general_inquiry">General Question</option>
            </select>
          </label>
          <label>
            Booking ID (optional)
            <input
              value={bookingCodeInput}
              onChange={(e) => setBookingCodeInput(e.target.value.toUpperCase())}
              placeholder="VYG-2026-XXXXX"
            />
          </label>
          <label>
            How can we help?
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 3000))}
              placeholder="Share the route details or question. Do not share payment card numbers."
            />
          </label>
          {status && <p className="support-request-status">{status}</p>}
          <button className="sheet-primary-action" disabled={sending} onClick={sendSupportRequest}>
            {sending ? "Sending securely…" : profile ? "Send secure request" : "Sign in to contact support"}
            <ArrowRight size={16} />
          </button>
        </section>

        {/* User open requests */}
        {profile && (
          <section className="support-request-card">
            <span className="admin-overline">YOUR OPEN REQUESTS</span>
            {tickets.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => t.id && setActiveTicketChat({ id: t.id, ticketCode: t.ticketCode, subject: t.subject })}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: "rgba(0,0,0,0.03)",
                      borderRadius: 10,
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                  >
                    <div>
                      <b style={{ fontFamily: "monospace", fontSize: 13, color: "var(--color-brand, #f06a3a)" }}>{t.ticketCode}</b>
                      <h4 style={{ margin: "2px 0 0", fontSize: 14 }}>{t.subject}</h4>
                      {t.lastMessageSnippet && <small style={{ opacity: 0.6 }}>{t.lastMessageSnippet}</small>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 20,
                          background: t.status === "resolved" ? "#e6f4f1" : "rgba(240,106,58,0.12)",
                          color: t.status === "resolved" ? "#2d7a6a" : "var(--color-brand, #f06a3a)",
                        }}
                      >
                        {t.status.replace("_", " ").toUpperCase()}
                      </span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ opacity: 0.6, fontSize: 14 }}>You have not opened a support request yet.</p>
            )}
          </section>
        )}

        {/* Ticket Live Chat Modal */}
        {activeTicketChat && (
          <div className="sheet-backdrop" onClick={() => setActiveTicketChat(null)}>
            <div
              className="ticket-chat-modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: 16,
                padding: 24,
                maxWidth: 520,
                width: "90%",
                margin: "auto",
                maxHeight: "80vh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <span className="admin-overline">{activeTicketChat.ticketCode}</span>
                  <h3 style={{ margin: 0 }}>{activeTicketChat.subject}</h3>
                </div>
                <button
                  onClick={() => setActiveTicketChat(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, margin: "16px 0", maxHeight: 300 }}>
                {threadMessages.length === 0 ? (
                  <p style={{ opacity: 0.5, fontSize: 13, textAlign: "center" }}>No messages yet in this thread.</p>
                ) : (
                  threadMessages.map((m, idx) => (
                    <div
                      key={m.id ?? idx}
                      style={{
                        alignSelf: m.senderRole === "user" ? "flex-end" : "flex-start",
                        background: m.senderRole === "user" ? "var(--color-brand, #f06a3a)" : "rgba(0,0,0,0.06)",
                        color: m.senderRole === "user" ? "white" : "inherit",
                        padding: "8px 14px",
                        borderRadius: 12,
                        maxWidth: "80%",
                        fontSize: 14,
                      }}
                    >
                      <small style={{ display: "block", fontSize: 10, opacity: 0.75, marginBottom: 2 }}>
                        {m.senderName} ({m.senderRole})
                      </small>
                      {m.text}
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  placeholder="Type a reply…"
                  style={{ flex: 1, padding: "10px 14px", border: "1.5px solid rgba(0,0,0,0.12)", borderRadius: 8, fontSize: 14 }}
                />
                <button
                  onClick={sendReply}
                  disabled={sendingReply || !replyText.trim()}
                  style={{ padding: "10px 16px", background: "var(--color-brand, #f06a3a)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="faq-list">
          <span className="admin-overline">COMMON QUESTIONS</span>
          {faqs.map((faq, index) => (
            <div key={faq}>
              <button onClick={() => setOpen(open === index ? null : index)}>
                <span>{faq}</span>
                <ChevronDown size={17} />
              </button>
              {open === index && (
                <p>We'll keep the details clear and help you make the next decision without pressure. Your host can also answer route-specific questions once a booking is confirmed.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </VoyagrShell>
  );
}

export function Wishlist() {
  const [named, setNamed] = useState("All saved");
  return (
    <VoyagrShell title="SAVED ROUTES">
      <div className="platform-page">
        <PageIntro
          kicker="YOUR SAVED PLACES / 08"
          title={<>Keep the good<br /><i>ideas close.</i></>}
          body="Save a route now. Decide when the time feels right."
        />
        <div className="wishlist-toolbar">
          <div>
            {["All saved", "Honeymoon ideas", "Family trips"].map((name) => (
              <button key={name} className={named === name ? "active" : ""} onClick={() => setNamed(name)}>
                {name}
              </button>
            ))}
          </div>
          <button onClick={() => notify("New named wishlist created.")}>
            <Plus size={15} /> New list
          </button>
        </div>
        <div className="wishlist-grid">
          {catalog.slice(0, 3).map((item) => (
            <article key={item.id} className="wishlist-card">
              <img src={item.image} alt={item.name} />
              <button onClick={() => notify("Removed from saved routes.")}>
                <Heart size={17} fill="currentColor" />
              </button>
              <div>
                <span>{item.category}</span>
                <h2>{item.name}</h2>
                <p>From {money(item.price)} / person</p>
                <Link href={`/package/${item.id}`}>View route <ArrowRight size={15} /></Link>
              </div>
            </article>
          ))}
        </div>
        <div className="wishlist-share">
          <div>
            <Send size={19} />
            <div>
              <strong>Share this list with your people.</strong>
              <span>Create a link for the group chat.</span>
            </div>
          </div>
          <button onClick={() => notify("Share link copied.")}>Copy link <ArrowRight size={15} /></button>
        </div>
      </div>
    </VoyagrShell>
  );
}

export function Notifications() {
  const [announcements, setAnnouncements] = useState<Array<{ id?: string; title: string; body: string; createdAt?: unknown }>>([
    {
      title: "Monsoon Season Early Access Live",
      body: "Coastal journeys and Western Ghat routes are now open for departures through August.",
    },
    {
      title: "WhatsApp Trip Concierge Enabled",
      body: "Your dedicated host number is now verified and available on all confirmed booking vouchers.",
    },
  ]);

  useEffect(() => {
    let unsub = () => {};
    import("@/lib/firebaseCampaigns").then(({ subscribeToActiveAnnouncements }) => {
      unsub = subscribeToActiveAnnouncements((list) => {
        if (list && list.length > 0) {
          setAnnouncements(list.map((a) => ({ id: a.id, title: a.title, body: a.body, createdAt: a.createdAt })));
        }
      });
    });
    return () => unsub();
  }, []);

  return (
    <VoyagrShell title="NOTIFICATIONS">
      <div className="platform-page narrow-page">
        <PageIntro
          kicker="YOUR INBOX / 09"
          title={<>A few notes<br /><i>from the road.</i></>}
          body="Real-time operator notices and trip updates appear here."
        />
        <div className="notification-list">
          {announcements.map((item, idx) => (
            <article className="unread" key={item.id ?? idx}>
              <div className="notification-icon"><Bell size={17} /></div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <small>Published recently</small>
              </div>
              <i />
            </article>
          ))}
        </div>
        <div className="notification-settings">
          <Bell size={18} />
          <div>
            <strong>In-app delivery</strong>
            <span>Notices are shown here as they are published in Firestore by the operations team.</span>
          </div>
        </div>
      </div>
    </VoyagrShell>
  );
}



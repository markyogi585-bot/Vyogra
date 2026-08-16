import { useState } from "react";
import { Compass, ExternalLink, MapPin, Navigation, Share2 } from "lucide-react";

interface RouteLocation {
  name: string;
  state: string;
  query: string;
  lat: number;
  lng: number;
  description: string;
}

const sacredLocations: RouteLocation[] = [
  {
    name: "Kedarnath Dham & Temple",
    state: "Uttarakhand",
    query: "Kedarnath+Temple+Uttarakhand",
    lat: 30.7352,
    lng: 79.0669,
    description: "Holistic 12 Jyotirlinga Dham nestled in Garhwal Himalayas (Elevation 3,583m)",
  },
  {
    name: "Kashi Vishwanath Corridor & Ghats",
    state: "Varanasi, UP",
    query: "Kashi+Vishwanath+Temple+Varanasi",
    lat: 25.3109,
    lng: 83.0107,
    description: "Sacred Ganges Ghats, Dashashwamedh Evening Aarti & Golden Temple corridor",
  },
  {
    name: "Badrinath Dham",
    state: "Chamoli, Uttarakhand",
    query: "Badrinath+Temple+Uttarakhand",
    lat: 30.7433,
    lng: 79.4938,
    description: "Char Dham sacred shrine of Lord Badri Vishal along Alaknanda river",
  },
  {
    name: "Shri Mahakaleshwar Jyotirlinga",
    state: "Ujjain, MP",
    query: "Mahakaleshwar+Jyotirlinga+Ujjain",
    lat: 23.1827,
    lng: 75.7682,
    description: "Dakshinmukhi Jyotirlinga known for world-famous early morning Bhasma Aarti",
  },
  {
    name: "Shri Ram Janmabhoomi Mandir",
    state: "Ayodhya, UP",
    query: "Shri+Ram+Janmabhoomi+Mandir+Ayodhya",
    lat: 26.7956,
    lng: 82.1944,
    description: "Divine grand temple of Lord Shri Ram on the banks of Saryu river",
  },
  {
    name: "Har Ki Pauri & Ganga Aarti",
    state: "Haridwar, Uttarakhand",
    query: "Har+Ki+Pauri+Haridwar",
    lat: 29.9565,
    lng: 78.1706,
    description: "Gateway to the Gods and holy holy dip at Brahmakund",
  },
  {
    name: "Somnath Jyotirlinga",
    state: "Veraval, Gujarat",
    query: "Somnath+Temple+Prabhas+Patan+Gujarat",
    lat: 20.8880,
    lng: 70.4012,
    description: "The first among the twelve holy Jyotirlinga shrines on the Arabian Sea coast",
  },
];

export function RouteMap({
  initialLocation,
  travelClass,
}: {
  initialLocation?: string;
  travelClass?: string;
}) {
  const [selected, setSelected] = useState<RouteLocation>(() => {
    if (initialLocation) {
      const match = sacredLocations.find((loc) =>
        loc.name.toLowerCase().includes(initialLocation.toLowerCase()) ||
        initialLocation.toLowerCase().includes(loc.name.toLowerCase())
      );
      if (match) return match;
    }
    return sacredLocations[0];
  });

  const mapEmbedUrl = `https://maps.google.com/maps?q=${selected.query}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  const directMapsUrl = `https://www.google.com/maps/search/?api=1&query=${selected.query}`;

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(24,58,55,0.08)",
        border: "1px solid rgba(24,58,55,0.08)",
        fontFamily: "'Manrope', sans-serif",
        margin: "18px 0 24px",
      }}
    >
      {/* Route Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #f0ede6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          background: "linear-gradient(135deg, #183a37 0%, #102624 100%)",
          color: "#ffffff",
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 900, color: "#f06a3a", letterSpacing: "0.1em" }}>
            <Compass size={14} /> LIVE PILGRIMAGE ROUTE & GOOGLE MAPS
          </div>
          <h3 style={{ margin: "4px 0 0", fontSize: 18, color: "#fffaf2", fontFamily: "'DM Serif Display', serif" }}>
            {selected.name}
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={12} style={{ color: "#f06a3a" }} /> {selected.state} · GPS: {selected.lat.toFixed(4)}° N, {selected.lng.toFixed(4)}° E
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a
            href={directMapsUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "#f06a3a",
              color: "#ffffff",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 4px 10px rgba(240,106,58,0.3)",
            }}
          >
            <Navigation size={13} /> Open in Google Maps <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Quick Dham Selector Pills */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 16px",
          background: "#faf8f4",
          borderBottom: "1px solid #eee",
          overflowX: "auto",
        }}
      >
        {sacredLocations.map((loc) => {
          const isActive = loc.name === selected.name;
          return (
            <button
              key={loc.name}
              onClick={() => setSelected(loc)}
              style={{
                flexShrink: 0,
                padding: "6px 12px",
                borderRadius: 20,
                border: isActive ? "1.5px solid #f06a3a" : "1px solid #ddd",
                background: isActive ? "#f06a3a" : "#ffffff",
                color: isActive ? "#ffffff" : "#183a37",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              🚩 {loc.name.split(" ")[0]} ({loc.state.split(",")[0]})
            </button>
          );
        })}
      </div>

      {/* Embedded Google Map */}
      <div style={{ position: "relative", width: "100%", height: 360, background: "#e5e7eb" }}>
        <iframe
          title={`Google Map - ${selected.name}`}
          src={mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0, display: "block" }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Route note footer */}
      <div style={{ padding: "12px 18px", background: "#fdfbf7", borderTop: "1px solid #f0ede6", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#666" }}>
        <span>ℹ️ {selected.description}</span>
        {travelClass && <strong style={{ color: "#183a37" }}>Vehicle / Travel: {travelClass}</strong>}
      </div>
    </div>
  );
}

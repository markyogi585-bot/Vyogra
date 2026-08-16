import { useEffect, useState } from "react";
import { Camera, Eye, MapPin, Sparkles, X } from "lucide-react";
import { subscribeToGallery, type GalleryPhoto, defaultGallery } from "@/lib/firebaseGallery";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import { handleImgError } from "@/lib/imageFallback";

export function DevoteePhotoGallery() {
  const { locale } = useTravelSession();
  const hindi = locale === "hi-IN";
  const [photos, setPhotos] = useState<GalleryPhoto[]>(defaultGallery);
  const [activePhoto, setActivePhoto] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    const unsub = subscribeToGallery((firestoreList) => {
      const merged = [...(firestoreList || []), ...defaultGallery].filter(
        (item, idx, self) => self.findIndex((s) => s.imageUrl === item.imageUrl) === idx,
      );
      setPhotos(merged.length > 0 ? merged : defaultGallery);
    });
    return () => unsub();
  }, []);

  return (
    <section className="home-explore-section" style={{ marginTop: 40, fontFamily: "'Manrope', sans-serif" }}>
      <div className="home-explore-heading">
        <div>
          <span style={{ color: "#f06a3a", fontWeight: 900, display: "inline-flex", alignItems: "center", gap: 6, letterSpacing: "0.12em" }}>
            <Camera size={14} /> {hindi ? "पावन दर्शन एवं यात्रा गैलरी" : "SACRED YATRA PHOTO GALLERY"}
          </span>
          <h2>
            {hindi ? (
              <>तीर्थ धामों के दिव्य दर्शन<br /><i>यात्रियों द्वारा साझा की गई तस्वीरें</i></>
            ) : (
              <>Devotee Yatra Moments<br /><i>Real photos from sacred dhams</i></>
            )}
          </h2>
        </div>
      </div>

      {/* Grid of Photos */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
          marginTop: 10,
        }}
      >
        {photos.slice(0, 6).map((item) => (
          <div
            key={item.id || item.imageUrl}
            onClick={() => setActivePhoto(item)}
            style={{
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
              aspectRatio: "1.3",
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(24,58,55,0.08)",
              transition: "transform 0.25s ease, box-shadow 0.25s ease",
            }}
            className="gallery-grid-card"
          >
            <img
              src={item.imageUrl}
              alt={item.title}
              onError={handleImgError}
              style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "16px 18px",
                color: "#ffffff",
              }}
            >
              <b style={{ fontSize: 15, marginBottom: 2 }}>{item.title}</b>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.85, display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={12} style={{ color: "#f06a3a" }} /> {item.location}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Popup */}
      {activePhoto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setActivePhoto(null)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: 900,
              width: "100%",
              background: "#183a37",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActivePhoto(null)}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                background: "rgba(0,0,0,0.6)",
                border: "none",
                color: "#ffffff",
                borderRadius: "50%",
                width: 36,
                height: 36,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              <X size={18} />
            </button>
            <img
              src={activePhoto.imageUrl}
              alt={activePhoto.title}
              style={{ width: "100%", maxHeight: "75vh", objectFit: "contain", background: "#000" }}
            />
            <div style={{ padding: "18px 24px", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontFamily: "'DM Serif Display', serif" }}>{activePhoto.title}</h3>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={13} style={{ color: "#f06a3a" }} /> {activePhoto.location}
                </p>
              </div>
              <span style={{ fontSize: 11, background: "rgba(240,106,58,0.2)", color: "#f06a3a", fontWeight: 800, padding: "4px 10px", borderRadius: 8 }}>
                🚩 HAR HAR MAHADEV DARSHAN
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

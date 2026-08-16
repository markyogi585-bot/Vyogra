import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Compass, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { subscribeToActiveBanners, type HeroBanner, defaultBanners } from "@/lib/firebaseBanners";
import { handleImgError } from "@/lib/imageFallback";

export function DynamicHeroSlider() {
  const [banners, setBanners] = useState<HeroBanner[]>(defaultBanners);
  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    const unsub = subscribeToActiveBanners((list) => {
      const valid = (list || []).filter(
        (b) =>
          b.imageUrl &&
          !b.imageUrl.includes("1512343879784") &&
          !b.imageUrl.includes("1524492412937")
      );
      setBanners(valid.length > 0 ? valid : defaultBanners);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const slide = banners[current] || banners[0] || defaultBanners[0];

  const getCleanImageUrl = (url?: string) => {
    if (!url || url.includes("1512343879784") || url.includes("1524492412937") || url.includes("1609766857329")) {
      return "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&auto=format&fit=crop&q=85";
    }
    return url;
  };

  const next = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className="hero-slider-container">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id ?? current}
          className="hero-slide"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <img src={getCleanImageUrl(slide.imageUrl)} alt={slide.title} className="hero-slide-bg" onError={handleImgError} />
          <div className="hero-slide-scrim" />

          <div className="hero-slide-content">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="hero-slide-badge"
            >
              <Sparkles size={13} />
              <span>{slide.badge}</span>
            </motion.div>

            <motion.h1
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="hero-slide-title"
            >
              {slide.title}
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="hero-slide-subtitle"
            >
              {slide.subtitle}
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="hero-slide-cta-row"
            >
              <Link href={slide.ctaLink || "/explore"} className="hero-primary-btn">
                <span>{slide.ctaText || "Explore Journey"}</span>
                <ArrowRight size={17} />
              </Link>
              <Link href="/explore" className="hero-secondary-btn">
                <Compass size={16} />
                <span>View All Routes</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button className="slider-arrow prev" onClick={prev} aria-label="Previous slide">
            <ChevronLeft size={20} />
          </button>
          <button className="slider-arrow next" onClick={next} aria-label="Next slide">
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {banners.length > 1 && (
        <div className="slider-indicators">
          {banners.map((b, idx) => (
            <button
              key={b.id ?? idx}
              className={`indicator-dot ${current === idx ? "active" : ""}`}
              onClick={() => {
                setAutoplay(false);
                setCurrent(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      <style>{`
        .hero-slider-container {
          position: relative;
          width: 100%;
          height: 520px;
          border-radius: 24px;
          overflow: hidden;
          margin-bottom: 32px;
          background: #111;
          box-shadow: 0 20px 50px rgba(0,0,0,0.18);
        }
        @media (max-width: 768px) {
          .hero-slider-container {
            height: 440px;
            border-radius: 16px;
          }
        }
        .hero-slide {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-end;
          padding: 48px;
        }
        @media (max-width: 768px) {
          .hero-slide {
            padding: 24px 20px;
          }
        }
        .hero-slide-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .hero-slide-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(0,0,0,0.15) 0%,
            rgba(0,0,0,0.45) 45%,
            rgba(0,0,0,0.85) 100%
          );
        }
        .hero-slide-content {
          position: relative;
          z-index: 2;
          max-width: 620px;
          color: white;
        }
        .hero-slide-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(10px);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 14px;
          border: 1px solid rgba(255,255,255,0.25);
        }
        .hero-slide-title {
          font-size: 42px;
          line-height: 1.1;
          font-weight: 800;
          margin: 0 0 12px;
          font-family: inherit;
          color: #ffffff;
          text-shadow: 0 2px 10px rgba(0,0,0,0.4);
        }
        @media (max-width: 768px) {
          .hero-slide-title { font-size: 28px; }
        }
        .hero-slide-subtitle {
          font-size: 16px;
          line-height: 1.5;
          opacity: 0.9;
          margin: 0 0 24px;
          color: #f0ede6;
        }
        @media (max-width: 768px) {
          .hero-slide-subtitle { font-size: 14px; margin-bottom: 18px; }
        }
        .hero-slide-cta-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .hero-primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 26px;
          background: var(--color-brand, #f06a3a);
          color: white;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          text-decoration: none;
          transition: transform 0.15s, background 0.15s;
          box-shadow: 0 8px 20px rgba(240,106,58,0.4);
        }
        .hero-primary-btn:hover {
          transform: translateY(-2px);
          background: #e25828;
        }
        .hero-secondary-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 22px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          text-decoration: none;
          transition: background 0.15s;
        }
        .hero-secondary-btn:hover {
          background: rgba(255,255,255,0.3);
        }
        .slider-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.22);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .slider-arrow:hover {
          background: rgba(255,255,255,0.4);
          transform: translateY(-50%) scale(1.08);
        }
        .slider-arrow.prev { left: 20px; }
        .slider-arrow.next { right: 20px; }
        @media (max-width: 768px) {
          .slider-arrow { display: none; }
        }
        .slider-indicators {
          position: absolute;
          bottom: 24px;
          right: 36px;
          z-index: 10;
          display: flex;
          gap: 8px;
          align-items: center;
        }
        @media (max-width: 768px) {
          .slider-indicators {
            right: 20px;
            bottom: 20px;
          }
        }
        .indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.4);
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          padding: 0;
        }
        .indicator-dot.active {
          width: 24px;
          background: var(--color-brand, #f06a3a);
        }
      `}</style>
    </div>
  );
}

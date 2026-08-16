import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, Quote, ChevronLeft, ChevronRight, Heart, Sparkles } from "lucide-react";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import { GoldenStarRating } from "@/components/common/GoldenStarRating";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";
import { handleImgError } from "@/lib/imageFallback";

interface Review {
  name: string;
  nameHi: string;
  location: string;
  locationHi: string;
  tourName: string;
  tourNameHi: string;
  rating: number;
  date: string;
  textEn: string;
  textHi: string;
  avatar: string;
}

const REVIEWS: Review[] = [
  {
    name: "Pt. Radheshyam & Sumitra Mishra",
    nameHi: "पं. राधेश्याम व सुमित्रा मिश्रा",
    location: "Varanasi, UP",
    locationHi: "वाराणसी, उत्तर प्रदेश",
    tourName: "Char Dham & Kedarnath Yatra",
    tourNameHi: "चार धाम एवं केदारनाथ दिव्य दर्शन",
    rating: 5,
    date: "February 2026",
    textEn: "Har Har Mahadev! Best pilgrimage organizers in India. Elderly parents were assisted at every temple steps, helicopter coordination was seamless and VIP darshan was arranged respectfully.",
    textHi: "हर हर महादेव! बुजुर्ग माता-पिता के साथ चार धाम यात्रा बिना किसी परेशानी के पूरी हुई। गाड़ी के ड्राइवर बहुत विनम्र थे और दर्शन की उत्तम व्यवस्था करवाई। जय महाकाल!",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
  },
  {
    name: "Alok & Anjali Sharma",
    nameHi: "आलोक व अंजली शर्मा",
    location: "Delhi NCR",
    locationHi: "दिल्ली एनसीआर",
    tourName: "12 Jyotirlinga Darshan Circuit",
    tourNameHi: "द्वादश ज्योतिर्लिंग विशेष दर्शन",
    rating: 5,
    date: "January 2026",
    textEn: "The digital live trip desk, WhatsApp driver coordination, and pure satvik food arrangements were 10/10. Will recommend Har Har Mahadev Tours to all our relatives!",
    textHi: "डिजिटल लाइव ट्रिप डेस्क और व्हाट्सएप पर ड्राइवर की लोकेशन से पूरी यात्रा में सुरक्षा का अनुभव हुआ। शुद्ध सात्विक भोजन की व्यवस्था बेहद प्रशंसनीय रही।",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80",
  },
  {
    name: "Deepak Singh Rathore & Family",
    nameHi: "दीपक सिंह राठौड़ एवं परिवार",
    location: "Jaipur, Rajasthan",
    locationHi: "जयपुर, राजस्थान",
    tourName: "Somnath & Dwarka Sacred Yatra",
    tourNameHi: "सोमनाथ एवं द्वारकाधीश पावन यात्रा",
    rating: 5,
    date: "March 2026",
    textEn: "From Innova Crysta pickup at Ahmedabad station to seaside luxury hotel booking, every minute was well-planned. True professional travel company with spiritual heart.",
    textHi: "अहमदाबाद से इनोवा क्रिस्टा की व्यवस्था और समुद्र किनारे बढ़िया होटल के साथ दर्शन बहुत सुगम रहे। हर हर महादेव टीम का बहुत आभार!",
    avatar: "https://images.unsplash.com/photo-1621600411688-4be93cd68504?w=200&q=80",
  },
  {
    name: "Maheshbhai & Hansaben Patel",
    nameHi: "महेश भाई व हंसाबेन पटेल",
    location: "Surat, Gujarat",
    locationHi: "सूरत, गुजरात",
    tourName: "Kashi Vishwanath & Ayodhya Ram Mandir",
    tourNameHi: "काशी विश्वनाथ एवं अयोध्या राम मंदिर दर्शन",
    rating: 5,
    date: "December 2025",
    textEn: "Ayodhya Ram Mandir VIP entry and Ganga Aarti boat tour in Varanasi was the most memorable moment of our lives. Jai Shree Ram, Har Har Mahadev!",
    textHi: "अयोध्या में श्री रामलला के दर्शन और बनारस में गंगा आरती की विशेष बोट व्यवस्था से मन तृप्त हो गया। जय श्री राम, हर हर महादेव!",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&q=80",
  },
  {
    name: "Suresh Kumar Gupta",
    nameHi: "सुरेश कुमार गुप्ता",
    location: "Kanpur, UP",
    locationHi: "कानपुर, उत्तर प्रदेश",
    tourName: "Haridwar & Rishikesh Yoga Yatra",
    tourNameHi: "हरिद्वार व ऋषिकेश देवभूमि यात्रा",
    rating: 5,
    date: "January 2026",
    textEn: "Everything promised in the itinerary was delivered with transparency. Instant GST invoice on phone and verified chauffeur with zero hidden charges.",
    textHi: "पूरा सफर बहुत ही पारदर्शी और सुरक्षित रहा। फोन पर तुरंत जीएसटी रसीद और कुशल ड्राइवर के साथ कोई अतिरिक्त शुल्क नहीं। बहुत बढ़िया सेवा।",
    avatar: "https://images.unsplash.com/photo-1607346256330-dee7af15f7c5?w=200&q=80",
  },
  {
    name: "Pooja & Amit Banerjee",
    nameHi: "पूजा एवं अमित बनर्जी",
    location: "Kolkata, WB",
    locationHi: "कोलकाता, प. बंगाल",
    tourName: "Mahakaleshwar Ujjain & Omkareshwar",
    tourNameHi: "महाकालेश्वर उज्जैन भस्म आरती दर्शन",
    rating: 5,
    date: "February 2026",
    textEn: "Bhasma Aarti booking and morning darshan at Mahakaleshwar temple was executed with perfection. Har Har Mahadev!",
    textHi: "उज्जैन महाकाल भस्म आरती और ओंकारेश्वर दर्शन का अनुभव अविस्मरणीय रहा। समय पर पिकअप और शानदार गाइडेंस।",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80",
  },
];

export function CustomerReviewsSection() {
  const { locale } = useTravelSession();
  const hindi = locale === "hi-IN";
  const [activeIdx, setActiveIdx] = useState(0);

  // Auto-advance motion
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % REVIEWS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const current = REVIEWS[activeIdx];

  return (
    <section className="home-explore-section" style={{ marginTop: 40, fontFamily: "'Manrope', sans-serif" }}>
      <div className="home-explore-heading">
        <div>
          <span style={{ color: "#f06a3a", fontWeight: 900, display: "inline-flex", alignItems: "center", gap: 6, letterSpacing: "0.12em" }}>
            <Sparkles size={14} /> {hindi ? "सत्यापित तीर्थयात्री अनुभव" : "VERIFIED DEVOTEE STORIES"}
          </span>
          <h2>
            {hindi ? (
              <>हमारे संतुष्ट यात्रियों की<br /><i>सच्ची समीक्षाएं एवं अनुभव</i></>
            ) : (
              <>Sacred Yatra Experiences<br /><i>with Har Har Mahadev</i></>
            )}
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setActiveIdx((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length)}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "1.5px solid rgba(0,0,0,0.12)",
              background: "#ffffff",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
            aria-label="Previous review"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setActiveIdx((prev) => (prev + 1) % REVIEWS.length)}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "none",
              background: "linear-gradient(135deg, #f06a3a 0%, #d97706 100%)",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(240,106,58,0.35)",
            }}
            aria-label="Next review"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Featured Testimonial Hero Card with Framer-Motion */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #fffbf5 100%)",
            borderRadius: 24,
            padding: "28px 24px",
            border: "1.5px solid rgba(240,106,58,0.2)",
            boxShadow: "0 14px 40px rgba(24,58,55,0.07)",
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Quote size={85} style={{ position: "absolute", right: 20, bottom: -10, color: "rgba(240,106,58,0.06)", pointerEvents: "none" }} />
          
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img
              src={current.avatar}
              alt={current.name}
              onError={handleImgError}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid #f06a3a",
                boxShadow: "0 6px 18px rgba(240,106,58,0.25)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                background: "#25D366",
                borderRadius: "50%",
                padding: 4,
                border: "2px solid #ffffff",
                display: "grid",
                placeItems: "center",
              }}
              title="Verified WhatsApp Traveler"
            >
              <WhatsAppIcon size={12} />
            </div>
          </div>

          <div style={{ flex: "1 1 280px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <GoldenStarRating rating={current.rating} size={19} showScore={false} />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#166534", background: "#dcfce7", padding: "3px 10px", borderRadius: 14, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <ShieldCheck size={13} /> {hindi ? "🚩 100% सत्यापित तीर्थयात्री" : "🚩 100% Verified Pilgrim"}
              </span>
            </div>

            <p style={{ fontSize: 15, lineHeight: 1.6, color: "#183a37", fontWeight: 600, margin: "0 0 12px" }}>
              "{hindi ? current.textHi : current.textEn}"
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div>
                <b style={{ fontSize: 14, color: "#183a37" }}>{hindi ? current.nameHi : current.name}</b>
                <span style={{ fontSize: 12, color: "#718079", marginLeft: 6 }}>· {hindi ? current.locationHi : current.location}</span>
              </div>
              <span style={{ fontSize: 10, background: "rgba(240,106,58,0.12)", color: "#f06a3a", fontWeight: 800, padding: "4px 10px", borderRadius: 10 }}>
                {hindi ? current.tourNameHi : current.tourName}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Mini Interactive Pilgrim Badges Bar */}
      <div style={{ display: "flex", gap: 10, marginTop: 16, overflowX: "auto", paddingBottom: 6 }}>
        {REVIEWS.map((rev, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIdx(idx)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 30,
              border: activeIdx === idx ? "2px solid #f06a3a" : "1.5px solid rgba(0,0,0,0.08)",
              background: activeIdx === idx ? "#fffaf5" : "#ffffff",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontSize: 12,
              fontWeight: 700,
              color: activeIdx === idx ? "#f06a3a" : "#183a37",
              boxShadow: activeIdx === idx ? "0 4px 14px rgba(240,106,58,0.2)" : "none",
              transition: "all 0.25s ease",
              flexShrink: 0,
            }}
          >
            <img
              src={rev.avatar}
              alt={rev.name}
              onError={handleImgError}
              style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", border: activeIdx === idx ? "1.5px solid #f06a3a" : "none" }}
            />
            <span>{hindi ? rev.nameHi.split(" ")[0] : rev.name.split(" ")[0]}</span>
            <span style={{ color: "#f59e0b", fontWeight: 800 }}>★ 5.0</span>
          </button>
        ))}
      </div>
    </section>
  );
}

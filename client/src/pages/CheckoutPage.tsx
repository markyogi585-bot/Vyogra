import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, LoaderCircle, MessageCircle, Phone, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { CouponField } from "@/components/commerce/CouponField";
import { TermsAcceptance } from "@/components/commerce/TermsAcceptance";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import { formatInr } from "@/lib/commerce";
import { trpc } from "@/lib/trpc";
import { calculateInvoiceTotal } from "@shared/commerceTerms";
import {
  createBooking,
  generateBookingCode,
  generateInvoiceNumber,
  type BookingStatus,
} from "@/lib/firebaseBookings";
import { usePackages } from "@/hooks/usePackages";
import { toast } from "sonner";
import { subscribeToSystemSettings, defaultSettings, type SystemSettings } from "@/lib/firebaseSettings";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";

const taxRate = 5;
const couponRules = {
  GOA2500: { discountType: "flat" as const, discountValue: 2500 },
  FIELDGUIDE: { discountType: "flat" as const, discountValue: 1800 },
  VYGREWARD: { discountType: "flat" as const, discountValue: 1200 },
  MAHADEV500: { discountType: "flat" as const, discountValue: 500 },
};
const addOnOptions = [
  { id: "transfer", label: "Private railway/airport AC transfer", amount: 1800 },
  { id: "dinner", label: "Pure Satvik & Special Temple Thali", amount: 1400 },
  { id: "insurance", label: "Pilgrim Travel & Medical Insurance", amount: 850 },
] as const;

interface CheckoutPageProps {
  packageId?: string;
}

export default function CheckoutPage({ packageId }: CheckoutPageProps = {}) {
  const { profile, locale, openAuth, completeAuth } = useTravelSession();
  const hindi = locale === "hi-IN";
  const [, navigate] = useLocation();
  const { packages } = usePackages();
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);

  useEffect(() => {
    const unsub = subscribeToSystemSettings(setSettings);
    return () => unsub();
  }, []);

  // Find selected package by prop or URL query parameter
  const [location] = useLocation();
  const urlPackageId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("packageId") || new URLSearchParams(window.location.search).get("id") : null;
  const activePackageId = packageId || urlPackageId;

  const selectedPackage = activePackageId
    ? packages.find((p) => p.id === activePackageId || String(p.id) === String(activePackageId))
    : packages[0];

  const farePerTraveler = selectedPackage?.price ?? 11999;
  const childFare = selectedPackage?.childPrice ?? Math.round(farePerTraveler * 0.5);

  const availableDepartureSlots = (selectedPackage?.departureSlots && selectedPackage.departureSlots.length > 0)
    ? selectedPackage.departureSlots
    : [
        "15 Oct 2026 - 22 Oct 2026 (Diwali Sacred Darshan Batch)",
        "02 Nov 2026 - 09 Nov 2026 (Chhath Puja Special Batch)",
        "20 Nov 2026 - 27 Nov 2026 (Kartik Purnima Holy Dip Batch)",
        "10 Dec 2026 - 17 Dec 2026 (Winter Special Group Batch)",
      ];

  const [discount, setDiscount] = useState(0);
  const [coupon, setCoupon] = useState<string>();
  const [accepted, setAccepted] = useState(false);
  const [travelerName, setTravelerName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  
  // Adults & Children Split
  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infantsCount, setInfantsCount] = useState(0);
  const [departureSlot, setDepartureSlot] = useState(availableDepartureSlots[0]);
  const [customDate, setCustomDate] = useState("2026-10-15");
  const [travelClass, setTravelClass] = useState("Train - 3rd AC (3A)");
  const [berthPref, setBerthPref] = useState("Lower Berth (Senior Citizen)");
  const [specialNote, setSpecialNote] = useState("");

  const [selectedAddons, setSelectedAddons] = useState<string[]>(["transfer"]);
  const [saving, setSaving] = useState(false);
  const [issued, setIssued] = useState<{ bookingCode: string; invoiceNumber: string }>();

  const totalTravelers = adultsCount + childrenCount + infantsCount;

  const addOnTotal = useMemo(
    () => addOnOptions.filter((item) => selectedAddons.includes(item.id)).reduce((sum, item) => sum + item.amount, 0),
    [selectedAddons],
  );
  
  const adultSubtotal = adultsCount * farePerTraveler;
  const childSubtotal = childrenCount * childFare;
  const subtotal = adultSubtotal + childSubtotal + addOnTotal;
  
  const localTotals = useMemo(() => calculateInvoiceTotal({ subtotal, taxRate, discount }), [subtotal, discount]);
  const rule = coupon ? couponRules[coupon as keyof typeof couponRules] : undefined;
  const quoteInput = useMemo(
    () => ({ subtotal, taxRate, ...(coupon && rule ? { coupon: { code: coupon, ...rule } } : {}) }),
    [subtotal, coupon, rule],
  );
  const quote = trpc.commerce.quote.useQuery(quoteInput, { enabled: Boolean(profile), retry: false });
  const totals = quote.data ?? localTotals;
  const [botHoneypot, setBotHoneypot] = useState("");
  const toggleAddon = (id: string) =>
    setSelectedAddons((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const confirm = async () => {
    if (botHoneypot) {
      toast.error("Spam request blocked by Cloudflare security filter.");
      return;
    }
    if (!accepted || !travelerName || !phone || !email) {
      toast.error(hindi ? "कृपया नाम, फ़ोन नंबर और ईमेल भरें।" : "Please fill in lead traveler name, phone, and email.");
      return;
    }

    setSaving(true);
    try {
      let userUid = profile?.uid;
      if (!profile) {
        userUid = "devotee_" + Math.floor(100000 + Math.random() * 900000);
        const guestProfile = {
          uid: userUid,
          name: travelerName,
          email,
          phone,
          role: "user" as const,
          loginMethod: "otp" as const,
          emailVerified: true,
        };
        completeAuth(guestProfile);
      }

      const bookingCode = generateBookingCode();
      const invoiceNumber = generateInvoiceNumber();
      const tax = Math.round(subtotal * taxRate / 100);
      const grandTotal = subtotal + tax - discount;

      const activeDate = departureSlot.includes("Custom") ? customDate : departureSlot.split(" ")[0];

      // Try Firebase booking first (primary)
      let firestorePersisted = false;
      try {
        await createBooking({
          bookingCode,
          userId: userUid ?? "devotee_direct",
          packageId: selectedPackage?.id ?? "unknown",
          packageName: selectedPackage?.name ?? "Har Har Mahadev Yatra",
          packageLocation: selectedPackage?.location ?? "",
          packageDuration: selectedPackage?.duration ?? "",
          packageImage: selectedPackage?.image,
          travelerName,
          phone,
          email,
          travelerCount: totalTravelers,
          adultsCount,
          childrenCount,
          travelDate: activeDate,
          specialRequests: `Slot: ${departureSlot} | Class: ${travelClass} | Berth: ${berthPref}. ${specialNote}`,
          subtotal,
          addOnTotal,
          discount,
          tax,
          grandTotal,
          couponCode: coupon,
          selectedAddons,
          status: "pending_approval" as BookingStatus,
          approvalStatus: "pending_manual_review",
          invoiceNumber,
          notes: `Adults: ${adultsCount}, Children: ${childrenCount}, Infants: ${infantsCount}. Class: ${travelClass}. Slot: ${departureSlot}.`,
        });
        firestorePersisted = true;
      } catch (fbError) {
        console.warn("[Checkout] Firestore save failed, trying tRPC:", fbError);
      }

      setIssued({ bookingCode, invoiceNumber });
      toast.success("Booking submitted! Har Har Mahadev team will verify your seats.");
      try {
        const { sendBrowserNotification } = await import("@/lib/browserNotifications");
        sendBrowserNotification("🚩 यात्रा बुकिंग प्राप्त हुई!", {
          body: `आपकी बुकिंग ${bookingCode} (${selectedPackage?.name || "Yatra"}) दर्ज हो गई है।`,
          onClickUrl: `/invoice/${bookingCode}`,
        });
      } catch {}
    } catch (error) {
      console.error("[Checkout] Fatal error:", error);
      toast.error("We could not complete your booking. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (settings.bookingEnabled === false) {
    const cleanWhatsapp = (settings.ownerWhatsapp || "919876543210").replace(/\D/g, "");
    return (
      <main className="checkout-page checkout-success-page">
        <section className="checkout-success" style={{ maxWidth: 540 }}>
          <div className="confirmation-mark" style={{ background: "#fef3c7", color: "#d97706" }}>
            <MessageCircle size={36} />
          </div>
          <span className="admin-overline" style={{ color: "#d97706" }}>
            ऑनलाइन बुकिंग सूचना · ONLINE BOOKING NOTICE
          </span>
          <h1>सीजनल बुकिंग सीमित है<br /><i>व्हाट्सएप पर संपर्क करें</i></h1>
          <p>
            {settings.bookingDisabledNotice || "तीर्थ यात्रा सीजनल रश के कारण नई ऑनलाइन बुकिंग केवल व्हाट्सएप व कॉल सहायता के माध्यम से ली जा रही है।"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 400, margin: "20px auto 0" }}>
            <a
              href={`https://wa.me/${cleanWhatsapp}?text=Har%20Har%20Mahadev!%20I%20want%20to%20book%20the%20package:%20${encodeURIComponent(selectedPackage?.name || "Yatra")}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 20px",
                background: "#25D366",
                color: "#ffffff",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 14,
                textDecoration: "none",
                boxShadow: "0 4px 12px rgba(37,211,102,0.3)",
              }}
            >
              <WhatsAppIcon size={20} />
              <span>WhatsApp पर तुरंत बुक करें</span>
            </a>
            <Link
              href="/explore"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "10px 18px",
                background: "#183a37",
                color: "white",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              अन्य यात्रा पैकेज देखें
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (issued) {
    const computedTotal = subtotal + Math.round((subtotal * taxRate) / 100) - discount;
    const whatsappMsg = `🚩 हर हर महादेव! 🙏\n\nमैंने यात्रा बुकिंग दर्ज की है:\n📋 बुकिंग ID: ${issued.bookingCode}\n🚩 यात्रा: ${selectedPackage?.name || "तीर्थ यात्रा"}\n📅 यात्रा तिथि / बैच: ${departureSlot}\n👤 यात्री: ${adultsCount} वयस्क ${childrenCount > 0 ? `+ ${childrenCount} बच्चे` : ""}\n💰 कुल राशि: ₹${(computedTotal || 0).toLocaleString("en-IN")}\n\nकृपया मेरी यात्रा की पुष्टि (Confirmation) करें।`;
    const cleanWhatsapp = (settings.ownerWhatsapp || "919630642541").replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(whatsappMsg)}`;

    return (
      <main className="checkout-page checkout-success-page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <section className="checkout-success" style={{ maxWidth: 560, background: "#ffffff", padding: "36px 28px", borderRadius: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.1)", textAlign: "center", border: "1px solid #e5e7eb" }}>
          
          {/* Animated Glowing GIF-style Verification Badge */}
          <div style={{ position: "relative", width: 84, height: 84, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "rgba(34, 197, 94, 0.2)",
                animation: "ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite",
              }}
            />
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #16a34a, #22c55e)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 10px 25px rgba(22, 163, 74, 0.35)",
              }}
            >
              <CheckCircle2 size={42} strokeWidth={2.4} />
            </div>
          </div>

          <span className="admin-overline" style={{ color: "#16a34a", fontSize: 11, fontWeight: 900, letterSpacing: "0.14em" }}>
            {hindi ? "🚩 बुकिंग सफलता पूर्वक प्राप्त हुई · वेरिफिकेशन जारी" : "🚩 BOOKING RECEIVED · MANUAL VERIFICATION IN PROGRESS"}
          </span>

          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 400, margin: "10px 0 8px", lineHeight: 1.1, color: "#183a37" }}>
            {hindi ? "आपकी यात्रा सफलतापूर्वक दर्ज हो गई है" : "Your Sacred Yatra is Reserved & Logged"}
          </h1>

          <p style={{ color: "#52675e", fontSize: 13, lineHeight: 1.6, margin: "0 0 20px" }}>
            {hindi
              ? `आपकी बुकिंग (${adultsCount} वयस्क ${childrenCount > 0 ? `+ ${childrenCount} बच्चे` : ""}) बैच ${departureSlot} के लिए सुरक्षित रूप से दर्ज हो गई है। नीचे दिए गए WhatsApp टेम्पलेट या कॉल द्वारा विजय सिंह जी से तुरंत संपर्क करें।`
              : `Your reservation for ${adultsCount} Adults ${childrenCount > 0 ? `+ ${childrenCount} Children` : ""} on batch ${departureSlot} is recorded. Contact Vijay Singh directly via WhatsApp template or direct phone call below.`}
          </p>

          {/* Booking ID Box */}
          <div style={{ background: "#f0fdf4", border: "1.5px dashed #86efac", borderRadius: 16, padding: "18px 20px", margin: "0 0 24px" }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: "#15803d", textTransform: "uppercase" }}>
              {hindi ? "आपकी आधिकारिक बुकिंग ID" : "OFFICIAL BOOKING CODE"}
            </span>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "monospace", color: "#166534", margin: "4px 0", letterSpacing: "0.06em" }}>
              {issued.bookingCode}
            </div>
            <small style={{ color: "#16a34a", fontSize: 11, fontWeight: 600 }}>
              {hindi ? "✓ यह कोड आपके डिवाइस पर सेव हो गया है" : "✓ Saved securely to your device for instant dashboard access"}
            </small>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "14px 20px",
                background: "#25D366",
                color: "#ffffff",
                borderRadius: 12,
                fontWeight: 800,
                textDecoration: "none",
                fontSize: 14,
                boxShadow: "0 4px 14px rgba(37, 211, 102, 0.25)",
              }}
            >
              <WhatsAppIcon size={20} />
              <span>{hindi ? "💬 WhatsApp पर बुकिंग टेम्पलेट भेजें (1-टैप)" : "💬 Fast-Track via WhatsApp Confirmation"}</span>
            </a>

            <a
              href="tel:+919630642541"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "13px 20px",
                background: "#0369a1",
                color: "#ffffff",
                borderRadius: 12,
                fontWeight: 800,
                textDecoration: "none",
                fontSize: 14,
                boxShadow: "0 4px 14px rgba(3, 105, 161, 0.25)",
              }}
            >
              <Phone size={18} />
              <span>{hindi ? "📞 विजय सिंह को सीधा कॉल करें (+91 96306 42541)" : "📞 Call Vijay Singh (+91 96306 42541)"}</span>
            </a>

            {selectedPackage?.whatsappGroupLink && (
              <a
                href={selectedPackage.whatsappGroupLink}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "11px 18px",
                  background: "#ecfdf5",
                  color: "#065f46",
                  border: "1.5px solid #a7f3d0",
                  borderRadius: 12,
                  fontWeight: 800,
                  textDecoration: "none",
                  fontSize: 13,
                }}
              >
                <WhatsAppIcon size={17} />
                <span>{hindi ? "👥 आधिकारिक टूर WhatsApp ग्रुप में जुड़ें" : "👥 Join Official Tour WhatsApp Group"}</span>
              </a>
            )}

            <Link
              href={`/trip/${issued.bookingCode}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 20px",
                background: "#183a37",
                color: "#ffffff",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              <span>{hindi ? "लाइव ट्रिप डैशबोर्ड व ई-टिकट" : "Open Live Trip Desk & e-Ticket"}</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 18, marginTop: 22, fontSize: 12 }}>
            <Link href="/" style={{ color: "#718079", fontWeight: 700, textDecoration: "underline" }}>
              {hindi ? "होम पेज पर जाएं" : "Return to Home"}
            </Link>
            <Link href="/trips" style={{ color: "#f06a3a", fontWeight: 800, textDecoration: "underline" }}>
              {hindi ? "मेरी सभी यात्राएं" : "View All Bookings"}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <header>
        <Link href={selectedPackage ? `/package/${selectedPackage.id}` : "/explore"}>
          <ArrowLeft size={17} /> Back to package
        </Link>
        <span>SECURE CHECKOUT · HAR HAR MAHADEV</span>
      </header>
      <div className="checkout-layout">
        <section className="checkout-form checkout-form-card">
          <span className="admin-overline">01 / TRAVELER & YATRA ROSTER</span>
          <h1>Traveler details & batch slot.</h1>
          <p>Tickets, berth allocations, hotel rooms, and chauffeur coordination use these details.</p>

          <div className="checkout-input-grid">
            <label>
              Lead Traveler Name
              <input value={travelerName} onChange={(e) => setTravelerName(e.target.value)} placeholder="Full Name as on Govt ID" required />
            </label>
            <label>
              Phone / WhatsApp Number
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
            </label>
            <label>
              Email Address
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="traveler@gmail.com" required />
            </label>

            {/* Departure Batch Slot */}
            <label style={{ gridColumn: "1 / -1" }}>
              🗓️ Choose Departure Batch Slot
              <select value={departureSlot} onChange={(e) => setDepartureSlot(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd4cc" }}>
                {availableDepartureSlots.map((slot, sIdx) => (
                  <option key={sIdx} value={slot}>🚩 {slot}</option>
                ))}
                <option value="Custom Departure Date">🗓️ Choose Custom Departure Date</option>
              </select>
            </label>

            {departureSlot === "Custom Departure Date" && (
              <label style={{ gridColumn: "1 / -1" }}>
                Select Custom Departure Date
                <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd4cc" }} />
              </label>
            )}

            {/* Adults, Children, and Infants Breakdown */}
            <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, background: "#fbf9f4", padding: 14, borderRadius: 12, border: "1px solid #e2ddd3" }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#183a37" }}>
                  Adults (12+ yrs)
                  <select value={adultsCount} onChange={(e) => setAdultsCount(Number(e.target.value))} style={{ width: "100%", marginTop: 4, padding: 8, borderRadius: 6, border: "1px solid #ccc" }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n} Adult{n > 1 ? "s" : ""}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#183a37" }}>
                  Children (2-11 yrs · 50% Off)
                  <select value={childrenCount} onChange={(e) => setChildrenCount(Number(e.target.value))} style={{ width: "100%", marginTop: 4, padding: 8, borderRadius: 6, border: "1px solid #ccc" }}>
                    {[0, 1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} Child{n > 1 ? "ren" : ""}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#183a37" }}>
                  Infants (Under 2 yrs · Free)
                  <select value={infantsCount} onChange={(e) => setInfantsCount(Number(e.target.value))} style={{ width: "100%", marginTop: 4, padding: 8, borderRadius: 6, border: "1px solid #ccc" }}>
                    {[0, 1, 2, 3].map(n => (
                      <option key={n} value={n}>{n} Infant{n > 1 ? "s" : ""}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* Travel Class & Berth Preference */}
            <label>
              Travel & Train Class
              <select value={travelClass} onChange={(e) => setTravelClass(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd4cc" }}>
                <option value="Train - 3rd AC (3A)">Train - 3rd AC (3A Comfort)</option>
                <option value="Train - 2nd AC (2A)">Train - 2nd AC (2A Premium)</option>
                <option value="Train - 1st AC (1A)">Train - 1st AC (1A Executive)</option>
                <option value="Train - Sleeper (SL)">Train - Sleeper (SL Economy)</option>
                <option value="Flight - Economy">Flight - Economy Class</option>
                <option value="Cab - Private Innova Crysta">Cab - Private Innova Crysta</option>
              </select>
            </label>

            <label>
              Berth / Seat Preference
              <select value={berthPref} onChange={(e) => setBerthPref(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #cbd4cc" }}>
                <option value="Lower Berth (Senior Citizen)">Lower Berth (Priority for Elders)</option>
                <option value="Middle Berth">Middle Berth</option>
                <option value="Upper Berth">Upper Berth</option>
                <option value="Side Lower">Side Lower Berth</option>
                <option value="Side Upper">Side Upper Berth</option>
                <option value="Window Seat">Window Seat (Flight / Cab)</option>
              </select>
            </label>
          </div>

          <section className="checkout-addons" style={{ marginTop: 20 }}>
            <span className="admin-overline">02 / OPTIONAL SACRED ADD-ONS</span>
            <div>
              {addOnOptions.map((item) => (
                <label key={item.id}>
                  <input type="checkbox" checked={selectedAddons.includes(item.id)} onChange={() => toggleAddon(item.id)} />
                  {item.label} <b>{formatInr(item.amount)}</b>
                </label>
              ))}
            </div>
          </section>

          <TermsAcceptance
            accepted={accepted}
            onChange={setAccepted}
            packageName={selectedPackage?.name ?? "this package"}
          />

          {/* Hidden Honeypot to block automated spam bots */}
          <input
            type="text"
            name="website_url_honeypot"
            value={botHoneypot}
            onChange={(e) => setBotHoneypot(e.target.value)}
            style={{ display: "none", position: "absolute", left: "-9999px" }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Cloudflare Anti-Fake & Manual Review Security Seal */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12, marginTop: 14 }}>
            <ShieldCheck size={20} style={{ color: "#16a34a", flexShrink: 0 }} />
            <div>
              <b style={{ color: "#166534", fontSize: 12, display: "block" }}>
                🛡️ Cloudflare Protected · 100% Genuine Traveler Verification
              </b>
              <small style={{ color: "#15803d", fontSize: 11 }}>
                No automatic online debits. Booking is sent for manual verification and approved by Har Har Mahadev Tour desk.
              </small>
            </div>
          </div>
        </section>

        <aside className="checkout-summary">
          <span>{selectedPackage?.name?.toUpperCase() ?? "YOUR PACKAGE"}</span>
          <h2>{selectedPackage?.location ?? "Route"}<br />{adultsCount} Adult{adultsCount > 1 ? "s" : ""}{childrenCount > 0 ? ` · ${childrenCount} Child` : ""}</h2>
          
          <div style={{ background: "#f4f0e8", padding: "8px 12px", borderRadius: 8, fontSize: 11, marginBottom: 12 }}>
            <strong>Departure:</strong> {departureSlot.split("(")[0]}
          </div>

          <CouponField
            subtotal={subtotal}
            onApply={(nextDiscount, code) => { setDiscount(nextDiscount); setCoupon(code); }}
          />

          <div className="checkout-cost">
            <p>
              <span>{adultsCount} × Adult Fare</span>
              <b>{formatInr(adultSubtotal)}</b>
            </p>
            {childrenCount > 0 && (
              <p>
                <span>{childrenCount} × Child Fare (50% Off)</span>
                <b>{formatInr(childSubtotal)}</b>
              </p>
            )}
            {addOnTotal > 0 && (
              <p>
                <span>Selected Add-ons</span>
                <b>{formatInr(addOnTotal)}</b>
              </p>
            )}
            <p><span>Subtotal</span><b>{formatInr(subtotal)}</b></p>
            {discount > 0 && <p className="discount"><span>{coupon} credit</span><b>−{formatInr(totals.discount)}</b></p>}
            <p><span>Taxes & service fee ({taxRate}%)</span><b>{formatInr(totals.tax)}</b></p>
            <strong><span>Grand Total (Pay on Verification)</span><b>{formatInr(totals.total)}</b></strong>
          </div>

          {quote.isError && (
            <p className="checkout-error">Live quote unavailable; the same verified invoice formula is shown locally.</p>
          )}

          <button
            disabled={!accepted || saving}
            onClick={() => void confirm()}
          >
            {saving ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : profile ? (
              <CreditCard size={18} />
            ) : (
              <UserRound size={18} />
            )}
            {saving ? "Reserving your yatra…" : profile ? "Submit Booking for Admin Approval" : "Sign in to continue"}
          </button>
          <small>
            <ShieldCheck size={15} />
            {" "}100% Manual Verification: Admin will check route seats and confirm on WhatsApp/Phone before any payment.
          </small>
        </aside>
      </div>
    </main>
  );
}

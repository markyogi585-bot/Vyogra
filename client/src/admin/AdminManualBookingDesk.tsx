import { useState, useRef } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  IdCard,
  MessageCircle,
  Phone,
  Plane,
  Plus,
  Printer,
  Receipt,
  Share2,
  Sparkles,
  Train,
  Trash2,
  Truck,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { catalog } from "@/lib/voyagrData";
import {
  createBooking,
  generateBookingCode,
  generateInvoiceNumber,
  type PassengerInfo,
  type FirebaseBooking,
} from "@/lib/firebaseBookings";
import { lockTripToCookie, type LockedTripDesk } from "@/lib/sessionStorage";
import { siteConfig } from "@/config/siteConfig";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";

export function AdminManualBookingDesk() {
  const [selectedPkgId, setSelectedPkgId] = useState(catalog[0].id);
  const [customPackageName, setCustomPackageName] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [departureDate, setDepartureDate] = useState("2026-09-25");
  const [duration, setDuration] = useState("5 nights · 6 days");

  // Travel Mode & Coach / Ticket Class
  const [travelMode, setTravelMode] = useState<"train" | "flight" | "bus" | "cab">("train");
  const [travelClass, setTravelClass] = useState("Train - 3rd AC (3A)");
  const [seatAllotment, setSeatAllotment] = useState("Coach B3: Seats 21, 22, 23, 24");

  // Lead Traveler Info
  const [leadName, setLeadName] = useState("Rohan Sharma");
  const [leadPhone, setLeadPhone] = useState("+91 96306 42541");
  const [leadEmail, setLeadEmail] = useState("rohan.sharma@example.com");
  const [leadAddress, setLeadAddress] = useState("B-42, Civil Lines, Jaipur, Rajasthan");
  const [specialRequests, setSpecialRequests] = useState("Ground floor rooms preferred. Pure Satvik meals.");

  // Additional Passenger Roster (supports up to 100+ passengers)
  const [passengers, setPassengers] = useState<PassengerInfo[]>([
    {
      id: "p-1",
      name: "Rohan Sharma",
      phone: "+91 96306 42541",
      age: 34,
      gender: "male",
      idType: "aadhaar",
      idNumber: "XXXX-XXXX-8921",
      address: "Civil Lines, Jaipur",
      city: "Jaipur",
      roomSharing: "double",
      mealPref: "veg",
      berthPreference: "Lower Berth",
    },
    {
      id: "p-2",
      name: "Pooja Sharma",
      phone: "+91 96306 42541",
      age: 31,
      gender: "female",
      idType: "aadhaar",
      idNumber: "XXXX-XXXX-4310",
      address: "Civil Lines, Jaipur",
      city: "Jaipur",
      roomSharing: "double",
      mealPref: "veg",
      berthPreference: "Middle Berth",
    },
  ]);

  // Bulk Import Modal state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  // Pricing
  const activePkg = catalog.find((c) => c.id === selectedPkgId);
  const baseRate = activePkg ? activePkg.price * Math.max(1, passengers.length) : 35000;
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const subtotal = customPrice ?? baseRate;
  const [discount, setDiscount] = useState(2500);
  const tax = Math.round((subtotal - discount) * 0.05);
  const grandTotal = Math.max(0, subtotal - discount + tax);

  // Host & Vehicle Assignment
  const [hostName, setHostName] = useState("Vijay Singh (Tour Coordinator)");
  const [hostPhone, setHostPhone] = useState("+91 96306 42541");
  const [vehicle, setVehicle] = useState("Toyota Innova Crysta / Luxury AC Coach (RJ 14 TB 4590)");

  // State after issuing
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedBooking, setIssuedBooking] = useState<FirebaseBooking | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const addPassenger = () => {
    const newP: PassengerInfo = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: "",
      phone: leadPhone || "",
      age: "",
      gender: "male",
      idType: "aadhaar",
      idNumber: "",
      address: leadAddress || "",
      city: "Jaipur",
      roomSharing: "double",
      mealPref: "veg",
      berthPreference: "Lower Berth",
    };
    setPassengers([...passengers, newP]);
    toast.success(`Passenger #${passengers.length + 1} added.`);
  };

  const addBulkPassengers = (count: number) => {
    const added: PassengerInfo[] = [];
    const baseIndex = passengers.length;
    for (let i = 0; i < count; i++) {
      added.push({
        id: `p-${Date.now()}-${i}`,
        name: `Traveler ${baseIndex + i + 1}`,
        phone: leadPhone || "",
        age: 30 + (i % 30),
        gender: i % 2 === 0 ? "male" : "female",
        idType: "aadhaar",
        idNumber: `XXXX-XXXX-${1000 + i}`,
        address: leadAddress || "India",
        city: "Jaipur",
        roomSharing: "double",
        mealPref: "veg",
        berthPreference: i % 3 === 0 ? "Lower Berth" : i % 3 === 1 ? "Middle Berth" : "Upper Berth",
      });
    }
    setPassengers([...passengers, ...added]);
    toast.success(`Added ${count} passenger slots (Total: ${passengers.length + count})`);
  };

  const parseBulkText = () => {
    if (!bulkText.trim()) {
      toast.error("Please paste passenger lines.");
      return;
    }

    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed: PassengerInfo[] = [];

    lines.forEach((line, idx) => {
      // Split by comma, tab, or pipe
      const parts = line.split(/[,|\t]/).map((p) => p.trim());
      const name = parts[0] || `Traveler ${passengers.length + idx + 1}`;
      const phone = parts[1] || leadPhone || "+91 96306 42541";
      const age = parts[2] ? Number(parts[2]) || 30 : 30;
      const gender = (parts[3] || "male").toLowerCase().includes("f") ? "female" : "male";
      const idNumber = parts[4] || `XXXX-XXXX-${Math.floor(1000 + Math.random() * 9000)}`;
      const address = parts[5] || leadAddress || "India";

      parsed.push({
        id: `p-bulk-${Date.now()}-${idx}`,
        name,
        phone,
        age,
        gender,
        idType: "aadhaar",
        idNumber,
        address,
        city: address.split(",").pop()?.trim() || "India",
        roomSharing: "double",
        mealPref: "veg",
        berthPreference: "Lower Berth",
      });
    });

    setPassengers([...passengers, ...parsed]);
    setBulkText("");
    setBulkModalOpen(false);
    toast.success(`Successfully imported ${parsed.length} travelers! Total: ${passengers.length + parsed.length}`);
  };

  const updatePassenger = (index: number, field: keyof PassengerInfo, val: any) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: val };
    setPassengers(updated);
  };

  const removePassenger = (index: number) => {
    if (passengers.length <= 1) {
      toast.error("At least 1 passenger is required.");
      return;
    }
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const handleIssueBooking = async () => {
    if (!leadName.trim() || !leadPhone.trim()) {
      toast.error("Lead traveler name and phone are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingCode = generateBookingCode();
      const invoiceNumber = generateInvoiceNumber(bookingCode);
      const pkgTitle = selectedPkgId === "custom" ? customPackageName || "Custom Private Itinerary" : activePkg?.name || "Boutique Journey";
      const pkgLoc = selectedPkgId === "custom" ? customLocation || "India" : activePkg?.location || "India";

      const bookingPayload: Parameters<typeof createBooking>[0] = {
        bookingCode,
        userId: "manual_admin_entry",
        packageId: selectedPkgId,
        packageName: pkgTitle,
        packageLocation: pkgLoc,
        packageDuration: duration,
        packageImage: activePkg?.image,
        travelerName: leadName,
        phone: leadPhone,
        email: leadEmail,
        travelerCount: passengers.length,
        passengers,
        travelDate: departureDate,
        specialRequests: `Address: ${leadAddress} | ${specialRequests} | Seats: ${seatAllotment}`,
        subtotal,
        addOnTotal: 0,
        discount,
        tax,
        grandTotal,
        invoiceNumber,
        status: "confirmed",
        approvalStatus: "approved",
        approvedAt: new Date(),
        approvedBy: "Vijay Singh (Admin)",
        verificationCallDone: true,
        hostContact: {
          name: hostName,
          phone: hostPhone,
          whatsapp: hostPhone.replace(/\D/g, ""),
          assignedHostName: hostName,
          assignedHostPhone: hostPhone,
          assignedHostWhatsapp: hostPhone.replace(/\D/g, ""),
          assignedVehicle: vehicle,
        },
      };

      const res = await createBooking(bookingPayload);
      const savedBooking: FirebaseBooking = {
        id: res.id,
        bookingCode: res.bookingCode,
        status: "confirmed",
        approvalStatus: "approved",
        ...bookingPayload,
      };

      // Auto-lock into browser cookie
      const lockedTrip: LockedTripDesk = {
        bookingCode: res.bookingCode,
        packageName: pkgTitle,
        location: pkgLoc,
        travelDate: departureDate,
        travelerName: leadName,
        phone: leadPhone,
        status: "confirmed",
        approvalStatus: "approved",
        hostName,
        hostPhone,
        hostWhatsapp: hostPhone.replace(/\D/g, ""),
        lockedAt: new Date().toISOString(),
      };
      lockTripToCookie(lockedTrip);

      setIssuedBooking(savedBooking);
      toast.success(`Booking ${bookingCode} saved with ${passengers.length} passengers!`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create booking.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const directUrl = issuedBooking
    ? `${window.location.origin}/?id=${issuedBooking.bookingCode}`
    : "";

  const whatsappMessage = issuedBooking
    ? `🚩 *HAR HAR MAHADEV TOURS & TRAVELS* 🎫%0A*OFFICIAL YATRA E-PASS & BOOKING CONFIRMATION*%0A━━━━━━━━━━━━━━━━━━━━━━━━━━%0A%0A🙏 *हर हर महादेव!* Namaste ${issuedBooking.travelerName},%0AYour booking for *${issuedBooking.packageName}* is confirmed!%0A%0A📋 *Booking ID / E-Pass:* ${issuedBooking.bookingCode}%0A🗓️ *Departure Date:* ${issuedBooking.travelDate}%0A👥 *Total Passengers:* ${issuedBooking.travelerCount}%0A🚆 *Travel Mode / Class:* ${travelClass}%0A🎟️ *Seat Allotment:* ${seatAllotment || "Confirmed"}%0A🚘 *Assigned Host / Coordinator:* ${hostName} (${hostPhone})%0A🚙 *Vehicle Plate:* ${vehicle}%0A%0A📲 *Open Your Live Trip E-Pass & Itinerary:*%0A${encodeURIComponent(directUrl)}%0A%0A📄 *Download Official GST Tax Invoice Receipt:*%0A${encodeURIComponent(`${window.location.origin}/invoice/${issuedBooking.bookingCode}`)}%0A%0A━━━━━━━━━━━━━━━━━━━━━━━━━━%0A🚩 *Har Har Mahadev Tours & Travels* · Operations Head: Vijay Singh (${siteConfig.contact.primaryPhone})`
    : "";

  const manifestText = issuedBooking
    ? `🚩 *HAR HAR MAHADEV TOURS & TRAVELS*
📋 *OFFICIAL PASSENGER MANIFEST & GROUP YATRA ROSTER (${passengers.length} PAX)*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔖 *Booking ID / E-Pass:* ${issuedBooking.bookingCode}
📍 *Tour Route:* ${issuedBooking.packageName}
🗓️ *Departure Date:* ${issuedBooking.travelDate}
🚆 *Travel Mode / Class:* ${travelClass}
🎟️ *Seat / Coach Allotment:* ${seatAllotment || "Allocated"}
🚘 *Tour Coordinator / Driver:* ${hostName} (${hostPhone})
🚙 *Vehicle & Plate:* ${vehicle}
👥 *Total Verified Passengers:* ${passengers.length}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*PASSENGER ROSTER DETAILS:*
${passengers.map((p, i) => `${i + 1}. ${p.name || "Traveler"} | Mobile: ${p.phone || "—"} | Age: ${p.age || "—"} | Gender: ${p.gender?.toUpperCase()} | Govt ID: ${p.idNumber || "Aadhaar Verified"} | Address/City: ${p.address || p.city || "India"} | Berth: ${p.berthPreference || "Standard"} | Meal: ${p.mealPref === "veg" ? "Pure Veg" : p.mealPref === "jain" ? "Jain" : "Non-Veg"}`).join("\n")}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💳 *Total Package Fare:* ₹${grandTotal.toLocaleString("en-IN")} (5% GST Included)
🏨 *Room Allocation:* Double / Triple Sharing AC Deluxe
📞 *24x7 Operations Helpline:* ${siteConfig.contact.primaryPhone} (Vijay Singh)`
    : "";

  const handlePrint = () => {
    window.print();
  };

  const downloadManifestDocx = () => {
    const element = document.createElement("a");
    const file = new Blob([manifestText], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `Passenger-Manifest-${issuedBooking?.bookingCode || "YATRA"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Passenger manifest document downloaded!");
  };

  const exportAllBookingsCsv = () => {
    const headers = "SNo,BookingCode,PackageName,TravelerName,Mobile,Age,Gender,GovtID,Address,City,TravelDate,TravelClass,Seats,GrandTotal,Status\n";
    const rows = passengers.map((p, idx) => 
      `${idx + 1},"${issuedBooking?.bookingCode || "VYG-2026-08456"}","${issuedBooking?.packageName || "Char Dham Yatra"}","${p.name}","${p.phone}","${p.age}","${p.gender}","${p.idNumber}","${p.address}","${p.city}","${departureDate}","${travelClass}","${seatAllotment}",${grandTotal},"confirmed"`
    ).join("\n");

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Group-Manifest-${issuedBooking?.bookingCode || "YATRA"}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Group Passenger Manifest CSV exported!");
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 0" }}>
      {/* Printable Area for A4 PDF Output */}
      <div className="printable-manifest" style={{ display: "none" }}>
        <div style={{ padding: "24px", fontFamily: "Arial, sans-serif", color: "#183a37" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #f06a3a", paddingBottom: 14, marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#f06a3a" }}>🚩 HAR HAR MAHADEV TOURS & TRAVELS</span>
              <h1 style={{ fontSize: 24, margin: "4px 0 0", color: "#183a37" }}>Official Passenger Manifest & Group Yatra E-Pass</h1>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#666" }}>Govt. Registered Pilgrimage & Tour Operations · Head: Vijay Singh (+91 96306 42541)</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ background: "#f06a3a", color: "white", padding: "6px 14px", borderRadius: 8, fontWeight: 900, fontSize: 14 }}>
                {issuedBooking?.bookingCode || "VYG-2026-GROUP"}
              </div>
              <small style={{ display: "block", marginTop: 4, fontSize: 11, color: "#666" }}>Date: {new Date().toLocaleDateString("en-IN")}</small>
            </div>
          </div>

          {/* Route & Transport Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, background: "#f9fafb", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12 }}>
            <div>
              <b>Package / Route:</b>
              <div>{issuedBooking?.packageName || "Sacred Himalayan Yatra"}</div>
              <small style={{ color: "#777" }}>Duration: {duration}</small>
            </div>
            <div>
              <b>Departure Date:</b>
              <div>{departureDate}</div>
              <small style={{ color: "#777" }}>Class: {travelClass}</small>
            </div>
            <div>
              <b>Tour Host / Coordinator:</b>
              <div>{hostName} ({hostPhone})</div>
              <small style={{ color: "#777" }}>Vehicle: {vehicle}</small>
            </div>
          </div>

          {/* Passenger Table */}
          <h3 style={{ fontSize: 14, borderBottom: "1px solid #ddd", paddingBottom: 4, margin: "0 0 10px", color: "#183a37" }}>
            Passenger Roster ({passengers.length} Total Devotees / Travelers)
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left", marginBottom: 16 }}>
            <thead>
              <tr style={{ background: "#183a37", color: "white" }}>
                <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>#</th>
                <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>Traveler Name</th>
                <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>Mobile</th>
                <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>Age/Gender</th>
                <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>Govt ID (Aadhaar)</th>
                <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>Address / City</th>
                <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>Berth / Seat</th>
                <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>Meal</th>
              </tr>
            </thead>
            <tbody>
              {passengers.map((p, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                  <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", fontWeight: 700 }}>{p.name || "Traveler"}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>{p.phone || leadPhone}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>{p.age || "—"} / {p.gender?.toUpperCase()}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>{p.idNumber || "Aadhaar Verified"}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>{p.address || p.city || "India"}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>{p.berthPreference || "Standard"}</td>
                  <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>{p.mealPref === "veg" ? "Pure Veg" : p.mealPref === "jain" ? "Jain" : "Non-Veg"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signatures & Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 24, paddingTop: 16, borderTop: "1px dashed #cbd5e1", fontSize: 11 }}>
            <div>
              <b>Special Requests / Medical Notes:</b>
              <div style={{ color: "#666" }}>{specialRequests || "None"}</div>
              <div style={{ marginTop: 8 }}><b>Total Group Fare:</b> ₹{grandTotal.toLocaleString("en-IN")} (5% GST Paid)</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 140, borderBottom: "1px solid #183a37", marginBottom: 4 }} />
              <b>Authorized Tour Coordinator</b>
              <div style={{ color: "#666", fontSize: 10 }}>Vijay Singh · Har Har Mahadev Travels</div>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Title */}
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", color: "#f06a3a", textTransform: "uppercase" }}>
          HIGH-TECH BULK & GROUP BOOKING DESK
        </span>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, margin: "4px 0 8px", color: "#183a37" }}>
          Group Yatra Manifest & Manual Booking Manager
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "#718079" }}>
          Add up to 100+ passengers with full names, phone numbers, Aadhaar IDs & addresses. Generate clean Printable PDF Manifests, official E-Passes, and 1-click WhatsApp dispatches.
        </p>
      </div>

      {/* Bulk Paste Modal */}
      {bulkModalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#ffffff", borderRadius: 20, maxWidth: 640, width: "100%", padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: 12, marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 900, color: "#f06a3a", letterSpacing: "0.1em" }}>BULK IMPORT (UP TO 100 PASSENGERS)</span>
                <h3 style={{ margin: "2px 0 0", fontSize: 18, color: "#183a37" }}>Paste Group Traveler Roster</h3>
              </div>
              <button onClick={() => setBulkModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666" }}><X size={20} /></button>
            </div>

            <p style={{ fontSize: 12, color: "#666", margin: "0 0 10px" }}>
              Paste 1 line per passenger. Format: <b>Name, Phone, Age, Gender, Aadhaar ID, Address/City</b>
            </p>

            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Ramesh Gupta, 9876543210, 45, Male, 1234-5678-9012, Varanasi UP\nSuman Gupta, 9876543210, 42, Female, 2345-6789-0123, Varanasi UP\nAarav Sharma, 9630642541, 28, Male, 3456-7890-1234, Jaipur RJ`}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 12, fontFamily: "monospace" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <button onClick={() => setBulkModalOpen(false)} style={{ padding: "8px 16px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={parseBulkText} style={{ padding: "8px 18px", background: "#183a37", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                + Import Passengers
              </button>
            </div>
          </div>
        </div>
      )}

      {issuedBooking ? (
        /* Success Screen */
        <div
          style={{
            background: "#ffffff",
            borderRadius: 24,
            padding: 36,
            border: "2px solid #22c55e",
            boxShadow: "0 20px 50px rgba(34,197,94,0.12)",
            textAlign: "center",
          }}
        >
          <div style={{ display: "inline-grid", placeItems: "center", width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", color: "#16a34a", marginBottom: 16 }}>
            <CheckCircle2 size={32} />
          </div>
          <span style={{ display: "block", fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", color: "#16a34a" }}>
            OFFICIAL YATRA E-PASS & RECORD SECURED IN FIRESTORE
          </span>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, margin: "6px 0", color: "#183a37" }}>
            Booking {issuedBooking.bookingCode}
          </h2>
          <p style={{ maxWidth: 600, margin: "0 auto 24px", fontSize: 14, color: "#666" }}>
            Group roster with {passengers.length} verified travelers, assigned coordinator Vijay Singh (+91 96306 42541), and 5% GST tax calculation have been recorded.
          </p>

          {/* Action Grid */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 28 }}>
            <button
              onClick={handlePrint}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 22px",
                background: "#183a37",
                color: "#ffffff",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(24,58,55,0.3)",
              }}
            >
              <Printer size={18} />
              <span>Print Official PDF Manifest / E-Pass</span>
            </button>

            <a
              href={`https://wa.me/${leadPhone.replace(/\D/g, "")}?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 22px",
                background: "#25D366",
                color: "#ffffff",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(37,211,102,0.3)",
              }}
            >
              <WhatsAppIcon size={18} />
              <span>Send Traveler WhatsApp E-Pass</span>
            </a>

            <a
              href={`https://wa.me/${hostPhone.replace(/\D/g, "")}?text=${encodeURIComponent(manifestText)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 20px",
                background: "#075e54",
                color: "#ffffff",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(7,94,84,0.3)",
              }}
            >
              <WhatsAppIcon size={18} />
              <span>Send Driver / Host Manifest</span>
            </a>

            <button
              onClick={downloadManifestDocx}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 20px",
                background: "#f06a3a",
                color: "#ffffff",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(240,106,58,0.3)",
              }}
            >
              <Download size={16} />
              <span>Download Manifest TXT</span>
            </button>

            <button
              onClick={exportAllBookingsCsv}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 18px",
                background: "#16a34a",
                color: "#ffffff",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13,
                border: "none",
                cursor: "pointer",
              }}
            >
              <FileSpreadsheet size={16} />
              <span>Export Group CSV</span>
            </button>
          </div>

          {/* Direct URL Box */}
          <div style={{ background: "#fbf9f4", padding: 18, borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", maxWidth: 700, margin: "0 auto", textAlign: "left" }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: "#f06a3a", letterSpacing: "0.1em" }}>DIRECT 1-CLICK LIVE TRIP COMPANION LINK</span>
            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <input
                readOnly
                value={directUrl}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #d2dad1", background: "white", fontSize: 13 }}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(directUrl);
                  toast.success("Direct link copied to clipboard!");
                }}
                style={{ padding: "8px 16px", background: "#f06a3a", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
              >
                Copy Link
              </button>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <button
              onClick={() => {
                setIssuedBooking(null);
                setPassengers([
                  { id: "p-1", name: "", phone: leadPhone, age: "", gender: "male", idType: "aadhaar", idNumber: "", address: leadAddress, city: "Jaipur", roomSharing: "double", mealPref: "veg" }
                ]);
              }}
              style={{ padding: "8px 18px", background: "transparent", border: "1px solid #cbd4cc", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}
            >
              + Create Another Group Booking
            </button>
          </div>
        </div>
      ) : (
        /* Booking Form */
        <div className="admin-manual-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 24, alignItems: "start" }}>
          {/* Left: Input Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* 1. Package & Departure */}
            <div style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ padding: "4px 8px", background: "#f06a3a", color: "white", borderRadius: 6, fontSize: 11, fontWeight: 900 }}>01</span>
                <h3 style={{ margin: 0, fontSize: 17, color: "#183a37" }}>Select Package & Departure Dates</h3>
              </div>

              <div className="admin-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#444" }}>
                  Destination / Tour Package
                  <select
                    value={selectedPkgId}
                    onChange={(e) => setSelectedPkgId(e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
                  >
                    {catalog.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.name} ({c.duration}) - ₹{c.price.toLocaleString("en-IN")}
                      </option>
                    ))}
                    <option value="custom">★ Custom Group Pilgrimage / Private Yatra</option>
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#444" }}>
                  Departure Date
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
                  />
                </label>

                {selectedPkgId === "custom" && (
                  <>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#444" }}>
                      Custom Route Title
                      <input
                        placeholder="e.g. 50 Devotees Haridwar-Kedarnath Special"
                        value={customPackageName}
                        onChange={(e) => setCustomPackageName(e.target.value)}
                        style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#444" }}>
                      Locations & Stops Covered
                      <input
                        placeholder="e.g. Haridwar · Guptkashi · Kedarnath · Badrinath"
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                        style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* 2. Primary Lead Contact & Address */}
            <div style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ padding: "4px 8px", background: "#f06a3a", color: "white", borderRadius: 6, fontSize: 11, fontWeight: 900 }}>02</span>
                <h3 style={{ margin: 0, fontSize: 17, color: "#183a37" }}>Lead Organizer & Address Details</h3>
              </div>

              <div className="admin-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#444" }}>
                  Primary Organizer Full Name *
                  <input
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#444" }}>
                  WhatsApp / Mobile Number *
                  <input
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#444", gridColumn: "1 / -1" }}>
                  Home / Organization Address (Ghar ka Pata) *
                  <input
                    value={leadAddress}
                    onChange={(e) => setLeadAddress(e.target.value)}
                    placeholder="e.g. B-42, Civil Lines, Jaipur, Rajasthan"
                    style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#444", gridColumn: "1 / -1" }}>
                  Special Requests / Satsang / Temple Timings Notes
                  <input
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
                  />
                </label>
              </div>
            </div>

            {/* 3. Travel Mode & Seat Allotment */}
            <div style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ padding: "4px 8px", background: "#f06a3a", color: "white", borderRadius: 6, fontSize: 11, fontWeight: 900 }}>03</span>
                <h3 style={{ margin: 0, fontSize: 17, color: "#183a37" }}>Travel Mode & Coach / Seat Allotment</h3>
              </div>

              <div className="admin-three-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#444" }}>
                  Mode of Travel
                  <select
                    value={travelMode}
                    onChange={(e) => {
                      const m = e.target.value as any;
                      setTravelMode(m);
                      if (m === "train") setTravelClass("Train - 3rd AC (3A)");
                      else if (m === "flight") setTravelClass("Flight - Economy");
                      else if (m === "bus") setTravelClass("Bus - AC Sleeper (Volvo)");
                      else setTravelClass("Cab - Toyota Innova Crysta");
                    }}
                    style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
                  >
                    <option value="train">🚂 Train (IRCTC Express / Superfast)</option>
                    <option value="bus">🚌 AC Bus / Volvo Coach (Group)</option>
                    <option value="flight">✈️ Flight (Airways)</option>
                    <option value="cab">🚗 Private SUV / Tempo Traveller</option>
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#444" }}>
                  Travel Class / Category
                  <select
                    value={travelClass}
                    onChange={(e) => setTravelClass(e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
                  >
                    {travelMode === "train" && (
                      <>
                        <option value="Train - 3rd AC (3A)">3rd AC (3A) Three-Tier</option>
                        <option value="Train - 2nd AC (2A)">2nd AC (2A) Two-Tier</option>
                        <option value="Train - 1st AC (1A)">1st AC (1A) Luxury</option>
                        <option value="Train - Sleeper Class (SL)">Sleeper Class (SL)</option>
                      </>
                    )}
                    {travelMode === "bus" && (
                      <>
                        <option value="Bus - 50 Seater Luxury AC Coach">50 Seater Luxury AC Coach</option>
                        <option value="Bus - AC Multi-Axle Volvo Sleeper">AC Multi-Axle Volvo Sleeper</option>
                        <option value="Bus - 26 Seater Deluxe AC Tempo">26 Seater Deluxe AC Tempo</option>
                      </>
                    )}
                    {travelMode === "flight" && (
                      <>
                        <option value="Flight - Economy Class">Economy Class</option>
                        <option value="Flight - Business Class">Business Class</option>
                      </>
                    )}
                    {travelMode === "cab" && (
                      <>
                        <option value="Cab - Toyota Innova Crysta (6+1)">Toyota Innova Crysta (6+1 AC)</option>
                        <option value="Cab - Tempo Traveller (17 Seater)">Tempo Traveller (17 Seater AC)</option>
                      </>
                    )}
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#444" }}>
                  Seat / Coach Allotment
                  <input
                    value={seatAllotment}
                    onChange={(e) => setSeatAllotment(e.target.value)}
                    placeholder="e.g. Coach B3: Seats 21-30"
                    style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
                  />
                </label>
              </div>
            </div>

            {/* 4. Detailed Passenger Roster (Supports up to 100+) */}
            <div style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ padding: "4px 8px", background: "#f06a3a", color: "white", borderRadius: 6, fontSize: 11, fontWeight: 900 }}>04</span>
                  <h3 style={{ margin: 0, fontSize: 17, color: "#183a37" }}>
                    Passenger Roster (<span style={{ color: "#f06a3a", fontWeight: 900 }}>{passengers.length} Total Devotees</span>)
                  </h3>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setBulkModalOpen(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 12px",
                      background: "#e0f2fe",
                      color: "#0369a1",
                      border: "1px solid #bae6fd",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    <Upload size={13} /> Bulk Paste
                  </button>

                  <button
                    type="button"
                    onClick={() => addBulkPassengers(5)}
                    style={{ padding: "6px 10px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    +5 Pax
                  </button>
                  <button
                    type="button"
                    onClick={() => addBulkPassengers(10)}
                    style={{ padding: "6px 10px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    +10 Pax
                  </button>
                  <button
                    type="button"
                    onClick={() => addBulkPassengers(25)}
                    style={{ padding: "6px 10px", background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    +25 Pax
                  </button>

                  <button
                    type="button"
                    onClick={addPassenger}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "6px 14px",
                      background: "#183a37",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={14} /> Add Single
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "550px", overflowY: "auto", paddingRight: 4 }}>
                {passengers.map((p, index) => (
                  <div
                    key={p.id || index}
                    style={{
                      background: "#fbf9f4",
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.06)",
                      display: "grid",
                      gridTemplateColumns: "24px 1.2fr 0.9fr 0.5fr 0.6fr 0.9fr 1fr 0.7fr auto",
                      gap: 6,
                      alignItems: "end",
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 900, color: "#888", paddingBottom: 8 }}>#{index + 1}</span>

                    <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 10, fontWeight: 700, color: "#555" }}>
                      Traveler Name *
                      <input
                        value={p.name}
                        onChange={(e) => updatePassenger(index, "name", e.target.value)}
                        placeholder="Full Name"
                        style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd4cc", fontSize: 11 }}
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 10, fontWeight: 700, color: "#555" }}>
                      Mobile Number
                      <input
                        value={p.phone || ""}
                        onChange={(e) => updatePassenger(index, "phone", e.target.value)}
                        placeholder="Mobile No."
                        style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #cbd4cc", fontSize: 11 }}
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 10, fontWeight: 700, color: "#555" }}>
                      Age
                      <input
                        type="number"
                        value={p.age}
                        onChange={(e) => updatePassenger(index, "age", e.target.value)}
                        placeholder="Age"
                        style={{ padding: "6px 4px", borderRadius: 6, border: "1px solid #cbd4cc", fontSize: 11 }}
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 10, fontWeight: 700, color: "#555" }}>
                      Gender
                      <select
                        value={p.gender}
                        onChange={(e) => updatePassenger(index, "gender", e.target.value)}
                        style={{ padding: "6px 4px", borderRadius: 6, border: "1px solid #cbd4cc", fontSize: 11 }}
                      >
                        <option value="male">M</option>
                        <option value="female">F</option>
                        <option value="other">O</option>
                      </select>
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 10, fontWeight: 700, color: "#555" }}>
                      Aadhaar / ID No.
                      <input
                        value={p.idNumber}
                        onChange={(e) => updatePassenger(index, "idNumber", e.target.value)}
                        placeholder="Aadhaar"
                        style={{ padding: "6px 6px", borderRadius: 6, border: "1px solid #cbd4cc", fontSize: 11 }}
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 10, fontWeight: 700, color: "#555" }}>
                      Address / City (Pata)
                      <input
                        value={p.address || p.city || ""}
                        onChange={(e) => {
                          updatePassenger(index, "address", e.target.value);
                          updatePassenger(index, "city", e.target.value);
                        }}
                        placeholder="City, State"
                        style={{ padding: "6px 6px", borderRadius: 6, border: "1px solid #cbd4cc", fontSize: 11 }}
                      />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 10, fontWeight: 700, color: "#555" }}>
                      Berth / Seat
                      <select
                        value={p.berthPreference || "Lower Berth"}
                        onChange={(e) => updatePassenger(index, "berthPreference", e.target.value)}
                        style={{ padding: "6px 4px", borderRadius: 6, border: "1px solid #cbd4cc", fontSize: 11 }}
                      >
                        <option value="Lower Berth">Lower</option>
                        <option value="Middle Berth">Middle</option>
                        <option value="Upper Berth">Upper</option>
                        <option value="Side Lower">Side Low</option>
                        <option value="Side Upper">Side Up</option>
                        <option value="Window Seat">Window</option>
                        <option value="Aisle Seat">Aisle</option>
                      </select>
                    </label>

                    <button
                      type="button"
                      onClick={() => removePassenger(index)}
                      style={{
                        padding: "6px",
                        background: "#fee2e2",
                        color: "#dc2626",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        height: 30,
                      }}
                      title="Remove passenger"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Coordinator & Vehicle Assignment */}
            <div style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ padding: "4px 8px", background: "#f06a3a", color: "white", borderRadius: 6, fontSize: 11, fontWeight: 900 }}>05</span>
                <h3 style={{ margin: 0, fontSize: 17, color: "#183a37" }}>Tour Coordinator & Vehicle Assignment</h3>
              </div>

              <div className="admin-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#444" }}>
                  Tour Coordinator / Chauffeur Name
                  <input
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#444" }}>
                  Coordinator WhatsApp / Phone
                  <input
                    value={hostPhone}
                    onChange={(e) => setHostPhone(e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "#444", gridColumn: "1 / -1" }}>
                  Assigned Bus / Vehicle & Plate Number
                  <input
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd4cc", fontSize: 13 }}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Right: Summary & Action */}
          <aside style={{ background: "#ffffff", borderRadius: 20, padding: 24, border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", position: "sticky", top: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: "#f06a3a", textTransform: "uppercase" }}>
              GROUP BILLING & PASS SUMMARY
            </span>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, margin: "6px 0 12px", color: "#183a37" }}>
              {selectedPkgId === "custom" ? customPackageName || "Custom Tour" : activePkg?.name}
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "#718079" }}>
              {departureDate} · <b style={{ color: "#f06a3a" }}>{passengers.length} Devotees / Travelers</b>
            </p>

            {/* Custom Fare Override */}
            <div style={{ background: "#fbf9f4", padding: 12, borderRadius: 10, marginBottom: 16, border: "1px solid rgba(0,0,0,0.06)" }}>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, fontWeight: 700 }}>
                <span>Custom Subtotal Override:</span>
                <input
                  type="number"
                  placeholder={String(baseRate)}
                  value={customPrice ?? ""}
                  onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : null)}
                  style={{ width: 100, padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd4cc", fontSize: 12, textAlign: "right" }}
                />
              </label>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, fontWeight: 700, marginTop: 8 }}>
                <span>Group Discount Applied (₹):</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  style={{ width: 100, padding: "4px 8px", borderRadius: 6, border: "1px solid #cbd4cc", fontSize: 12, textAlign: "right" }}
                />
              </label>
            </div>

            {/* Price Stack */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 0", borderTop: "1px solid #e0e3dc", borderBottom: "1px solid #e0e3dc", fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#718079" }}>Total Fare ({passengers.length} pax)</span>
                <b>₹{subtotal.toLocaleString("en-IN")}</b>
              </div>
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}>
                  <span>Group Discount</span>
                  <b>−₹{discount.toLocaleString("en-IN")}</b>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#718079" }}>5% Travel GST</span>
                <b>₹{tax.toLocaleString("en-IN")}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, color: "#183a37", marginTop: 4 }}>
                <span style={{ fontWeight: 800 }}>Grand Total</span>
                <strong style={{ color: "#f06a3a" }}>₹{grandTotal.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            {/* Submit Button */}
            <button
              disabled={isSubmitting}
              onClick={handleIssueBooking}
              style={{
                width: "100%",
                marginTop: 20,
                padding: "14px",
                background: "linear-gradient(135deg, #f06a3a 0%, #e05320 100%)",
                color: "white",
                border: "none",
                borderRadius: 12,
                fontWeight: 900,
                fontSize: 14,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: "0 8px 20px rgba(240,106,58,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <UserCheck size={18} />
              <span>{isSubmitting ? "Saving Group Record…" : `Save ${passengers.length} Travelers & Issue E-Pass`}</span>
            </button>

            <small style={{ display: "block", marginTop: 12, textAlign: "center", color: "#888", fontSize: 11 }}>
              🔒 Generates official E-Pass, PDF Manifest & locks traveler companion card.
            </small>
          </aside>
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-manifest, .printable-manifest * {
            visibility: visible;
            display: block !important;
          }
          .printable-manifest {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
        @media (max-width: 960px) {
          .admin-manual-grid {
            grid-template-columns: 1fr !important;
          }
          .admin-two-col {
            grid-template-columns: 1fr !important;
          }
          .admin-three-col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

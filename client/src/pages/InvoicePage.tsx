import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, MapPin, Phone, Printer, QrCode, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { getBookingByCode, type FirebaseBooking } from "@/lib/firebaseBookings";
import { useTravelSession } from "@/contexts/TravelSessionContext";

export default function InvoicePage({ bookingCode }: { bookingCode: string }) {
  const { locale } = useTravelSession();
  const hindi = locale === "hi-IN";
  const [booking, setBooking] = useState<FirebaseBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookingByCode(bookingCode).then((b) => {
      setBooking(b);
      setLoading(false);
    });
  }, [bookingCode]);

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `INV-${bookingCode.replace("VYG-", "")}`;
  const subtotal = booking?.subtotal ?? 11999;
  const tax = booking?.tax ?? Math.round(subtotal * 0.05);
  const addOnTotal = booking?.addOnTotal ?? 0;
  const discount = booking?.discount ?? 0;
  const grandTotal = booking?.grandTotal ?? (subtotal + tax + addOnTotal - discount);

  return (
    <main className="invoice-page-container">
      {/* Non-printed Toolbar */}
      <header className="invoice-toolbar no-print">
        <Link href={`/trips`} className="back-link">
          <ArrowLeft size={16} /> {hindi ? "Meri Yatraen" : "Back to Trips"}
        </Link>
        <div className="toolbar-actions">
          <button onClick={handlePrint} className="print-btn">
            <Printer size={15} />
            <span>{hindi ? "PDF Invoice Print / Download" : "Print / Save PDF Receipt"}</span>
          </button>
        </div>
      </header>

      {/* Official Printable Invoice Canvas */}
      <div className="printable-invoice-paper" id="printable-invoice">
        {/* Header */}
        <div className="invoice-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="invoice-brand" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img
                src="https://img.freepik.com/premium-vector/happy-maha-shivratri-lord-shiva-modern-logo-design-har-har-mahadev-hindi-calligraphy_428817-1867.jpg"
                alt="Har Har Mahadev Logo"
                style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid #f06a3a" }}
              />
              <div>
                <span className="brand-mark" style={{ fontSize: 18, color: "#183a37" }}>HAR HAR MAHADEV TOURS & TRAVELS</span>
                <small style={{ display: "block", color: "#f06a3a", fontWeight: 800 }}>हर हर महादेव टूर्स एंड ट्रेवल्स · PILGRIMAGE & TRAVEL INDIA</small>
              </div>
            </div>
            <div className="company-info" style={{ marginTop: 8 }}>
              <span>Har Har Mahadev Tours & Travels Private Limited</span>
              <span>GSTIN: 07AAACH2026M1ZX · info@harharmahadevtours.com</span>
              <span>Main Road, Haridwar / Delhi NCR · India · Helpline: +91 98765 43210</span>
            </div>
          </div>

          <div className="invoice-meta-block">
            <div className="invoice-badge">
              <ShieldCheck size={14} />
              <span>OFFICIAL TAX INVOICE</span>
            </div>
            <h2>{invoiceNumber}</h2>
            <div className="meta-row">
              <span>{hindi ? "Booking ID" : "Booking Code"}:</span>
              <b>{bookingCode}</b>
            </div>
            <div className="meta-row">
              <span>{hindi ? "Date" : "Invoice Date"}:</span>
              <b>{new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</b>
            </div>
            <div className="meta-row">
              <span>{hindi ? "Status" : "Payment Status"}:</span>
              <b className="status-confirmed">{booking?.status === "confirmed" ? "CONFIRMED & VERIFIED" : "PENDING MANUAL REVIEW"}</b>
            </div>
          </div>
        </div>

        <hr className="divider" />

        {/* Billed To & Trip Info */}
        <div className="invoice-parties">
          <div className="party-box">
            <span className="party-title">{hindi ? "Yatri Ka Vivran (Billed To)" : "Billed To (Lead Traveler)"}</span>
            <h3>{booking?.travelerName || "Verified Guest Traveler"}</h3>
            <p>Phone: {booking?.phone || "+91 98765 43210"}</p>
            <p>Email: {booking?.email || "info@harharmahadevtours.com"}</p>
          </div>

          <div className="party-box">
            <span className="party-title">{hindi ? "Yatra Vivran" : "Journey & Route Details"}</span>
            <h3>{booking?.packageName || "Curated India Route"}</h3>
            <p><MapPin size={13} /> {booking?.packageLocation || "Haridwar / Kedarnath / Varanasi"}</p>
            <p>Travelers: <b>{booking?.travelerCount || 2} Persons</b> · Departure: <b>{booking?.travelDate || "Scheduled 2026"}</b></p>
          </div>
        </div>

        {/* E-Pass & Seat Allocation Box */}
        {((booking as any)?.pnrNumber || (booking as any)?.seatNumbers || (booking as any)?.hotelDetails || (booking as any)?.travelClass) && (
          <div style={{ background: "#fdfbf7", borderRadius: 12, padding: "16px 20px", marginBottom: 20, border: "1.5px dashed #f06a3a" }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: "#f06a3a", letterSpacing: "0.1em" }}>
              🚩 {hindi ? "आधिकारिक ई-पास एवं सीट/बर्थ आवंटन" : "OFFICIAL E-PASS & BERTH ALLOCATION"}
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 8 }}>
              {(booking as any)?.pnrNumber && (
                <div>
                  <small style={{ color: "#777", display: "block", fontSize: 11 }}>E-Pass / Ticket No:</small>
                  <strong style={{ fontSize: 13, color: "#183a37" }}>{(booking as any).pnrNumber}</strong>
                </div>
              )}
              {(booking as any)?.seatNumbers && (
                <div>
                  <small style={{ color: "#777", display: "block", fontSize: 11 }}>Seat / Berth Allocation:</small>
                  <strong style={{ fontSize: 13, color: "#183a37" }}>{(booking as any).seatNumbers}</strong>
                </div>
              )}
              {(booking as any)?.travelClass && (
                <div>
                  <small style={{ color: "#777", display: "block", fontSize: 11 }}>Travel Class:</small>
                  <strong style={{ fontSize: 13, color: "#183a37" }}>{(booking as any).travelClass}</strong>
                </div>
              )}
              {(booking as any)?.hotelDetails && (
                <div>
                  <small style={{ color: "#777", display: "block", fontSize: 11 }}>Hotel & Room Allocation:</small>
                  <strong style={{ fontSize: 13, color: "#183a37" }}>{(booking as any).hotelDetails}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Itemized Table */}
        <table className="invoice-table">
          <thead>
            <tr>
              <th>{hindi ? "Vivran (Item & Description)" : "Item & Route Details"}</th>
              <th className="text-center">{hindi ? "Yatri (Qty)" : "Travelers"}</th>
              <th className="text-right">{hindi ? "Rashi (Amount)" : "Amount (INR)"}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <b>{booking?.packageName || "Boutique Experience Package"}</b>
                <small style={{ display: "block", color: "#666" }}>
                  Curated stay, local host coordination, daily breakfasts, verified excursions.
                </small>
              </td>
              <td className="text-center">{booking?.travelerCount || 2}</td>
              <td className="text-right">₹{subtotal.toLocaleString("en-IN")}</td>
            </tr>

            {addOnTotal > 0 && (
              <tr>
                <td>
                  <b>Selected Add-ons & Transfers</b>
                  <small style={{ display: "block", color: "#666" }}>Private airport transfer, special beach dining</small>
                </td>
                <td className="text-center">1</td>
                <td className="text-right">₹{addOnTotal.toLocaleString("en-IN")}</td>
              </tr>
            )}

            {discount > 0 && (
              <tr>
                <td style={{ color: "#2d7a6a" }}>
                  <b>Applied Promotional Credit</b>
                </td>
                <td className="text-center">1</td>
                <td className="text-right" style={{ color: "#2d7a6a" }}>−₹{discount.toLocaleString("en-IN")}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals Calculation */}
        <div className="invoice-calculation">
          <div className="terms-notes">
            <h4>{hindi ? "Safar Nirdesh & Concierge" : "Assigned Local Host & Concierge Helpline"}</h4>
            {booking?.hostContact ? (
              <p>
                Host: <b>{booking.hostContact.name}</b> (WhatsApp: {booking.hostContact.whatsapp})<br />
                Concierge Helpline: <b>+91 98765 43210</b>
              </p>
            ) : (
              <p>
                Local host assignment will be sent to your WhatsApp 24 hours prior to departure.<br />
                24x7 Helpline: <b>+91 98765 43210</b> (support@voyagr.in)
              </p>
            )}
            <small style={{ display: "block", marginTop: 8, color: "#888" }}>
              This is a digitally generated tax receipt valid under Indian Tourism Regulations. No physical signature required.
            </small>
          </div>

          <div className="totals-box">
            <div className="total-row">
              <span>{hindi ? "Subtotal" : "Route Subtotal"}:</span>
              <b>₹{(subtotal + addOnTotal).toLocaleString("en-IN")}</b>
            </div>
            <div className="total-row">
              <span>GST & Tourism Tax (5%):</span>
              <b>₹{tax.toLocaleString("en-IN")}</b>
            </div>
            <div className="total-row grand-total">
              <span>{hindi ? "Kul Rashi (Grand Total)" : "Grand Total"}:</span>
              <b>₹{grandTotal.toLocaleString("en-IN")}</b>
            </div>
          </div>
        </div>

        {/* Verification Stamp & QR Code */}
        <div className="invoice-footer">
          <div className="qr-seal">
            <div className="qr-box">
              <QrCode size={44} />
            </div>
            <div>
              <span className="seal-text">VERIFIED DIGITAL PASS</span>
              <small>Scan to open Live Companion Desk on mobile</small>
            </div>
          </div>
          <div className="signature-box">
            <span>VOYAGR Travel Services Pvt. Ltd.</span>
            <b>Authorized Signatory</b>
          </div>
        </div>
      </div>

      <style>{`
        .invoice-page-container {
          min-height: 100vh;
          background: #f4f1ea;
          padding: 30px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .invoice-toolbar {
          width: 100%;
          max-width: 800px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .back-link {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #333;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
        }
        .print-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--color-brand, #f06a3a);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(240,106,58,0.25);
        }
        .printable-invoice-paper {
          width: 100%;
          max-width: 800px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.06);
          padding: 40px;
          box-sizing: border-box;
          color: #1a1a1a;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .invoice-brand .brand-mark {
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #111;
        }
        .invoice-brand small {
          display: block;
          font-size: 10px;
          letter-spacing: 0.1em;
          color: var(--color-brand, #f06a3a);
          font-weight: 800;
          margin-top: 2px;
        }
        .company-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 12px;
          color: #666;
          margin-top: 10px;
        }
        .invoice-meta-block {
          text-align: right;
        }
        .invoice-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #e6f4f1;
          color: #2d7a6a;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10.5px;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .invoice-meta-block h2 {
          margin: 0 0 8px;
          font-size: 20px;
          font-family: monospace;
        }
        .meta-row {
          font-size: 12px;
          color: #555;
          margin-bottom: 2px;
        }
        .status-confirmed {
          color: #2d7a6a;
        }
        .divider {
          border: none;
          border-top: 1.5px solid #eee;
          margin: 20px 0;
        }
        .invoice-parties {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 28px;
        }
        .party-title {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #888;
          text-transform: uppercase;
        }
        .party-box h3 {
          margin: 6px 0 4px;
          font-size: 16px;
        }
        .party-box p {
          margin: 2px 0;
          font-size: 13px;
          color: #555;
        }
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        .invoice-table th {
          background: #faf8f5;
          padding: 10px 14px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #666;
          border-bottom: 1.5px solid #eee;
          text-align: left;
        }
        .invoice-table td {
          padding: 14px;
          font-size: 13px;
          border-bottom: 1px solid #f0f0f0;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .invoice-calculation {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 24px;
          margin-bottom: 30px;
        }
        .terms-notes h4 {
          margin: 0 0 6px;
          font-size: 13px;
        }
        .terms-notes p {
          margin: 0;
          font-size: 12px;
          color: #555;
          line-height: 1.5;
        }
        .totals-box {
          background: #faf8f5;
          padding: 16px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }
        .total-row.grand-total {
          border-top: 1.5px solid #ddd;
          padding-top: 8px;
          font-size: 16px;
          font-weight: 800;
          color: #111;
        }
        .invoice-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20px;
          border-top: 1.5px solid #eee;
        }
        .qr-seal {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .qr-box {
          padding: 6px;
          background: #faf8f5;
          border-radius: 8px;
          border: 1px solid #eee;
        }
        .seal-text {
          font-size: 11px;
          font-weight: 800;
          color: #111;
          display: block;
        }
        .signature-box {
          text-align: right;
          font-size: 12px;
          color: #666;
        }
        .signature-box b {
          display: block;
          margin-top: 4px;
          color: #111;
        }

        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .invoice-page-container { padding: 0 !important; background: white !important; }
          .printable-invoice-paper { box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
        }
      `}</style>
    </main>
  );
}

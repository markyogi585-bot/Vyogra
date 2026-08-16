import { MessageCircle, Navigation, PhoneCall } from "lucide-react";
import { Link } from "wouter";
import { TripMediaGallery } from "@/components/live/TripMediaGallery";
import { TripUpdateFeed } from "@/components/live/TripUpdateFeed";
import { VoyagrShell } from "@/components/VoyagrShell";
import { DocumentList } from "@/components/travel/DocumentList";
import { RouteMap } from "@/components/travel/RouteMap";
import { StatusPill } from "@/components/travel/StatusPill";
import { TripTimeline } from "@/components/travel/TripTimeline";
import { trpc } from "@/lib/trpc";

export default function LiveTripPage() {
  const bookingCode = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("booking")?.toUpperCase() ?? "";
  const booking = trpc.bookings.byCode.useQuery({ bookingCode: bookingCode || "VYG-0000" }, { enabled: Boolean(bookingCode), retry: false });
  const latestCheckin = trpc.tripOps.latestCheckin.useQuery({ bookingId: booking.data?.id ?? 0 }, { enabled: Boolean(booking.data?.id), retry: false });
  const unresolvedTitle = booking.isLoading
    ? "Loading your secured trip…"
    : booking.isError
      ? "We couldn’t load this trip desk."
      : "Choose a booking";
  const locationTitle = latestCheckin.isLoading
    ? "Checking host location…"
    : latestCheckin.isError
      ? "Host location is temporarily unavailable."
      : latestCheckin.data?.label || "Live location activates with host check-in.";

  return <VoyagrShell title="LIVE TRIP"><div className="live-trip-page"><header className="live-trip-hero"><div><span className="admin-overline">{booking.data ? `${booking.data.bookingCode} / LIVE TRIP` : "LIVE TRIP / BOOKING REQUIRED"}</span><h1>{booking.data ? <>Your journey,<br /><i>in motion.</i></> : <>Open a trip desk<br /><i>to track it.</i></>}</h1><p>{booking.data ? `${booking.data.travelerCount} traveler${booking.data.travelerCount === 1 ? "" : "s"} · ${booking.data.status}` : "Choose a verified booking from My Trips or Booking-ID access."}</p></div><StatusPill status={booking.data?.status === "active" ? "active" : "upcoming"} /></header>{bookingCode && booking.data ? <><RouteMap /><div className="live-trip-grid"><TripTimeline /><div className="live-trip-aside"><section className="host-card"><span className="host-avatar">🕉️</span><div><span className="admin-overline">YOUR LOCAL HOST</span><h3>Har Har Mahadev Tour Team</h3><p>On the road with you today.</p></div><div className="host-actions"><Link href="/support"><MessageCircle size={16} /> Message</Link><a href="tel:+919876543210"><PhoneCall size={16} /> Call</a></div></section><section className="route-safety"><Navigation size={18} /><div><b>{locationTitle}</b><p>{latestCheckin.data ? `${Number(latestCheckin.data.latitude).toFixed(4)}, ${Number(latestCheckin.data.longitude).toFixed(4)} · ${new Date(latestCheckin.data.capturedAt).toLocaleTimeString()}` : latestCheckin.isError ? "Your host and support team can help with a live route change while the location feed reconnects." : "Your host and support team can help with a live route change."}</p><Link href="/support">Open travel support</Link></div></section></div></div><TripUpdateFeed /><TripMediaGallery /><DocumentList bookingCode={booking.data.bookingCode} /></> : <section className="route-safety"><Navigation size={18} /><div><b>{unresolvedTitle}</b><p>{booking.isError ? "Verify the booking ID and traveler access, then try again or contact travel support." : "Live location, host updates, media, and documents are shown only after a traveler booking has been resolved."}</p><Link href={booking.isError ? "/access" : "/trips"}>{booking.isError ? "Open booking access" : "Go to My Trips"}</Link></div></section>}</div></VoyagrShell>;
}

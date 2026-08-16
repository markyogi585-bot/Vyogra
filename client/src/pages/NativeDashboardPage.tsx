import { useEffect } from "react";
import { ArrowRight, CalendarDays, CloudSun, Compass, Headphones, Heart, MapPinned, Search, TicketCheck, UserRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { VoyagrShell } from "@/components/VoyagrShell";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import { trpc } from "@/lib/trpc";
import { catalog } from "@/lib/voyagrData";

type DeskAction = { label: string; note: string; icon: typeof Compass; href?: string; onClick?: () => void; tone: string };

export default function NativeDashboardPage() {
  const { profile, openAuth, openSearch } = useTravelSession(); const [, setLocation] = useLocation();
  const campaignQuery = trpc.campaigns.activeWidgets.useQuery(undefined, { retry: false });
  const trips = trpc.bookings.mine.useQuery(undefined, { enabled: Boolean(profile), retry: false });
  const activeTrip = trips.data?.find((trip) => trip.status === "active");
  useEffect(() => { if (activeTrip?.bookingCode) setLocation(`/trip/${activeTrip.bookingCode}`); }, [activeTrip?.bookingCode, setLocation]);
  const route = catalog[1] ?? catalog[0];
  const actions: DeskAction[] = [
    { label: "Explore packages", note: "Routes and stays", icon: Compass, href: "/explore", tone: "violet" },
    { label: "Search anywhere", note: "Place or mood", icon: Search, onClick: openSearch, tone: "navy" },
    { label: "Booking ID", note: "Trip desk & invoice", icon: TicketCheck, href: "/access", tone: "coral" },
    { label: "My trips", note: "Tickets and live map", icon: CalendarDays, href: "/trips", tone: "mint" },
    profile ? { label: "Travel weather", note: "Conditions on your route", icon: CloudSun, href: "/trips", tone: "gold" } : { label: "Secure sign in", note: "Save travel plans", icon: UserRound, onClick: () => openAuth("account"), tone: "gold" },
    { label: "Traveler support", note: "Help from a human", icon: Headphones, href: "/support", tone: "sky" },
  ];
  return <VoyagrShell title="TRAVEL DESK"><div className="native-desk"><section className="native-desk-topline"><span>{profile ? `WELCOME BACK, ${profile.name.toUpperCase()}` : "VOYAGR / TRAVEL DESK"}</span><button onClick={openSearch}><Search size={16} /> Search the route library</button></section><section className="native-hero-card"><img src={route.image} alt={route.name} /><div className="native-hero-shade" /><div className="native-hero-copy"><span><MapPinned size={13} /> {route.location}</span><h1>{profile ? <>Your next good<br /><i>elsewhere.</i></> : <>Start with a place<br /><i>that feels right.</i></>}</h1><p>Routes designed with real time, considered stays, and a team behind the details.</p><Link href={`/package/${route.id}`}>Explore {route.name} <ArrowRight size={16} /></Link></div><div className="native-hero-float"><b>{route.duration}</b><span>From ₹{route.price.toLocaleString("en-IN")}</span></div></section><section className="native-desk-section"><div className="native-section-heading"><div><span>YOUR TRAVEL TOOLS</span><h2>Everything in one<br /><i>quiet place.</i></h2></div><Link href="/explore">All routes <ArrowRight size={15} /></Link></div><div className="native-service-grid">{actions.map(({ label, note, icon: Icon, href, onClick, tone }) => href ? <Link href={href} key={label} className={`native-service-card ${tone}`}><span><Icon size={20} /></span><b>{label}</b><small>{note}</small><ArrowRight size={14} /></Link> : <button type="button" onClick={onClick} key={label} className={`native-service-card ${tone}`}><span><Icon size={20} /></span><b>{label}</b><small>{note}</small><ArrowRight size={14} /></button>)}</div></section><section className="native-desk-section"><div className="native-section-heading"><div><span>LIVE NOW</span><h2>One reason to<br /><i>go soon.</i></h2></div><Link href="/explore">Discover <ArrowRight size={15} /></Link></div>{campaignQuery.isLoading ? <div className="native-offer-loading">Checking today’s travel notes…</div> : campaignQuery.data?.[0] ? <article className="native-live-offer"><div><span>{campaignQuery.data[0].kind.replace("_", " ")}</span><h3>{campaignQuery.data[0].title}</h3><p>{campaignQuery.data[0].body}</p></div><Link href={campaignQuery.data[0].deepLink || "/explore"}>Open offer <ArrowRight size={16} /></Link></article> : <article className="native-live-offer empty"><div><span>TRAVEL NOTE</span><h3>Every good trip starts with a route.</h3><p>Campaigns appear here when the travel team activates them.</p></div><Link href="/explore">Browse routes <ArrowRight size={16} /></Link></article>}</section><section className="native-desk-foot"><Heart size={18} /><div><b>Save the ones you love.</b><span>Wishlist routes and return when the timing works.</span></div><button onClick={() => profile ? window.location.assign("/wishlist") : openAuth("wishlist")}>Open saved</button></section></div></VoyagrShell>;
}

import { ArrowUpRight, Copy } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { nativeOffers } from "@/lib/nativeData";

export function OfferRail() { return <section className="native-section native-offers"><div className="native-section-heading"><div><span>OFFERS FOR THE ROAD</span><h2>Good timing, <i>beautifully placed.</i></h2></div><Link href="/explore">View all <ArrowUpRight size={16} /></Link></div><div className="native-offer-rail">{nativeOffers.map((offer) => <Link href={offer.href} key={offer.id} className={`native-offer-card ${offer.className}`}><span>{offer.eyebrow}</span><h3>{offer.title}</h3><p>{offer.body}</p><button onClick={(event) => { event.preventDefault(); event.stopPropagation(); navigator.clipboard?.writeText(offer.code); toast(`${offer.code} copied for your next booking.`); }}><Copy size={13} /> {offer.code}</button></Link>)}</div></section>; }

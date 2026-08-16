import { useEffect } from "react";
import { ArrowLeft, CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { VoyagrShell } from "@/components/VoyagrShell";

export default function TripSharePage({ token }: { token: string }) {
  const share = trpc.tripShare.resolve.useQuery({ token }, { retry: false });
  useEffect(() => {
    if (!share.data) return;
    document.title = `${share.data.title} · VOYAGR`;
    const canonical = document.querySelector('link[rel="canonical"]') ?? document.createElement("link");
    canonical.setAttribute("rel", "canonical"); canonical.setAttribute("href", `${window.location.origin}/share/${token}`);
    if (!canonical.parentElement) document.head.appendChild(canonical);
    const setMeta = (property: string, content: string) => { const node = document.querySelector(`meta[property="${property}"]`) ?? document.createElement("meta"); node.setAttribute("property", property); node.setAttribute("content", content); if (!node.parentElement) document.head.appendChild(node); };
    setMeta("og:title", `${share.data.title} · VOYAGR`); setMeta("og:description", share.data.message ?? "A privacy-safe trip summary from VOYAGR."); setMeta("og:url", `${window.location.origin}/share/${token}`); if (share.data.imageUrl) setMeta("og:image", share.data.imageUrl);
  }, [share.data, token]);
  if (share.isLoading) return <VoyagrShell title="SHARED TRIP"><section className="trip-share-page trip-share-state"><ShieldCheck size={28} /><h1>Opening the shared trip.</h1><p>Checking the link validity and preparing a privacy-safe route card.</p></section></VoyagrShell>;
  if (!share.data) return <VoyagrShell title="SHARED TRIP"><section className="trip-share-page trip-share-state"><ShieldCheck size={28} /><h1>This trip card is no longer available.</h1><p>The link may have expired or been revoked by the traveler.</p><Link href="/explore"><ArrowLeft size={15} /> Explore VOYAGR routes</Link></section></VoyagrShell>;
  return <VoyagrShell title="SHARED TRIP"><main className="trip-share-page"><Link className="back-link" href="/explore"><ArrowLeft size={14} /> VOYAGR route library</Link><article className="trip-share-card"><div className="trip-share-media">{share.data.imageUrl ? <img src={share.data.imageUrl} alt="" /> : <div className="trip-share-media-fallback"><MapPin size={34} /></div>}<span>SHARED TRIP CARD</span></div><div className="trip-share-copy"><span className="admin-overline">A ROUTE WORTH SHARING</span><h1>{share.data.title}</h1><p>{share.data.message ?? "A privacy-safe trip summary from VOYAGR."}</p><div className="trip-share-meta"><span><MapPin size={14} /> {share.data.destination}</span><span><CalendarDays size={14} /> {share.data.durationDays} days · {share.data.durationNights} nights</span></div><small><ShieldCheck size={13} /> No traveler contact, invoice, or live-location data is shown on this page.</small><Link className="trip-share-cta" href="/explore">Plan your own route</Link></div></article></main></VoyagrShell>;
}

export function TripSharePreviewMarkup({ title, description, imageUrl, url }: { title: string; description: string; imageUrl?: string | null; url: string }) {
  return <><title>{title} · VOYAGR</title><meta name="description" content={description} /><link rel="canonical" href={url} /><meta property="og:type" content="article" /><meta property="og:title" content={`${title} · VOYAGR`} /><meta property="og:description" content={description} />{imageUrl && <meta property="og:image" content={imageUrl} />}<meta property="og:url" content={url} /><meta name="twitter:card" content="summary_large_image" /></>;
}

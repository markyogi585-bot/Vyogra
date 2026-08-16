import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, CloudSun, Compass, Heart, MapPin, Search, TicketCheck, UserRound } from "lucide-react";
import { Link } from "wouter";
import { ExploreActionGrid } from "@/components/ExploreActionGrid";
import { PageIntro, VoyagrShell } from "@/components/VoyagrShell";
import { DynamicHeroSlider } from "@/components/home/DynamicHeroSlider";
import { LiveTripCompanionCard } from "@/components/home/LiveTripCompanionCard";
import { CustomerReviewsSection } from "@/components/home/CustomerReviewsSection";
import { DevoteePhotoGallery } from "@/components/home/DevoteePhotoGallery";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import { trpc } from "@/lib/trpc";
import { catalog } from "@/lib/voyagrData";
import { usePackages } from "@/hooks/usePackages";

import { handleImgError } from "@/lib/imageFallback";

export default function Home() {
  const { profile, locale, openAuth, openSearch } = useTravelSession();
  const hindi = locale === "hi-IN";
  const { packages } = usePackages();
  const [activeCategory, setActiveCategory] = useState("all");

  const displayPackages = useMemo(() => {
    const list = packages && packages.length > 0 ? packages : catalog;
    if (activeCategory === "all") return list.slice(0, 6);
    if (activeCategory === "pilgrimage") {
      return list.filter(
        (p) =>
          (p.category || "").toLowerCase().includes("pilgrim") ||
          (p.tag || "").toLowerCase().includes("sacred") ||
          (p.tag || "").toLowerCase().includes("dham") ||
          (p.tag || "").toLowerCase().includes("aarti"),
      );
    }
    if (activeCategory === "heritage") {
      return list.filter(
        (p) =>
          (p.category || "").toLowerCase().includes("heritage") ||
          (p.name || "").toLowerCase().includes("rajasthan") ||
          (p.tag || "").toLowerCase().includes("royal"),
      );
    }
    if (activeCategory === "leisure") {
      return list.filter(
        (p) =>
          (p.category || "").toLowerCase().includes("beach") ||
          (p.category || "").toLowerCase().includes("nature") ||
          (p.name || "").toLowerCase().includes("goa") ||
          (p.location || "").toLowerCase().includes("kerala"),
      );
    }
    if (activeCategory === "mountain") {
      return list.filter(
        (p) =>
          (p.category || "").toLowerCase().includes("mountain") ||
          (p.name || "").toLowerCase().includes("himalaya") ||
          (p.location || "").toLowerCase().includes("uttarakhand"),
      );
    }
    return list.slice(0, 6);
  }, [packages, activeCategory]);

  const campaignQuery = trpc.campaigns.activeWidgets.useQuery(undefined, { retry: false });
  const primaryOffer = campaignQuery.data?.[0];
  const copy = hindi
    ? {
        kicker: "हर हर महादेव टूर्स एंड ट्रेवल्स", title: <>पवित्र तीर्थ व सुखद यात्रा<br /><i>अपना मनपसंद टूर चुनें।</i></>, body: "पहले यात्रा पैकेज और सुविधाएं देखें। बुकिंग, लाइव अपडेट और टिकट के लिए आसानी से जुड़ें।", searchLabel: "यात्रा खोजें", search: "कहाँ की यात्रा करनी है?", booked: "पहले से बुक है?", booking: "बुकिंग ID से खोलें", account: profile ? "यात्री डेस्क" : "अकाउंट लॉगिन", accountAction: profile ? "मेरी यात्राएं" : "सुरक्षित लॉगिन", tools: "यात्रा सुविधाएं / 01", toolsTitle: <>सफर को आसान बनाने वाली<br /><i>खास सुविधाएं।</i></>, campaign: "लाइव ऑफर / 02", campaignTitle: <>आज का विशेष यात्रा<br /><i>ऑफर व छूट।</i></>, routes: "प्रसिद्ध टूर पैकेज / 03", routesTitle: <>तीर्थ दर्शन व दर्शनीय स्थल<br /><i>सम्पूर्ण भारत भ्रमण।</i></>, explore: "सभी टूर देखें", allRoutes: "सभी टूर पैकेज देखें", view: "विस्तार देखें", access: "BOOKING ID एक्सेस", accessBody: "क्या आपने पहले बुकिंग कराई है?", accessAction: "अपनी लाइव यात्रा खोलें",
      }
    : {
        kicker: "HAR HAR MAHADEV TOURS & TRAVELS", title: <>Sacred Pilgrimage & Scenic Tours<br /><i>Thoughtfully Curated for You.</i></>, body: "Explore verified pilgrimage, hill stations & cultural routes. Book online with instant WhatsApp confirmation & live desk.", searchLabel: "SEARCH DESTINATIONS", search: "Where would you like to travel?", booked: "ALREADY BOOKED?", booking: "Open with Booking ID", account: profile ? "TRAVELER DESK" : "ACCOUNT ACCESS", accountAction: profile ? "Open my trips" : "Sign in securely", tools: "TRAVEL SERVICES / 01", toolsTitle: <>Everything you need<br /><i>for a blessed journey.</i></>, campaign: "SEASONAL OFFERS / 02", campaignTitle: <>Special discounts &<br /><i>seasonal yatra departures.</i></>, routes: "FEATURED PACKAGES / 03", routesTitle: <>Memorable journeys with<br /><i>comfort & devotion.</i></>, explore: "All packages", allRoutes: "See all tour packages", view: "View details", access: "BOOKING-ID ACCESS", accessBody: "Already received your booking confirmation code?", accessAction: "Open your trip companion",
      };
  const actions = [
    { label: hindi ? "Routes khojein" : "Explore routes", note: hindi ? "Har package dekhiye" : "Search every package", icon: Compass, href: "/explore", accent: "sage" as const },
    { label: hindi ? "Booking kholiye" : "Open booking", note: hindi ? "Apni booking ID use karein" : "Use your booking ID", icon: TicketCheck, href: "/access", accent: "clay" as const },
    { label: hindi ? "Meri yatraen" : "My trips", note: hindi ? "Tickets aur live status" : "Tickets and live status", icon: CalendarDays, href: "/trips", accent: "mist" as const },
    profile
      ? { label: hindi ? "Trip weather" : "Trip weather", note: hindi ? "Route conditions dekhiye" : "See conditions on your route", icon: CloudSun, href: "/trips", accent: "sand" as const }
      : { label: hindi ? "Sign in karein" : "Sign in to continue", note: hindi ? "Trips aur documents save karein" : "Save trips and documents", icon: UserRound, onActivate: () => openAuth("account"), accent: "sand" as const },
  ];
  const campaignContent = campaignQuery.isLoading
    ? <div className="explore-live-offer-empty">{hindi ? "Aaj ke offers check ho rahe hain…" : "Loading today’s travel notes…"}</div>
    : campaignQuery.isError
      ? <div className="explore-live-offer-empty">{hindi ? "Aaj ke offers abhi load nahi ho paaye. Available routes dekhiye." : "Today’s offers could not load. Browse available routes instead."}<br /><Link href="/explore">{hindi ? "Available routes dekhiye" : "Browse all available routes"} <ArrowRight size={15} /></Link></div>
      : primaryOffer
        ? <article className={`explore-live-offer ${primaryOffer.kind === "flash_sale" ? "flash" : ""}`}><div><span>{primaryOffer.kind.replace("_", " ")}</span><h3>{primaryOffer.title}</h3><p>{primaryOffer.body}</p></div><Link href={primaryOffer.deepLink || "/explore"}>{hindi ? "Details dekhiye" : "View details"} <ArrowRight size={16} /></Link></article>
        : <div className="explore-live-offer-empty">{hindi ? "Abhi koi live campaign scheduled nahi hai." : "No campaign is scheduled right now."}<br /><Link href="/explore">{hindi ? "Available routes dekhiye" : "Browse all available routes"} <ArrowRight size={15} /></Link></div>;

  return (
    <VoyagrShell title="HOME">
      <div className="platform-page explore-home-page">
        {/* Active Cookie-Locked Live Trip Desk */}
        <LiveTripCompanionCard />

        {/* Dynamic Framer-Motion Hero Banner Slider */}
        <DynamicHeroSlider />

        <PageIntro kicker={copy.kicker} title={copy.title} body={copy.body} />
        
        <section className="explore-home-command">
          <button onClick={openSearch}>
            <Search size={21} />
            <div>
              <small>{copy.searchLabel}</small>
              <b>{copy.search}</b>
            </div>
            <ArrowRight size={18} />
          </button>
          <Link href="/access">
            <TicketCheck size={20} />
            <div>
              <small>{copy.booked}</small>
              <b>{copy.booking}</b>
            </div>
            <ArrowRight size={18} />
          </Link>
          <Link
            href={profile ? "/trips" : "/account"}
            onClick={(event) => {
              if (!profile) {
                event.preventDefault();
                openAuth("account");
              }
            }}
          >
            <UserRound size={20} />
            <div>
              <small>{copy.account}</small>
              <b>{copy.accountAction}</b>
            </div>
            <ArrowRight size={18} />
          </Link>
        </section>

        <section className="home-explore-section">
          <div className="home-explore-heading">
            <div>
              <span>{copy.tools}</span>
              <h2>{copy.toolsTitle}</h2>
            </div>
          </div>
          <ExploreActionGrid actions={actions} />
        </section>

        <section className="home-explore-section">
          <div className="home-explore-heading">
            <div>
              <span>{copy.campaign}</span>
              <h2>{copy.campaignTitle}</h2>
            </div>
            <Link href="/explore">
              {copy.explore} <ArrowRight size={16} />
            </Link>
          </div>
          {campaignContent}
        </section>

        <section className="home-explore-section">
          <div className="home-explore-heading">
            <div>
              <span>{copy.routes}</span>
              <h2>{copy.routesTitle}</h2>
            </div>
            <Link href="/explore">
              {copy.allRoutes} <ArrowRight size={16} />
            </Link>
          </div>

          {/* Dual Category Filter Chips (Devotee Sacred Yatra + Normal / Leisure Tours) */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 12 }}>
            {[
              { id: "all", label: hindi ? "सम्पूर्ण यात्राएं (All Tours)" : "All Tour Packages" },
              { id: "pilgrimage", label: hindi ? "🚩 पावन धाम दर्शन (Sacred Yatra)" : "🚩 Sacred Devotee Yatra" },
              { id: "heritage", label: hindi ? "🏰 रॉयल हेरिटेज (Heritage Tours)" : "🏰 Royal Heritage" },
              { id: "leisure", label: hindi ? "🏖️ हॉलिडे व समुद्र तट (Leisure & Beach)" : "🏖️ Leisure & Beaches" },
              { id: "mountain", label: hindi ? "🏔️ देवभूमि व हिमालय (Scenic Mountains)" : "🏔️ Scenic Mountains" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 24,
                  border: activeCategory === tab.id ? "1.5px solid #f06a3a" : "1px solid rgba(0,0,0,0.1)",
                  background: activeCategory === tab.id ? "#f06a3a" : "#ffffff",
                  color: activeCategory === tab.id ? "#ffffff" : "#183a37",
                  fontSize: 12,
                  fontWeight: activeCategory === tab.id ? 800 : 600,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  boxShadow: activeCategory === tab.id ? "0 4px 12px rgba(240,106,58,0.25)" : "none",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="home-route-library">
            {displayPackages.map((route, index) => (
              <Link href={`/package/${route.id}`} className="explore-card" key={route.id}>
                <div className="explore-image">
                  <img src={route.image} alt={route.name} onError={handleImgError} />
                  <span>{route.tag || route.category}</span>
                  <b className="explore-index">0{index + 1}</b>
                </div>
                <div className="explore-card-copy">
                  <div className="explore-card-top">
                    <span>{route.duration}</span>
                    <Heart size={17} />
                  </div>
                  <h2>{route.name}</h2>
                  <p>
                    <MapPin size={14} /> {route.location}
                  </p>
                  <div className="explore-card-bottom">
                    <strong>From ₹{route.price.toLocaleString("en-IN")}</strong>
                    <span>
                      {copy.view} <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            <aside className="explore-journey-note">
              <span>{copy.access}</span>
              <p>{copy.accessBody}</p>
              <Link href="/access">{copy.accessAction} <ArrowRight size={16} /></Link>
            </aside>
          </div>
        </section>

        {/* Sacred Yatra Devotee Photo Gallery */}
        <DevoteePhotoGallery />

        {/* Live Motion Customer Testimonials */}
        <CustomerReviewsSection />
      </div>
    </VoyagrShell>
  );
}

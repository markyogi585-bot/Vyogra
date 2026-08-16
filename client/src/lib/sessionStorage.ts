/**
 * VOYAGR — Session, Cookie & URL State System
 * Handles:
 * - Cookie-based auth persistence
 * - URL state sync for package/booking flows
 * - Booking intent preservation across page refreshes
 * - Verified Trip Desk Cookie Lock (Auto-lands on Live Trip Desk)
 */

// ─── Cookie helpers ──────────────────────────────────────────────────────────

export function setCookie(name: string, value: string, days = 30): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function deleteCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

// ─── Session cookie keys ─────────────────────────────────────────────────────

export const COOKIES = {
  authToken: "vg_auth",
  locale: "vg_locale",
  bookingIntent: "vg_intent",
  selectedPackage: "vg_pkg",
  travelerCount: "vg_tc",
  departureDate: "vg_date",
  lastRoute: "vg_route",
  adminSession: "vg_admin",
  coupon: "vg_coupon",
  lockedTrip: "vg_locked_trip",
  unlockedDesk: "vg_unlocked_desk",
} as const;

// ─── Verified Trip Desk Cookie Lock System ───────────────────────────────────

export interface LockedTripDesk {
  bookingCode: string;
  packageName: string;
  location: string;
  travelDate: string;
  travelerName: string;
  phone: string;
  status: string;
  approvalStatus: "pending_manual_review" | "approved" | "rejected";
  hostName?: string;
  hostPhone?: string;
  hostWhatsapp?: string;
  lockedAt: string;
}

export function lockTripToCookie(trip: LockedTripDesk): void {
  setCookie(COOKIES.lockedTrip, JSON.stringify(trip), 60);
  setCookie(COOKIES.unlockedDesk, trip.bookingCode, 60);
}

export function getLockedTripFromCookie(): LockedTripDesk | null {
  const raw = getCookie(COOKIES.lockedTrip);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LockedTripDesk;
  } catch {
    return null;
  }
}

export function clearLockedTripCookie(): void {
  deleteCookie(COOKIES.lockedTrip);
  deleteCookie(COOKIES.unlockedDesk);
}

/** Check URL for ?id= or ?booking= or ?code= and auto-lock into cookies */
export async function checkAndLockBookingFromUrl(): Promise<LockedTripDesk | null> {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const code = params.get("id") || params.get("booking") || params.get("bookingId") || params.get("code");
  if (!code) return null;

  try {
    const { getBookingByCode } = await import("./firebaseBookings");
    const booking = await getBookingByCode(code.trim().toUpperCase());
    if (booking) {
      const lockedDesk: LockedTripDesk = {
        bookingCode: booking.bookingCode,
        packageName: booking.packageName,
        location: booking.packageLocation,
        travelDate: booking.travelDate || "Scheduled Departure",
        travelerName: booking.travelerName,
        phone: booking.phone,
        status: booking.status,
        approvalStatus: booking.approvalStatus,
        hostName: booking.hostContact?.name || booking.hostContact?.assignedHostName,
        hostPhone: booking.hostContact?.phone || booking.hostContact?.assignedHostPhone,
        hostWhatsapp: booking.hostContact?.whatsapp || booking.hostContact?.assignedHostWhatsapp,
        lockedAt: new Date().toISOString(),
      };
      lockTripToCookie(lockedDesk);
      return lockedDesk;
    }
  } catch (err) {
    console.warn("Could not auto-lock booking from URL query:", err);
  }
  return null;
}

// ─── Booking intent persistence ──────────────────────────────────────────────

export interface BookingIntent {
  packageId: string;
  packageName: string;
  travelerCount: number;
  departureDate?: string;
}

export function saveBookingIntent(intent: BookingIntent): void {
  setCookie(COOKIES.bookingIntent, JSON.stringify(intent), 7);
}

export function getBookingIntent(): BookingIntent | null {
  const raw = getCookie(COOKIES.bookingIntent);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BookingIntent;
  } catch {
    return null;
  }
}

export function clearBookingIntent(): void {
  deleteCookie(COOKIES.bookingIntent);
}

// ─── URL state sync ──────────────────────────────────────────────────────────

/** Parse URL query params into a typed object */
export function getUrlParams(): Record<string, string> {
  const params: Record<string, string> = {};
  new URLSearchParams(window.location.search).forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

/** Build a URL with query params merged */
export function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  if (!params) return path;
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `${path}?${qs}` : path;
}

/** Extract package search state from URL */
export function getPackageUrlState(): {
  query: string;
  category: string;
  sort: string;
  view: "grid" | "list";
} {
  const p = getUrlParams();
  return {
    query: p.q ?? "",
    category: p.cat ?? "All routes",
    sort: p.sort ?? "Popular",
    view: (p.view === "list" ? "list" : "grid") as "grid" | "list",
  };
}

/** Push package filter state to URL without reload */
export function pushPackageUrlState(state: {
  query?: string;
  category?: string;
  sort?: string;
  view?: string;
}): void {
  const current = getUrlParams();
  const next = { ...current };
  if (state.query !== undefined) { if (state.query) next.q = state.query; else delete next.q; }
  if (state.category && state.category !== "All routes") next.cat = state.category;
  else delete next.cat;
  if (state.sort && state.sort !== "Popular") next.sort = state.sort;
  else delete next.sort;
  if (state.view && state.view !== "grid") next.view = state.view;
  else delete next.view;

  const qs = Object.entries(next).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState({}, "", url);
}

// ─── Page meta tags ──────────────────────────────────────────────────────────

export interface PageMeta {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  keywords?: string;
  structuredData?: object;
}

export function setPageMeta(meta: PageMeta): void {
  // Title
  document.title = meta.title;

  // Helpers
  const setMeta = (name: string, content: string, attr = "name") => {
    let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.content = content;
  };

  const setLink = (rel: string, href: string) => {
    let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement("link");
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
  };

  // Standard meta
  setMeta("description", meta.description);
  if (meta.keywords) setMeta("keywords", meta.keywords);

  // OG
  setMeta("og:title", meta.title, "property");
  setMeta("og:description", meta.description, "property");
  setMeta("og:type", meta.ogType ?? "website", "property");
  setMeta("og:site_name", "Har Har Mahadev Tours & Travels", "property");
  if (meta.ogImage) setMeta("og:image", meta.ogImage, "property");

  // Twitter
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", meta.title);
  setMeta("twitter:description", meta.description);
  if (meta.ogImage) setMeta("twitter:image", meta.ogImage);

  // Canonical
  if (meta.canonical) setLink("canonical", meta.canonical);

  // Structured data (JSON-LD)
  if (meta.structuredData) {
    const id = "mahadev-json-ld";
    let existing = document.getElementById(id) as HTMLScriptElement | null;
    if (!existing) {
      existing = document.createElement("script");
      existing.id = id;
      existing.type = "application/ld+json";
      document.head.appendChild(existing);
    }
    existing.textContent = JSON.stringify(meta.structuredData);
  }
}

/** Standard SEO configs for each page */
export const PAGE_META: Record<string, PageMeta> = {
  home: {
    title: "Har Har Mahadev Tours & Travels — हर हर महादेव टूर्स एंड ट्रेवल्स",
    description: "Curated pilgrimage yatras and tour packages across India. Kedarnath, Char Dham, Kashi Vishwanath, Rajasthan & more.",
    keywords: "har har mahadev tours, chardham yatra, kedarnath tour, kashi vishwanath, pilgrimage tours india",
    ogImage: "https://img.freepik.com/premium-vector/happy-maha-shivratri-lord-shiva-modern-logo-design-har-har-mahadev-hindi-calligraphy_428817-1867.jpg",
    ogType: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      name: "Har Har Mahadev Tours & Travels",
      description: "Sacred Pilgrimages and Curated Travel Packages across India.",
      url: "https://harharmahadevtours.com",
      areaServed: { "@type": "Country", name: "India" },
    },
  },
  explore: {
    title: "Explore Tour Packages — Har Har Mahadev Tours & Travels",
    description: "Browse sacred yatras and holiday packages across India. Haridwar, Rishikesh, Kedarnath, Rajasthan, and mountain retreats.",
    keywords: "tour packages india, chardham yatra package, kedarnath packages, rajasthan tour",
    ogImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
  },
  trips: {
    title: "My Trips & Yatras — Har Har Mahadev Tours & Travels",
    description: "View and manage your Har Har Mahadev travel bookings, upcoming journeys, documents, and invoices.",
    keywords: "my bookings, travel history, trip management, booking status",
  },
  account: {
    title: "My Profile — Har Har Mahadev Tours & Travels",
    description: "Manage your Har Har Mahadev traveler profile, saved routes, and preferences.",
    keywords: "traveler profile, yatra account",
  },
  support: {
    title: "Support & Helpline — Har Har Mahadev Tours & Travels",
    description: "Get help from the Har Har Mahadev support team. Open a live request or reach us directly on WhatsApp.",
    keywords: "travel support, helpline, contact har har mahadev",
  },
  notifications: {
    title: "Notifications — Har Har Mahadev Tours & Travels",
    description: "Stay up to date with yatra updates, special offers, and announcements from Har Har Mahadev Tours & Travels.",
    keywords: "yatra announcements, special offers, updates",
  },
};

export function packageDetailMeta(pkg: {
  name: string;
  location: string;
  description: string;
  price: number;
  image: string;
  duration: string;
  tag?: string;
  id?: string;
}): PageMeta {
  return {
    title: `${pkg.name} — ${pkg.location} | Har Har Mahadev Tours & Travels`,
    description: `${pkg.description} ${pkg.duration} from ₹${pkg.price.toLocaleString("en-IN")} per person. ${pkg.tag ?? ""}`,
    keywords: `${pkg.name.toLowerCase()}, ${pkg.location.toLowerCase()}, india tour package, pilgrimage yatra, ${pkg.duration.toLowerCase()}`,
    ogImage: pkg.image,
    ogType: "product",
    canonical: pkg.id ? `https://harharmahadevtours.com/package/${pkg.id}` : undefined,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: pkg.name,
      description: pkg.description,
      image: pkg.image,
      offers: {
        "@type": "Offer",
        price: pkg.price,
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
      },
      brand: { "@type": "Brand", name: "Har Har Mahadev Tours & Travels" },
    },
  };
}

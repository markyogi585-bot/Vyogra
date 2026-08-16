/**
 * Firebase Dynamic Hero Banners Service
 * Collection: `heroBanners`
 */
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { firebaseDb } from "./firebase";
import { voyageImages } from "./voyagrData";

export interface HeroBanner {
  id?: string;
  badge: string; // e.g. "NEW ROUTE / 2026", "SEASONAL ESCAPE"
  title: string; // e.g. "Monsoon in the Western Ghats"
  subtitle: string; // e.g. "Mist-covered peaks, private plantations, and slow mornings."
  imageUrl: string;
  ctaText: string; // e.g. "Explore Route"
  ctaLink: string; // e.g. "/explore?cat=Mountains"
  accentColor?: string;
  active: boolean;
  order: number;
  createdAt?: unknown;
}

export const defaultBanners: HeroBanner[] = [
  {
    id: "default-1",
    badge: "SACRED YATRA / 2026",
    title: "Kedarnath & Badrinath Dham Yatra",
    subtitle: "Guaranteed helicopter passes, VIP temple darshan, and pure satvik mountain hospitality.",
    imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&auto=format&fit=crop&q=85",
    ctaText: "Book Kedarnath Yatra",
    ctaLink: "/package/kedarnath",
    active: true,
    order: 1,
  },
  {
    id: "default-2",
    badge: "HOLY GANGA / 2026",
    title: "Kashi Vishwanath & Ganga Aarti",
    subtitle: "Private sunrise boat ride, Dashashwamedh Aarti pass, and heritage temple guide.",
    imageUrl: "https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=1600&auto=format&fit=crop&q=85",
    ctaText: "Explore Kashi Tour",
    ctaLink: "/package/varanasi",
    active: true,
    order: 2,
  },
  {
    id: "default-3",
    badge: "12 JYOTIRLINGA DARSHAN",
    title: "Mahakaleshwar & Somnath Tour",
    subtitle: "Bhasma Aarti booking assistance, verified clean AC transport, and dedicated yatra host.",
    imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1600&auto=format&fit=crop&q=85",
    ctaText: "View Jyotirlinga Circuit",
    ctaLink: "/package/jyotirlinga",
    active: true,
    order: 3,
  },
  {
    id: "default-4",
    badge: "RAM LALLA DARSHAN / 2026",
    title: "Ayodhya Ram Mandir & Prayagraj",
    subtitle: "Sacred Sangam snan, Ram Janmabhoomi VIP pass, and comfortable deluxe accommodation.",
    imageUrl: "https://images.unsplash.com/photo-1627894483216-2138af692e32?w=1600&auto=format&fit=crop&q=85",
    ctaText: "Book Ayodhya Yatra",
    ctaLink: "/package/ayodhya",
    active: true,
    order: 4,
  },
];

const COLLECTION = "heroBanners_v2";

const DELETED_KEY = "voyagr-deleted-hero-banners";
const CUSTOM_KEY = "voyagr-custom-hero-banners";

function getDeletedBannerIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalCustomBanners(): HeroBanner[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCustomBanner(banner: HeroBanner) {
  try {
    const list = getLocalCustomBanners();
    const existingIdx = list.findIndex((b) => b.id === banner.id);
    if (existingIdx >= 0) {
      list[existingIdx] = banner;
    } else {
      list.push(banner);
    }
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
  } catch {
    // ignore storage error
  }
}

function markBannerDeleted(id: string) {
  try {
    const deleted = getDeletedBannerIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
    }
    // Also remove from custom list if present
    const custom = getLocalCustomBanners().filter((b) => b.id !== id);
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom));
  } catch {
    // ignore
  }
}

function getFilteredBanners(rawList: HeroBanner[]): HeroBanner[] {
  const deletedIds = getDeletedBannerIds();
  const customList = getLocalCustomBanners();
  const map = new Map<string, HeroBanner>();

  // Add base list excluding deleted
  rawList.forEach((b) => {
    if (b.id && !deletedIds.includes(b.id)) {
      map.set(b.id, b);
    }
  });

  // Add local custom list
  customList.forEach((b) => {
    if (b.id && !deletedIds.includes(b.id)) {
      map.set(b.id, b);
    }
  });

  return Array.from(map.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export const subscribeToActiveBanners = subscribeToHeroBanners;

/**
 * Realtime listener for active Hero Banners on Homepage.
 */
export function subscribeToHeroBanners(
  callback: (banners: HeroBanner[]) => void,
): Unsubscribe {
  if (!firebaseDb) {
    callback(getFilteredBanners(defaultBanners).filter((b) => b.active !== false));
    return () => {};
  }
  try {
    const q = query(collection(firebaseDb, COLLECTION), orderBy("order", "asc"));
    return onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const firestoreList = snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as HeroBanner,
        );
        const combined = firestoreList.length > 0 ? firestoreList : defaultBanners;
        const final = getFilteredBanners(combined).filter((b) => b.active !== false);
        callback(final.length > 0 ? final : defaultBanners);
      },
      () => {
        callback(getFilteredBanners(defaultBanners).filter((b) => b.active !== false));
      },
    );
  } catch {
    callback(getFilteredBanners(defaultBanners).filter((b) => b.active !== false));
    return () => {};
  }
}

/** Subscribe to ALL banners for Admin */
export function subscribeToAllBannersAdmin(
  callback: (banners: HeroBanner[]) => void,
): Unsubscribe {
  if (!firebaseDb) {
    callback(getFilteredBanners(defaultBanners));
    return () => {};
  }
  try {
    const q = query(collection(firebaseDb, COLLECTION), orderBy("order", "asc"));
    return onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const firestoreList = snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as HeroBanner,
        );
        const combined = firestoreList.length > 0 ? firestoreList : defaultBanners;
        callback(getFilteredBanners(combined));
      },
      () => {
        callback(getFilteredBanners(defaultBanners));
      },
    );
  } catch {
    callback(getFilteredBanners(defaultBanners));
    return () => {};
  }
}

/** Create banner */
export async function createHeroBanner(banner: Omit<HeroBanner, "id">): Promise<string> {
  const localId = `bnr_${Date.now()}`;
  const bannerObj: HeroBanner = { id: localId, ...banner };
  saveLocalCustomBanner(bannerObj);

  if (firebaseDb) {
    try {
      const col = collection(firebaseDb, COLLECTION);
      const docRef = await addDoc(col, {
        ...banner,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch {
      // Fallback already saved locally
    }
  }
  return localId;
}

/** Update banner */
export async function updateHeroBanner(id: string, banner: Partial<HeroBanner>): Promise<void> {
  const existing = getLocalCustomBanners().find((b) => b.id === id);
  if (existing) {
    saveLocalCustomBanner({ ...existing, ...banner });
  }

  if (firebaseDb && !id.startsWith("default-")) {
    try {
      const ref = doc(firebaseDb, COLLECTION, id);
      await updateDoc(ref, {
        ...banner,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Fallback updated locally
    }
  }
}

/** Delete banner */
export async function deleteHeroBanner(id: string): Promise<void> {
  markBannerDeleted(id);

  if (firebaseDb && !id.startsWith("default-")) {
    try {
      const ref = doc(firebaseDb, COLLECTION, id);
      await deleteDoc(ref);
    } catch {
      // Handled via local tombstone
    }
  }
}

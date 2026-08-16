/**
 * Firebase Packages Service
 * Firestore se packages read/write karne ke liye
 * Collection: `packages`
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { firebaseDb } from "./firebase";

export interface FirebasePackage {
  id?: string;
  name: string;
  location: string;
  duration: string;
  days: number;
  nights: number;
  price: number;
  category: string;
  image: string;
  tag: string;
  description: string;
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
  itinerary?: { day: number; title: string; description: string }[];
  galleryImages?: string[];
  cancellationPolicy?: string;
  termsAndConditions?: string;
  guidelines?: string;
  childPrice?: number;
  departureSlots?: string[];
  transportClass?: string;
  hotelTier?: string;
  maxGroupSize?: number;
  minGroupSize?: number;
  whatsappGroupLink?: string;
  status: "live" | "draft" | "archived";
  sortOrder?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
}

const COLLECTION = "packages";

function getCollection() {
  if (!firebaseDb) throw new Error("Firestore not configured");
  return collection(firebaseDb, COLLECTION);
}

/** Saare live packages fetch karo */
export async function getAllPackages(): Promise<FirebasePackage[]> {
  if (!firebaseDb) return [];
  try {
    const q = query(
      getCollection(),
      where("status", "==", "live"),
      orderBy("sortOrder", "asc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() }) as FirebasePackage);
  } catch {
    // Fallback without orderBy if index not ready
    try {
      const snapshot = await getDocs(query(getCollection(), where("status", "==", "live")));
      return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() }) as FirebasePackage);
    } catch {
      return [];
    }
  }
}

/** Admin ke liye saare packages (draft + live + archived) */
export async function getAllPackagesAdmin(): Promise<FirebasePackage[]> {
  if (!firebaseDb) return [];
  try {
    const snapshot = await getDocs(getCollection());
    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() }) as FirebasePackage);
  } catch {
    return [];
  }
}

/** ID se ek package fetch karo */
export async function getPackageById(id: string): Promise<FirebasePackage | null> {
  if (!firebaseDb) return null;
  try {
    const ref = doc(firebaseDb, COLLECTION, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as FirebasePackage;
  } catch {
    return null;
  }
}

const DELETED_KEY = "voyagr-deleted-packages";
const CUSTOM_KEY = "voyagr-custom-packages";

function getDeletedPackageIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalCustomPackages(): FirebasePackage[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCustomPackage(pkg: FirebasePackage) {
  try {
    const list = getLocalCustomPackages();
    const existingIdx = list.findIndex((p) => p.id === pkg.id);
    if (existingIdx >= 0) {
      list[existingIdx] = pkg;
    } else {
      list.push(pkg);
    }
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function markPackageDeleted(id: string) {
  try {
    const deleted = getDeletedPackageIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
    }
    const custom = getLocalCustomPackages().filter((p) => p.id !== id);
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom));
  } catch {
    // ignore
  }
}

function getFilteredPackages(rawList: FirebasePackage[]): FirebasePackage[] {
  const deletedIds = getDeletedPackageIds();
  const customList = getLocalCustomPackages();
  const map = new Map<string, FirebasePackage>();

  rawList.forEach((p) => {
    if (p.id && !deletedIds.includes(p.id)) {
      map.set(p.id, p);
    }
  });

  customList.forEach((p) => {
    if (p.id && !deletedIds.includes(p.id)) {
      map.set(p.id, p);
    }
  });

  return Array.from(map.values()).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

/** Package create karo */
export async function createPackage(
  data: Omit<FirebasePackage, "id" | "createdAt" | "updatedAt">,
  adminUid: string,
): Promise<string> {
  const localId = `pkg_${Date.now()}`;
  const newPkg: FirebasePackage = {
    id: localId,
    ...data,
    status: data.status || "live",
    createdBy: adminUid,
  };
  saveLocalCustomPackage(newPkg);

  if (firebaseDb) {
    try {
      const docRef = await addDoc(getCollection(), {
        ...data,
        status: data.status || "live",
        createdBy: adminUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch {
      // Saved locally
    }
  }
  return localId;
}

/** Package update karo */
export async function updatePackage(
  id: string,
  data: Partial<Omit<FirebasePackage, "id" | "createdAt" | "updatedAt">>,
): Promise<void> {
  // Always update in localStorage (merge with existing local OR create stub entry)
  const localList = getLocalCustomPackages();
  const existingIdx = localList.findIndex((p) => p.id === id);
  if (existingIdx >= 0) {
    localList[existingIdx] = { ...localList[existingIdx], ...data };
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(localList));
  } else {
    // Package exists only in Firestore — add a local override record
    const stub: FirebasePackage = {
      id,
      name: data.name || "Package",
      location: data.location || "",
      duration: data.duration || "",
      days: data.days || 1,
      nights: data.nights || 0,
      price: data.price || 0,
      category: data.category || "Pilgrimage",
      image: data.image || "",
      tag: data.tag || "",
      description: data.description || "",
      status: data.status || "live",
      ...data,
    };
    localList.push(stub);
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(localList));
  }

  if (firebaseDb) {
    try {
      const ref = doc(firebaseDb, COLLECTION, id);
      await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("[Packages] Firestore update failed, saved locally:", e);
    }
  }
}

/** Package delete karo (soft delete — status archived karo) */
export async function archivePackage(id: string): Promise<void> {
  if (!firebaseDb) return;
  const ref = doc(firebaseDb, COLLECTION, id);
  await updateDoc(ref, { status: "archived", updatedAt: serverTimestamp() });
}

/** Package permanently delete karo */
export async function deletePackage(id: string): Promise<void> {
  markPackageDeleted(id);

  if (firebaseDb) {
    try {
      const ref = doc(firebaseDb, COLLECTION, id);
      await deleteDoc(ref);
    } catch {
      // Handled via local tombstone
    }
  }
}

/** Real-time listener for live packages */
export function subscribeToPackages(
  callback: (packages: FirebasePackage[]) => void,
): Unsubscribe {
  if (!firebaseDb) {
    callback(getFilteredPackages([]));
    return () => {};
  }
  try {
    const q = query(getCollection(), where("status", "==", "live"), orderBy("sortOrder", "asc"));
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const pkgs = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() }) as FirebasePackage);
        callback(getFilteredPackages(pkgs));
      },
      () => {
        // Fallback without ordering
        try {
          const q2 = query(getCollection(), where("status", "==", "live"));
          return onSnapshot(q2, (snap2: QuerySnapshot<DocumentData>) => {
            const pkgs2 = snap2.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as FirebasePackage);
            callback(getFilteredPackages(pkgs2));
          });
        } catch {
          callback(getFilteredPackages([]));
        }
      },
    );
  } catch {
    callback(getFilteredPackages([]));
    return () => {};
  }
}

/** Seed karo initial packages if collection empty hai */
export async function seedPackagesIfEmpty(adminUid: string): Promise<boolean> {
  if (!firebaseDb) return false;
  const snapshot = await getDocs(getCollection());
  if (!snapshot.empty) return false;

  const seeds: Omit<FirebasePackage, "id" | "createdAt" | "updatedAt">[] = [
    {
      name: "Kedarnath & Badrinath Dham Yatra",
      location: "Haridwar · Guptkashi · Kedarnath · Badrinath",
      duration: "5 nights · 6 days",
      days: 6,
      nights: 5,
      price: 18500,
      category: "Pilgrimage",
      image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&auto=format&fit=crop&q=85",
      tag: "Most Sacred",
      description:
        "Sacred Himalayan pilgrimage with VIP temple passes, verified mountain hotels, and pure satvik meals.",
      highlights: ["Kedarnath Temple Darshan", "Badrinath Aarti & Mana Village", "Guptkashi & Devprayag Sangam"],
      inclusions: ["Deluxe Hotel Stay", "Pure Satvik Breakfast & Dinner", "Dedicated AC Chauffeur", "VIP Temple Pass Assistance"],
      exclusions: ["Helicopter / Pony charges", "Personal pooja samagri", "Medical insurance"],
      itinerary: [
        { day: 1, title: "Haridwar to Guptkashi", description: "Scenic drive via Devprayag & Rudraprayag sangams. Hotel check-in." },
        { day: 2, title: "Guptkashi to Kedarnath", description: "Helicopter transfer / trek to Kedarnath. Evening Aarti & night stay." },
        { day: 3, title: "Kedarnath to Guptkashi", description: "Early morning Mahadev Darshan. Return trek to Guptkashi." },
        { day: 4, title: "Guptkashi to Badrinath", description: "Drive to Badrinath via Joshimath. Evening Tapt Kund & Aarti." },
        { day: 5, title: "Badrinath to Rishikesh", description: "Visit Mana Village, Vyas Gufa, and drive to Rishikesh." },
        { day: 6, title: "Rishikesh & Departure", description: "Ganga Aarti, Ram Jhula, and drop at Haridwar railway/airport." },
      ],
      maxGroupSize: 15,
      minGroupSize: 1,
      status: "live",
      sortOrder: 1,
      createdBy: adminUid,
    },
    {
      name: "Kashi Vishwanath & Ganga Aarti Darshan",
      location: "Varanasi · Sarnath · Prayagraj",
      duration: "3 nights · 4 days",
      days: 4,
      nights: 3,
      price: 9999,
      category: "Pilgrimage",
      image: "https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=1200&auto=format&fit=crop&q=85",
      tag: "Divine Aarti",
      description:
        "Ganga Aarti boat pass at Dashashwamedh Ghat, Kashi Vishwanath VIP Darshan & Sarnath excursion.",
      highlights: ["Kashi Vishwanath Corridor VIP Darshan", "Evening Ganga Aarti Boat Pass", "Triveni Sangam Prayagraj Dip"],
      inclusions: ["3-Star Hotel Stay", "Breakfast daily", "AC private car transfers", "Private Boat at Ganga Ghats"],
      exclusions: ["Train / Flight tickets", "Personal pooja dakshina"],
      status: "live",
      sortOrder: 2,
      createdBy: adminUid,
    },
    {
      name: "12 Jyotirlinga Mahakal & Somnath Tour",
      location: "Ujjain · Omkareshwar · Somnath · Dwarka",
      duration: "6 nights · 7 days",
      days: 7,
      nights: 6,
      price: 21500,
      category: "Pilgrimage",
      image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&auto=format&fit=crop&q=85",
      tag: "Mahakal Bhasma",
      description:
        "Holy Bhasma Aarti booking, AC private vehicle, pure Satvik thali, and dedicated pilgrim coordinator.",
      highlights: ["Ujjain Mahakaleshwar Bhasma Aarti", "Somnath Temple Light & Sound Show", "Dwarkadhish Darshan & Bet Dwarka"],
      inclusions: ["AC Deluxe Hotel", "All Satvik Meals", "AC Coach / Innova", "Tour Coordinator"],
      exclusions: ["Personal expenses"],
      status: "live",
      sortOrder: 3,
      createdBy: adminUid,
    },
    {
      name: "Ayodhya Ram Mandir & Prayagraj",
      location: "Ayodhya · Prayagraj · Varanasi",
      duration: "4 nights · 5 days",
      days: 5,
      nights: 4,
      price: 12800,
      category: "Pilgrimage",
      image: "https://images.unsplash.com/photo-1627894483216-2138af692e32?w=1200&auto=format&fit=crop&q=85",
      tag: "Ram Lalla",
      description:
        "Ram Janmabhoomi Darshan, Hanumangarhi pooja, Triveni Sangam holy dip, and luxury stay.",
      highlights: ["Grand Ram Lalla Darshan", "Sarayu River Aarti", "Sangam Boat Ride"],
      inclusions: ["Deluxe Hotel", "Breakfast & Dinner", "Private AC Cab"],
      exclusions: ["Flights / Trains"],
      status: "live",
      sortOrder: 4,
      createdBy: adminUid,
    },
    {
      name: "Complete Uttarakhand Char Dham Yatra",
      location: "Yamunotri · Gangotri · Kedarnath · Badrinath",
      duration: "9 nights · 10 days",
      days: 10,
      nights: 9,
      price: 34999,
      category: "Pilgrimage",
      image: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=1200&auto=format&fit=crop&q=85",
      tag: "Four Dhams",
      description:
        "All 4 holy Dhams covered with verified luxury coaches, medical support & all pooja arrangements.",
      highlights: ["Yamunotri & Gangotri Darshan", "Kedarnath & Badrinath VIP Darshan", "Rishikesh Ganga Aarti"],
      inclusions: ["Deluxe Hotel Stays", "All Pure Satvik Meals", "Dedicated AC Transport", "Priest Pooja Coordination"],
      exclusions: ["Helicopter charges", "Personal expenses"],
      status: "live",
      sortOrder: 5,
      createdBy: adminUid,
    },
    {
      name: "Haridwar & Rishikesh Ganga Aarti Tour",
      location: "Haridwar · Rishikesh · Neelkanth",
      duration: "3 nights · 4 days",
      days: 4,
      nights: 3,
      price: 7999,
      category: "Pilgrimage",
      image: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&auto=format&fit=crop&q=85",
      tag: "Ganga Darshan",
      description: "Triveni Ghat Ganga Aarti, Ram Jhula & Laxman Jhula sightseeing, and Ganga holy snan pass.",
      highlights: ["Triveni Ghat Evening Maha Aarti", "Ram Jhula & Paramarth Niketan", "Neelkanth Mahadev Mandir Darshan"],
      inclusions: ["Deluxe Hotel Stay", "Breakfast & Dinner", "AC Car Sightseeing"],
      exclusions: ["Personal pooja expenses"],
      status: "live",
      sortOrder: 6,
      createdBy: adminUid,
    },
    {
      name: "Goa Coastal Beach & Heritage Holiday",
      location: "North Goa · South Goa · Calangute · Panaji",
      duration: "4 nights · 5 days",
      days: 5,
      nights: 4,
      price: 14500,
      category: "Beaches",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=85",
      tag: "Beach Holiday",
      description: "Relaxing coastal tour with private AC cab, pristine white beaches, heritage churches, and sunset cruise.",
      highlights: ["Calangute & Baga Beach watersports", "Old Goa Basilicas", "Mandovi River Sunset Cruise"],
      inclusions: ["Beach Resort Stay", "Breakfast Daily", "Private AC Cab Transfers", "Cruise Passes"],
      exclusions: ["Flight tickets"],
      status: "live",
      sortOrder: 7,
      createdBy: adminUid,
    },
    {
      name: "Kerala Backwaters & Munnar Hills",
      location: "Kochi · Munnar · Alleppey · Thekkady",
      duration: "5 nights · 6 days",
      days: 6,
      nights: 5,
      price: 17999,
      category: "Nature",
      image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&auto=format&fit=crop&q=85",
      tag: "Serene Nature",
      description: "Alleppey luxury houseboat cruise, Munnar lush tea gardens, spice plantations & private AC transport.",
      highlights: ["Alleppey Houseboat Stay with all meals", "Munnar Tea Garden Treks", "Thekkady Spice Plantations"],
      inclusions: ["Deluxe Hotels & Houseboat", "Daily Breakfast & Meals on Houseboat", "Private AC Transport"],
      exclusions: ["Flights"],
      status: "live",
      sortOrder: 8,
      createdBy: adminUid,
    },
  ];

  for (const pkg of seeds) {
    await createPackage(pkg, adminUid);
  }
  return true;
}

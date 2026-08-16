/**
 * Firebase Campaigns / Announcements Service
 * Replaces tRPC campaigns endpoint with Firestore real-time
 * Collection: `campaigns`
 */
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { firebaseDb } from "./firebase";

export type CampaignType = "offer" | "announcement" | "alert" | "daily_deal" | "route_update";
export type CampaignStatus = "draft" | "active" | "expired" | "paused";

export interface FirebaseCampaign {
  id?: string;
  type: CampaignType;
  title: string;
  body: string;
  image?: string;
  actionLabel?: string;
  actionUrl?: string;
  targetAudience?: "all" | "booked" | "premium" | string;
  startsAt?: string | null; // ISO string
  endsAt?: string | null;
  status: CampaignStatus;
  packageId?: string;
  discountCode?: string;
  discountAmount?: number;
  priority?: number;
  createdBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

const COLLECTION = "campaigns";

function getCol() {
  if (!firebaseDb) throw new Error("Firestore not configured");
  return collection(firebaseDb, COLLECTION);
}

/** Real-time active announcements (public) */
export function subscribeToActiveAnnouncements(
  callback: (campaigns: FirebaseCampaign[]) => void,
): Unsubscribe {
  if (!firebaseDb) {
    callback([]);
    return () => {};
  }
  try {
    const q = query(
      getCol(),
      where("status", "==", "active"),
      orderBy("priority", "desc"),
    );
    return onSnapshot(q, (snap) => {
      const now = new Date().toISOString();
      const active = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as FirebaseCampaign)
        .filter((c) => !c.endsAt || c.endsAt > now)
        .filter((c) => !c.startsAt || c.startsAt <= now);
      callback(active);
    }, () => {
      // Fallback without ordering
      try {
        const q2 = query(getCol(), where("status", "==", "active"));
        onSnapshot(q2, (snap2) => {
          callback(snap2.docs.map((d) => ({ id: d.id, ...d.data() }) as FirebaseCampaign));
        });
      } catch { callback([]); }
    });
  } catch {
    callback([]);
    return () => {};
  }
}

/** Get all announcements (admin) */
export async function getAllCampaigns(): Promise<FirebaseCampaign[]> {
  if (!firebaseDb) return [];
  try {
    const snap = await getDocs(query(getCol(), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirebaseCampaign);
  } catch {
    const snap = await getDocs(getCol());
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FirebaseCampaign);
  }
}

/** Create campaign (admin) */
export async function createCampaign(
  data: Omit<FirebaseCampaign, "id" | "createdAt" | "updatedAt">,
  adminUid: string,
): Promise<string> {
  const col = getCol();
  const ref = await addDoc(col, {
    ...data,
    createdBy: adminUid,
    priority: data.priority ?? 10,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Update campaign status */
export async function updateCampaignStatus(
  id: string,
  status: CampaignStatus,
): Promise<void> {
  if (!firebaseDb) return;
  const ref = doc(firebaseDb, COLLECTION, id);
  await updateDoc(ref, { status, updatedAt: serverTimestamp() });
}

/** Delete campaign */
export async function deleteCampaign(id: string): Promise<void> {
  if (!firebaseDb) return;
  await deleteDoc(doc(firebaseDb, COLLECTION, id));
}

/** Seed a daily deal for a package */
export async function seedDailyDeal(
  pkg: { id: string; name: string; image: string; price: number },
  adminUid: string,
): Promise<string> {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  return createCampaign({
    type: "daily_deal",
    title: `Today's Featured Route: ${pkg.name}`,
    body: `Book this curated journey at ₹${pkg.price.toLocaleString("en-IN")} per person. Limited slots available.`,
    image: pkg.image,
    actionLabel: "View & Book",
    actionUrl: `/package/${pkg.id}`,
    status: "active",
    packageId: pkg.id,
    startsAt: new Date().toISOString(),
    endsAt: `${tomorrow}T23:59:59.000Z`,
    targetAudience: "all",
    priority: 100,
  }, adminUid);
}

/** Seed initial welcome announcement if empty */
export async function seedAnnouncementsIfEmpty(adminUid: string): Promise<boolean> {
  if (!firebaseDb) return false;
  const snap = await getDocs(getCol());
  if (!snap.empty) return false;

  await createCampaign({
    type: "announcement",
    title: "Welcome to Har Har Mahadev Tours & Travels",
    body: "India's sacred pilgrimage yatras and curated travel routes are now live. Haridwar, Rishikesh, Kedarnath, Kashi Vishwanath, Rajasthan & more.",
    status: "active",
    targetAudience: "all",
    priority: 50,
    startsAt: new Date().toISOString(),
    endsAt: null,
  }, adminUid);

  await createCampaign({
    type: "offer",
    title: "Monsoon Special — Use GOA2500",
    body: "Get ₹2,500 off on any Goa package this season. Apply code GOA2500 at checkout.",
    status: "active",
    targetAudience: "all",
    discountCode: "GOA2500",
    discountAmount: 2500,
    priority: 80,
    startsAt: new Date().toISOString(),
    endsAt: null,
  }, adminUid);

  return true;
}

/** Campaign icon helper */
export function campaignIcon(type: CampaignType): string {
  return {
    offer: "🏷️",
    announcement: "📢",
    alert: "⚠️",
    daily_deal: "⭐",
    route_update: "🗺️",
  }[type] ?? "📣";
}

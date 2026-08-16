/**
 * Firebase Admin Service
 * Admin dashboard ke liye real-time stats, user management
 * Collections: `bookings`, `travelerProfiles`, `packages`, `adminStats`
 */
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { firebaseDb } from "./firebase";
import type { FirebaseBooking } from "./firebaseBookings";

export interface AdminStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  totalTravelers: number;
  totalPackages: number;
  monthlyRevenue: number;
  monthlyBookings: number;
  openRequests: number;
  lastUpdated?: unknown;
}

export interface TravelerProfile {
  uid: string;
  name: string;
  displayName?: string;
  email: string;
  phone: string;
  photoURL?: string;
  city?: string;
  emergencyPhone?: string;
  emailVerified?: boolean;
  provider: string;
  role: "user" | "sub_admin" | "admin" | "super_admin";
  status?: "active" | "suspended" | "warned";
  createdAt?: unknown;
  updatedAt?: unknown;
  lastLoginAt?: unknown;
}

/** Real-time admin dashboard stats compute karo from bookings */
export function subscribeToAdminStats(
  callback: (stats: AdminStats) => void,
): Unsubscribe {
  if (!firebaseDb) {
    callback({
      totalBookings: 0,
      confirmedBookings: 0,
      pendingBookings: 0,
      totalRevenue: 0,
      totalTravelers: 0,
      totalPackages: 0,
      monthlyRevenue: 0,
      monthlyBookings: 0,
      openRequests: 0,
    });
    return () => {};
  }

  const bookingsCol = collection(firebaseDb, "bookings");
  return onSnapshot(bookingsCol, async (snap: QuerySnapshot<DocumentData>) => {
    const bookings = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as FirebaseBooking);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const confirmed = bookings.filter((b: FirebaseBooking) => b.status === "confirmed" || b.status === "documents_ready" || b.status === "on_trip");
    const pending = bookings.filter((b: FirebaseBooking) => b.status === "pending_approval" || b.status === "awaiting_payment" || b.status === "in_review");
    const totalRevenue = bookings.filter((b: FirebaseBooking) => b.status !== "cancelled").reduce((sum: number, b: FirebaseBooking) => sum + (b.grandTotal || 0), 0);

    // Monthly bookings
    const monthlyBookings = bookings.filter((b: FirebaseBooking) => {
      if (!b.createdAt) return false;
      const ts = (b.createdAt as { toDate?: () => Date }).toDate?.();
      return ts && ts >= monthStart;
    });
    const monthlyRevenue = monthlyBookings.filter((b: FirebaseBooking) => b.status !== "cancelled").reduce((sum: number, b: FirebaseBooking) => sum + (b.grandTotal || 0), 0);

    // Travelers count
    let totalTravelers = 1;
    let totalPackages = 0;
    try {
      const travelersSnap = await getDocs(collection(firebaseDb!, "travelerProfiles"));
      totalTravelers = Math.max(1, travelersSnap.size);
    } catch {
      totalTravelers = 1;
    }

    try {
      const packagesSnap = await getDocs(query(collection(firebaseDb!, "packages"), where("status", "==", "live")));
      totalPackages = packagesSnap.size;
    } catch { totalPackages = 0; }

    callback({
      totalBookings: bookings.length,
      confirmedBookings: confirmed.length,
      pendingBookings: pending.length,
      totalRevenue,
      totalTravelers,
      totalPackages,
      monthlyRevenue,
      monthlyBookings: monthlyBookings.length,
      openRequests: pending.length,
    });
  }, () => {
    callback({
      totalBookings: 0,
      confirmedBookings: 0,
      pendingBookings: 0,
      totalRevenue: 0,
      totalTravelers: 1,
      totalPackages: 0,
      monthlyRevenue: 0,
      monthlyBookings: 0,
      openRequests: 0,
    });
  });
}

/** Saare traveler profiles fetch karo (admin) */
export async function getAllTravelers(): Promise<TravelerProfile[]> {
  if (!firebaseDb) return [];
  try {
    const q = query(collection(firebaseDb, "travelerProfiles"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ uid: d.id, ...d.data() }) as TravelerProfile);
  } catch {
    try {
      const snap = await getDocs(collection(firebaseDb, "travelerProfiles"));
      return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ uid: d.id, ...d.data() }) as TravelerProfile);
    } catch {
      return [];
    }
  }
}

/** Real-time travelers listener (admin) */
export function subscribeToTravelers(
  callback: (travelers: TravelerProfile[]) => void,
): Unsubscribe {
  // Always include locally created sessions (fast-pass, offline login)
  function getLocalTravelers(): TravelerProfile[] {
    try {
      const raw = localStorage.getItem("voyagr-session-profile");
      if (!raw) return [];
      const stored = JSON.parse(raw);
      if (!stored?.uid || stored.role === "super_admin" || stored.role === "admin") return [];
      return [{
        uid: stored.uid,
        name: stored.name || stored.email || "Traveler",
        displayName: stored.name,
        email: stored.email || "",
        phone: stored.phone || "",
        provider: stored.loginMethod || "local",
        role: "user",
        emailVerified: stored.emailVerified || false,
      }];
    } catch {
      return [];
    }
  }

  if (!firebaseDb) {
    callback(getLocalTravelers());
    return () => {};
  }

  return onSnapshot(collection(firebaseDb, "travelerProfiles"), (snap: QuerySnapshot<DocumentData>) => {
    const firestoreList = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
      const data = d.data();
      return {
        uid: d.id,
        name: data.name || data.displayName || "Traveler",
        email: data.email || "",
        phone: data.phone || "",
        provider: data.provider || "firebase",
        role: data.role || "user",
        ...data,
      } as TravelerProfile;
    });

    const localList = getLocalTravelers();
    const mergedMap = new Map<string, TravelerProfile>();
    firestoreList.forEach((t) => mergedMap.set(t.uid, t));
    localList.forEach((t) => { if (!mergedMap.has(t.uid)) mergedMap.set(t.uid, t); });

    callback(Array.from(mergedMap.values()));
  }, () => {
    callback(getLocalTravelers());
  });
}

/** User ka role update karo */
export async function updateTravelerStatus(
  uid: string,
  status: "active" | "suspended" | "warned",
): Promise<void> {
  if (!firebaseDb) return;
  const ref = doc(firebaseDb, "travelerProfiles", uid);
  await updateDoc(ref, { status, updatedAt: serverTimestamp() });
}

/** Traveler profile get karo by UID */
export async function getTravelerProfile(uid: string): Promise<TravelerProfile | null> {
  if (!firebaseDb) return null;
  try {
    const ref = doc(firebaseDb, "travelerProfiles", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { uid: snap.id, ...snap.data() } as TravelerProfile;
  } catch {
    return null;
  }
}

/** Admin audit log mein entry add karo */
export async function logAdminAction(
  adminUid: string,
  action: string,
  target: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (!firebaseDb) return;
  try {
    const auditCol = collection(firebaseDb, "adminAuditLog");
    await setDoc(doc(auditCol), {
      adminUid,
      action,
      target,
      metadata: metadata ?? {},
      timestamp: serverTimestamp(),
    });
  } catch {
    // Audit log non-critical
  }
}

/** Support tickets fetch karo (admin) */
export async function getSupportTickets() {
  if (!firebaseDb) return [];
  try {
    const snap = await getDocs(
      query(collection(firebaseDb, "supportTickets"), orderBy("createdAt", "desc")),
    );
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

/** Support ticket status update karo */
export async function updateSupportTicketStatus(
  ticketId: string,
  status: "open" | "in_progress" | "resolved",
): Promise<void> {
  if (!firebaseDb) return;
  const ref = doc(firebaseDb, "supportTickets", ticketId);
  await updateDoc(ref, { status, updatedAt: serverTimestamp() });
}

/** INR format karo */
export function formatRevenue(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Delete a specific booking by ID (Admin) */
export async function deleteBookingById(bookingId: string): Promise<void> {
  if (!firebaseDb) return;
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(firebaseDb, "bookings", bookingId));
}

/** Purge all test/demo bookings */
export async function purgeAllTestBookings(): Promise<number> {
  if (!firebaseDb) return 0;
  const { deleteDoc } = await import("firebase/firestore");
  const snap = await getDocs(collection(firebaseDb, "bookings"));
  let deleted = 0;
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const code = (data.bookingCode || "").toUpperCase();
    if (code.includes("DEMO") || code.includes("TEST") || data.notes?.includes("test") || data.travelerName?.toLowerCase().includes("test")) {
      await deleteDoc(docSnap.ref);
      deleted++;
    }
  }
  return deleted;
}

/** Clear all bookings for fresh production launch */
export async function purgeAllBookings(): Promise<number> {
  if (!firebaseDb) return 0;
  const { deleteDoc } = await import("firebase/firestore");
  const snap = await getDocs(collection(firebaseDb, "bookings"));
  let deleted = 0;
  for (const docSnap of snap.docs) {
    await deleteDoc(docSnap.ref);
    deleted++;
  }
  return deleted;
}

/**
 * Firebase Bookings Service
 * Firestore collection: `bookings`
 * Handles Manual Approval, Verification Call Tracking, WhatsApp dispatch, and Cookie Lock Desk
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { firebaseDb } from "./firebase";
import { lockTripToCookie } from "./sessionStorage";

export type BookingStatus =
  | "pending_approval"
  | "confirmed"
  | "awaiting_payment"
  | "in_review"
  | "documents_ready"
  | "on_trip"
  | "completed"
  | "cancelled";

export interface HostContactInfo {
  name: string;
  phone: string;
  whatsapp: string;
  assignedHostName?: string;
  assignedHostPhone?: string;
  assignedHostWhatsapp?: string;
  assignedVehicle?: string;
  notes?: string;
}

export interface PassengerInfo {
  id?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  age?: number | string;
  gender?: "male" | "female" | "other" | string;
  idType?: string;
  idNumber?: string;
  govtIdType?: string;
  govtIdNumber?: string;
  address?: string;
  city?: string;
  roomSharing?: string;
  mealPref?: string;
  mealPreference?: string;
  berthPreference?: string;
  travelClass?: string;
}

export interface FirebaseBooking {
  id?: string;
  bookingCode: string; // e.g. VYG-2026-89421
  userId: string; // Firebase UID
  packageId: string; // Firestore package doc ID
  packageName: string;
  packageLocation: string;
  packageDuration: string;
  packageImage?: string;

  // Traveler & Passenger Roster
  travelerName: string;
  phone: string;
  email: string;
  travelerCount: number;
  adultsCount?: number;
  childrenCount?: number;
  passengers?: PassengerInfo[];
  travelDate?: string;
  specialRequests?: string;

  // Pricing
  basePrice?: number;
  subtotal: number;
  addOnTotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  couponCode?: string;

  // Status & Manual Approval Lifecycle
  status: BookingStatus;
  approvalStatus: "pending_manual_review" | "approved" | "rejected";
  approvedAt?: unknown;
  approvedBy?: string;
  verificationCallDone?: boolean;
  verificationCallNotes?: string;
  whatsappDispatched?: boolean;

  // Host / Companion Desk
  hostContact?: HostContactInfo;
  cookieLockCode?: string;

  // Invoices, Notes & Metadata
  invoiceNumber?: string;
  adminNotes?: string;
  notes?: string;
  selectedAddons?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

const COLLECTION = "bookings";

function getCollection() {
  if (!firebaseDb) throw new Error("Firestore is not initialized");
  return collection(firebaseDb, COLLECTION);
}

export function generateBookingCode(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `VYG-${year}-${random}`;
}

export function generateInvoiceNumber(bookingCode?: string): string {
  if (bookingCode) return `INV-${bookingCode.replace("VYG-", "")}`;
  return `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
}

const BOOKINGS_CUSTOM_KEY = "voyagr-custom-bookings";
const BOOKINGS_DELETED_KEY = "voyagr-deleted-bookings";

export function getLocalCustomBookings(): FirebaseBooking[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCustomBooking(booking: FirebaseBooking) {
  try {
    const list = getLocalCustomBookings();
    const idx = list.findIndex((b) => b.id === booking.id || b.bookingCode === booking.bookingCode);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...booking };
    } else {
      list.unshift(booking);
    }
    localStorage.setItem(BOOKINGS_CUSTOM_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function markBookingDeleted(idOrCode: string) {
  try {
    const raw = localStorage.getItem(BOOKINGS_DELETED_KEY);
    const deleted: string[] = raw ? JSON.parse(raw) : [];
    if (!deleted.includes(idOrCode)) {
      deleted.push(idOrCode);
      localStorage.setItem(BOOKINGS_DELETED_KEY, JSON.stringify(deleted));
    }
    const custom = getLocalCustomBookings().filter(
      (b) => b.id !== idOrCode && b.bookingCode !== idOrCode,
    );
    localStorage.setItem(BOOKINGS_CUSTOM_KEY, JSON.stringify(custom));
  } catch {
    // ignore
  }
}

export function getDeletedBookingIds(): string[] {
  try {
    const raw = localStorage.getItem(BOOKINGS_DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function mergeAndFilterBookings(firestoreList: FirebaseBooking[]): FirebaseBooking[] {
  const deleted = getDeletedBookingIds();
  const custom = getLocalCustomBookings();
  const map = new Map<string, FirebaseBooking>();

  // Add custom bookings first
  custom.forEach((b) => {
    const key = b.bookingCode || b.id;
    if (key && !deleted.includes(key) && !deleted.includes(b.id || "")) {
      map.set(key, b);
    }
  });

  // Merge Firestore bookings
  firestoreList.forEach((b) => {
    const key = b.bookingCode || b.id;
    if (key && !deleted.includes(key) && !deleted.includes(b.id || "")) {
      map.set(key, { ...(map.get(key) || {}), ...b });
    }
  });

  return Array.from(map.values());
}

/** Create a new booking (starts in pending_approval for manual verification) */
export async function createBooking(
  bookingData: Omit<FirebaseBooking, "id" | "bookingCode" | "status" | "approvalStatus" | "createdAt" | "updatedAt"> & {
    bookingCode?: string;
    status?: BookingStatus;
    approvalStatus?: "pending_manual_review" | "approved" | "rejected";
  },
): Promise<{ id: string; bookingCode: string }> {
  const bookingCode = bookingData.bookingCode ?? generateBookingCode();
  const localId = `bkg_${Date.now()}`;

  const newBooking: FirebaseBooking = {
    id: localId,
    bookingCode,
    status: bookingData.status ?? "pending_approval",
    approvalStatus: bookingData.approvalStatus ?? "pending_manual_review",
    verificationCallDone: false,
    whatsappDispatched: false,
    ...bookingData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Save locally so it appears IMMEDIATELY in Admin & User Desk
  saveLocalCustomBooking(newBooking);

  // 2. Lock to cookie companion desk
  lockTripToCookie({
    bookingCode,
    packageName: bookingData.packageName,
    location: bookingData.packageLocation,
    travelDate: bookingData.travelDate || "Upcoming Departure",
    travelerName: bookingData.travelerName,
    phone: bookingData.phone,
    status: newBooking.status,
    approvalStatus: newBooking.approvalStatus,
    lockedAt: new Date().toISOString(),
  });

  // 3. Sync to Firebase Firestore
  if (firebaseDb) {
    try {
      const docRef = await addDoc(getCollection(), {
        ...bookingData,
        bookingCode,
        status: newBooking.status,
        approvalStatus: newBooking.approvalStatus,
        verificationCallDone: false,
        whatsappDispatched: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      newBooking.id = docRef.id;
      saveLocalCustomBooking(newBooking);
      return { id: docRef.id, bookingCode };
    } catch {
      // Saved locally
    }
  }

  return { id: localId, bookingCode };
}

/** Admin: Manually Approve Booking & Assign Local Host */
export async function approveBookingManual(
  bookingId: string,
  host: HostContactInfo,
  adminUid: string,
): Promise<void> {
  // Update local custom cache
  const localList = getLocalCustomBookings();
  const localB = localList.find((b) => b.id === bookingId || b.bookingCode === bookingId);
  if (localB) {
    localB.status = "confirmed";
    localB.approvalStatus = "approved";
    localB.hostContact = host;
    saveLocalCustomBooking(localB);
  }

  if (firebaseDb) {
    try {
      const ref = doc(firebaseDb, COLLECTION, bookingId);
      const snap = await getDoc(ref);
      const bData = snap.data() as FirebaseBooking | undefined;

      await updateDoc(ref, {
        status: "confirmed" as BookingStatus,
        approvalStatus: "approved",
        approvedAt: serverTimestamp(),
        approvedBy: adminUid,
        hostContact: host,
        updatedAt: serverTimestamp(),
      });

      const finalData = bData || localB;
      if (finalData) {
        lockTripToCookie({
          bookingCode: finalData.bookingCode,
          packageName: finalData.packageName,
          location: finalData.packageLocation,
          travelDate: finalData.travelDate || "Upcoming Departure",
          travelerName: finalData.travelerName,
          phone: finalData.phone,
          status: "confirmed",
          approvalStatus: "approved",
          hostName: host.name,
          hostPhone: host.phone,
          hostWhatsapp: host.whatsapp,
          lockedAt: new Date().toISOString(),
        });
      }
    } catch {
      // Handled via local update
    }
  }
}

/** Admin: Update Full Booking Details including PNR, Seat Allocations, Hotels, & Chauffeur */
export async function updateBookingFullDetails(
  bookingId: string,
  details: {
    status?: BookingStatus;
    pnrNumber?: string;
    seatNumbers?: string;
    travelClass?: string;
    hotelDetails?: string;
    hostName?: string;
    hostPhone?: string;
    vehicle?: string;
    travelDate?: string;
  }
): Promise<void> {
  if (!firebaseDb) return;
  const ref = doc(firebaseDb, COLLECTION, bookingId);
  const snap = await getDoc(ref);
  const bData = snap.data() as FirebaseBooking | undefined;

  const updatePayload: Record<string, any> = {
    ...details,
    updatedAt: serverTimestamp(),
  };

  if (details.hostName) {
    updatePayload.hostContact = {
      name: details.hostName,
      phone: details.hostPhone || "",
      whatsapp: (details.hostPhone || "").replace(/\D/g, ""),
      assignedHostName: details.hostName,
      assignedHostPhone: details.hostPhone || "",
      assignedHostWhatsapp: (details.hostPhone || "").replace(/\D/g, ""),
      assignedVehicle: details.vehicle || "",
    };
  }

  await updateDoc(ref, updatePayload);

  if (bData) {
    lockTripToCookie({
      bookingCode: bData.bookingCode,
      packageName: bData.packageName,
      location: bData.packageLocation,
      travelDate: details.travelDate || bData.travelDate || "Upcoming Departure",
      travelerName: bData.travelerName,
      phone: bData.phone,
      status: details.status || bData.status || "confirmed",
      approvalStatus: "approved",
      hostName: details.hostName || bData.hostContact?.name || "",
      hostPhone: details.hostPhone || bData.hostContact?.phone || "",
      hostWhatsapp: (details.hostPhone || bData.hostContact?.whatsapp || "").replace(/\D/g, ""),
      lockedAt: new Date().toISOString(),
    });
  }
}

/** Admin: Record Verification Call */
export async function recordVerificationCall(
  bookingId: string,
  notes: string,
): Promise<void> {
  if (!firebaseDb) return;
  const ref = doc(firebaseDb, COLLECTION, bookingId);
  await updateDoc(ref, {
    verificationCallDone: true,
    verificationCallNotes: notes,
    updatedAt: serverTimestamp(),
  });
}

/** Update booking status */
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
): Promise<void> {
  // 1. Update localStorage immediately
  const localList = getLocalCustomBookings();
  const localIdx = localList.findIndex((b) => b.id === bookingId || b.bookingCode === bookingId);
  if (localIdx >= 0) {
    localList[localIdx] = { ...localList[localIdx], status, updatedAt: new Date().toISOString() };
    localStorage.setItem(BOOKINGS_CUSTOM_KEY, JSON.stringify(localList));
  }

  // 2. Sync to Firestore
  if (firebaseDb) {
    try {
      const ref = doc(firebaseDb, COLLECTION, bookingId);
      await updateDoc(ref, {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Already saved to localStorage
    }
  }
}

export const DEMO_TEST_BOOKINGS: FirebaseBooking[] = [
  {
    id: "demo-booking-1",
    userId: "user_aarav_sharma",
    bookingCode: "VYG-2026-08456",
    packageId: "kedarnath-chardham-yatra",
    packageName: "Char Dham & Haridwar Yatra",
    packageLocation: "Haridwar · Rishikesh · Kedarnath",
    packageDuration: "7 nights · 8 days",
    packageImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    travelerName: "Aarav Sharma",
    phone: "+91 98765 43210",
    email: "aarav.sharma@example.com",
    travelerCount: 2,
    adultsCount: 2,
    childrenCount: 0,
    travelDate: "15 March 2026",
    basePrice: 24999,
    subtotal: 49998,
    discount: 2000,
    addOnTotal: 1500,
    tax: 2475,
    grandTotal: 51973,
    invoiceNumber: "INV-2026-08456",
    status: "confirmed",
    approvalStatus: "approved",
    verificationCallDone: true,
    verificationCallNotes: "Verified by Operations Desk",
    hostContact: {
      name: "Rameshwar Ji (Chauffeur)",
      phone: "+91 98765 43210",
      whatsapp: "919876543210",
      assignedVehicle: "Innova Crysta (UK-07-AD-2026)",
    },
    passengers: [
      {
        fullName: "Aarav Sharma",
        age: 34,
        gender: "Male",
        govtIdType: "Aadhaar Card",
        govtIdNumber: "XXXX-XXXX-8921",
        roomSharing: "Double Sharing",
        mealPreference: "Pure Veg (No Onion/Garlic)",
      },
      {
        fullName: "Priya Sharma",
        age: 31,
        gender: "Female",
        govtIdType: "Aadhaar Card",
        govtIdNumber: "XXXX-XXXX-4512",
        roomSharing: "Double Sharing",
        mealPreference: "Pure Veg",
      },
    ],
  },
  {
    id: "demo-booking-2",
    userId: "user_vikram_rathore",
    bookingCode: "VYG-2026-99710",
    packageId: "rajasthan-royal-heritage",
    packageName: "Rajasthan Royal Heritage Loop",
    packageLocation: "Jaipur · Jodhpur · Udaipur",
    packageDuration: "5 nights · 6 days",
    packageImage: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&auto=format&fit=crop&q=85",
    travelerName: "Vikramaditya Rathore",
    phone: "+91 99710 88231",
    email: "vikram.rathore@example.com",
    travelerCount: 3,
    adultsCount: 3,
    childrenCount: 0,
    travelDate: "22 March 2026",
    basePrice: 18500,
    subtotal: 55500,
    discount: 3000,
    addOnTotal: 0,
    tax: 2625,
    grandTotal: 55125,
    invoiceNumber: "INV-2026-99710",
    status: "confirmed",
    approvalStatus: "approved",
    verificationCallDone: true,
    hostContact: {
      name: "Sukhdev Singh (Tour Host)",
      phone: "+91 98765 43210",
      whatsapp: "919876543210",
      assignedVehicle: "Tempo Traveller (RJ-14-TA-9971)",
    },
    passengers: [
      {
        fullName: "Vikramaditya Rathore",
        age: 42,
        gender: "Male",
        govtIdType: "Passport",
        govtIdNumber: "Z8921456",
        roomSharing: "Triple Sharing",
        mealPreference: "Standard Veg",
      },
    ],
  },
];

/** Fetch booking by booking code */
export async function getBookingByCode(bookingCode: string): Promise<FirebaseBooking | null> {
  const normalized = bookingCode.trim().toUpperCase();

  // 1. Check local custom bookings
  const localMatch = getLocalCustomBookings().find(
    (b) => b.bookingCode?.toUpperCase() === normalized || b.id === normalized,
  );
  if (localMatch) return localMatch;

  // 2. Check demo test bookings
  const demoMatch = DEMO_TEST_BOOKINGS.find((b) => b.bookingCode === normalized);
  if (demoMatch) return demoMatch;

  if (!firebaseDb) return null;
  try {
    const q = query(getCollection(), where("bookingCode", "==", normalized));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as FirebaseBooking;
  } catch {
    return null;
  }
}

/** Real-time user bookings listener */
export function subscribeToUserBookings(
  userId: string,
  callback: (bookings: FirebaseBooking[]) => void,
): Unsubscribe {
  if (!firebaseDb) {
    const userLocal = getLocalCustomBookings().filter(
      (b) => b.userId === userId || !b.userId,
    );
    callback(mergeAndFilterBookings(userLocal));
    return () => {};
  }
  try {
    const q = query(
      getCollection(),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const firestoreList = snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as FirebaseBooking,
        );
        const userLocal = getLocalCustomBookings().filter(
          (b) => b.userId === userId || !b.userId,
        );
        callback(mergeAndFilterBookings([...userLocal, ...firestoreList]));
      },
      () => {
        const userLocal = getLocalCustomBookings().filter(
          (b) => b.userId === userId || !b.userId,
        );
        callback(mergeAndFilterBookings(userLocal));
      },
    );
  } catch {
    const userLocal = getLocalCustomBookings().filter(
      (b) => b.userId === userId || !b.userId,
    );
    callback(mergeAndFilterBookings(userLocal));
    return () => {};
  }
}

/** Real-time all bookings listener (admin) */
export function subscribeToAllBookings(
  callback: (bookings: FirebaseBooking[]) => void,
): Unsubscribe {
  // Always show real local bookings immediately (never demo/test data)
  const localBookings = getLocalCustomBookings();
  if (!firebaseDb) {
    callback(mergeAndFilterBookings(localBookings));
    return () => {};
  }
  try {
    const q = query(getCollection(), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const firestoreList = snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as FirebaseBooking,
        );
        // Merge: Firestore first (authoritative), then local custom bookings not yet synced
        callback(mergeAndFilterBookings(firestoreList));
      },
      () => {
        // Firestore unavailable - fallback to localStorage only
        callback(mergeAndFilterBookings(getLocalCustomBookings()));
      },
    );
  } catch {
    callback(mergeAndFilterBookings(getLocalCustomBookings()));
    return () => {};
  }
}

/** Status badge helpers */
export function bookingStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    pending_approval: "Manual Review Pending",
    confirmed: "Approved & Verified",
    awaiting_payment: "Awaiting Payment",
    in_review: "Under Verification",
    documents_ready: "Documents Ready",
    on_trip: "Live On Trip",
    completed: "Journey Completed",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
}

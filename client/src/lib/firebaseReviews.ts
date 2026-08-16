/**
 * Firebase Route Reviews Service
 * Collection: `reviews`
 */
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
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

export interface PackageReview {
  id?: string;
  packageId: string;
  packageName: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  title: string;
  body: string;
  travelDate?: string;
  verifiedBooking?: boolean;
  bookingCode?: string;
  status: "approved" | "pending" | "hidden";
  createdAt?: unknown;
}

const COLLECTION = "reviews";

/** Add a new review */
export async function submitReview(
  data: Omit<PackageReview, "id" | "status" | "createdAt">,
): Promise<string> {
  if (!firebaseDb) throw new Error("Firestore not configured");
  const col = collection(firebaseDb, COLLECTION);
  const ref = await addDoc(col, {
    ...data,
    status: "approved" as const,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Get approved reviews for a package */
export function subscribeToPackageReviews(
  packageId: string,
  callback: (reviews: PackageReview[]) => void,
): Unsubscribe {
  if (!firebaseDb) {
    callback([]);
    return () => {};
  }
  try {
    const q = query(
      collection(firebaseDb, COLLECTION),
      where("packageId", "==", packageId),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      callback(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as PackageReview));
    }, () => {
      if (!firebaseDb) return;
      const q2 = query(
        collection(firebaseDb, COLLECTION),
        where("packageId", "==", packageId),
        where("status", "==", "approved"),
      );
      onSnapshot(q2, (snap2: QuerySnapshot<DocumentData>) => {
        callback(snap2.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as PackageReview));
      });
    });
  } catch {
    callback([]);
    return () => {};
  }
}

/** Admin: get all reviews */
export async function getAllReviewsAdmin(): Promise<PackageReview[]> {
  if (!firebaseDb) return [];
  try {
    const q = query(collection(firebaseDb, COLLECTION), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as PackageReview);
  } catch {
    const snap = await getDocs(collection(firebaseDb, COLLECTION));
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as PackageReview);
  }
}

/** Admin: moderate review status */
export async function updateReviewStatus(
  reviewId: string,
  status: "approved" | "pending" | "hidden",
): Promise<void> {
  if (!firebaseDb) return;
  const ref = doc(firebaseDb, COLLECTION, reviewId);
  await updateDoc(ref, { status });
}

/**
 * Firebase Global Broadcasts & Ticker Alerts Service
 * Collection: `broadcasts`
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

export type BroadcastType = "urgent_alert" | "weather_warning" | "flash_offer" | "route_update" | "general_notice";

export interface LiveBroadcast {
  id?: string;
  title: string;
  message: string;
  type: BroadcastType;
  actionText?: string;
  actionLink?: string;
  active: boolean;
  pinned: boolean;
  createdAt?: unknown;
  expiresAt?: unknown;
}

const COLLECTION = "broadcasts";
const LOCAL_BROADCASTS_KEY = "voyagr-custom-broadcasts";
const DELETED_BROADCASTS_KEY = "voyagr-deleted-broadcasts";

function getLocalBroadcasts(): LiveBroadcast[] {
  try {
    const raw = localStorage.getItem(LOCAL_BROADCASTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBroadcasts(list: LiveBroadcast[]) {
  try {
    localStorage.setItem(LOCAL_BROADCASTS_KEY, JSON.stringify(list));
  } catch {}
}

function getDeletedBroadcastIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_BROADCASTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markBroadcastDeleted(id: string) {
  try {
    const deleted = getDeletedBroadcastIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem(DELETED_BROADCASTS_KEY, JSON.stringify(deleted));
    }
  } catch {}
}

/** Create a new broadcast */
export async function createBroadcast(
  data: Omit<LiveBroadcast, "id" | "createdAt">,
): Promise<string> {
  const generatedId = "bc_" + Date.now();
  const newBroadcast: LiveBroadcast = {
    id: generatedId,
    ...data,
    active: data.active ?? true,
    pinned: data.pinned ?? false,
    createdAt: new Date().toISOString(),
  };

  // 1. Save to localStorage immediately
  const localList = getLocalBroadcasts();
  localList.unshift(newBroadcast);
  saveLocalBroadcasts(localList);

  // 2. Trigger real Web Browser Notification
  try {
    const { sendBrowserNotification } = await import("./browserNotifications");
    sendBrowserNotification(`📢 ${data.title}`, {
      body: data.message,
      onClickUrl: data.actionLink || "/explore",
    });
  } catch {}

  // 3. Save to Firestore
  if (firebaseDb) {
    try {
      const col = collection(firebaseDb, COLLECTION);
      const ref = await addDoc(col, {
        ...data,
        active: data.active ?? true,
        pinned: data.pinned ?? false,
        createdAt: serverTimestamp(),
      });
      return ref.id;
    } catch (e) {
      console.warn("[Broadcasts] Firestore save warning:", e);
    }
  }
  return generatedId;
}

/** Subscribe to active live broadcasts for Website users */
export function subscribeToActiveBroadcasts(
  callback: (broadcasts: LiveBroadcast[]) => void,
): Unsubscribe {
  const deleted = getDeletedBroadcastIds();
  const local = getLocalBroadcasts().filter((b) => b.active && !deleted.includes(b.id || ""));

  if (!firebaseDb) {
    callback(local);
    return () => {};
  }

  try {
    const q = query(
      collection(firebaseDb, COLLECTION),
      where("active", "==", true),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const deletedIds = getDeletedBroadcastIds();
        const firestoreList = snap.docs
          .map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as LiveBroadcast)
          .filter((b) => !deletedIds.includes(b.id || ""));

        const mergedMap = new Map<string, LiveBroadcast>();
        firestoreList.forEach((b) => b.id && mergedMap.set(b.id, b));
        getLocalBroadcasts().forEach((b) => {
          if (b.id && !deletedIds.includes(b.id) && b.active) mergedMap.set(b.id, b);
        });

        callback(Array.from(mergedMap.values()));
      },
      () => {
        // Fallback without ordering
        if (!firebaseDb) return;
        onSnapshot(collection(firebaseDb, COLLECTION), (snap2: QuerySnapshot<DocumentData>) => {
          const deletedIds = getDeletedBroadcastIds();
          const firestoreList = snap2.docs
            .map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as LiveBroadcast)
            .filter((b) => b.active && !deletedIds.includes(b.id || ""));

          const mergedMap = new Map<string, LiveBroadcast>();
          firestoreList.forEach((b) => b.id && mergedMap.set(b.id, b));
          getLocalBroadcasts().forEach((b) => {
            if (b.id && !deletedIds.includes(b.id) && b.active) mergedMap.set(b.id, b);
          });
          callback(Array.from(mergedMap.values()));
        });
      },
    );
  } catch {
    callback(local);
    return () => {};
  }
}

/** Subscribe to ALL broadcasts for Admin */
export function subscribeToAllBroadcastsAdmin(
  callback: (broadcasts: LiveBroadcast[]) => void,
): Unsubscribe {
  const deleted = getDeletedBroadcastIds();
  const local = getLocalBroadcasts().filter((b) => !deleted.includes(b.id || ""));

  if (!firebaseDb) {
    callback(local);
    return () => {};
  }

  try {
    const q = query(collection(firebaseDb, COLLECTION), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const deletedIds = getDeletedBroadcastIds();
        const firestoreList = snap.docs
          .map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as LiveBroadcast)
          .filter((b) => !deletedIds.includes(b.id || ""));

        const mergedMap = new Map<string, LiveBroadcast>();
        firestoreList.forEach((b) => b.id && mergedMap.set(b.id, b));
        getLocalBroadcasts().forEach((b) => {
          if (b.id && !deletedIds.includes(b.id)) mergedMap.set(b.id, b);
        });

        callback(Array.from(mergedMap.values()));
      },
      () => {
        if (!firebaseDb) return;
        onSnapshot(collection(firebaseDb, COLLECTION), (snap2: QuerySnapshot<DocumentData>) => {
          const deletedIds = getDeletedBroadcastIds();
          const firestoreList = snap2.docs
            .map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as LiveBroadcast)
            .filter((b) => !deletedIds.includes(b.id || ""));

          const mergedMap = new Map<string, LiveBroadcast>();
          firestoreList.forEach((b) => b.id && mergedMap.set(b.id, b));
          getLocalBroadcasts().forEach((b) => {
            if (b.id && !deletedIds.includes(b.id)) mergedMap.set(b.id, b);
          });
          callback(Array.from(mergedMap.values()));
        });
      },
    );
  } catch {
    callback(local);
    return () => {};
  }
}

/** Toggle broadcast status */
export async function toggleBroadcastStatus(id: string, active: boolean): Promise<void> {
  const local = getLocalBroadcasts().map((b) => (b.id === id ? { ...b, active } : b));
  saveLocalBroadcasts(local);

  if (firebaseDb) {
    try {
      const ref = doc(firebaseDb, COLLECTION, id);
      await updateDoc(ref, { active });
    } catch {}
  }
}

/** Delete broadcast */
export async function deleteBroadcast(id: string): Promise<void> {
  markBroadcastDeleted(id);
  const local = getLocalBroadcasts().filter((b) => b.id !== id);
  saveLocalBroadcasts(local);

  if (firebaseDb) {
    try {
      const ref = doc(firebaseDb, COLLECTION, id);
      await deleteDoc(ref);
    } catch {}
  }
}

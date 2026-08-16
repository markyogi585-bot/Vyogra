import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
  type QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";
import { firebaseDb } from "./firebase";

export interface GalleryPhoto {
  id?: string;
  title: string;
  location: string;
  imageUrl: string;
  uploadedBy?: string;
  category: "pilgrimage" | "heritage" | "mountain" | "general";
  createdAt?: unknown;
}

export const defaultGallery: GalleryPhoto[] = [
  {
    id: "gal-1",
    title: "Kedarnath Dham Temple Darshan",
    location: "Kedarnath, Uttarakhand",
    imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&auto=format&fit=crop&q=85",
    category: "pilgrimage",
  },
  {
    id: "gal-2",
    title: "Ganga Aarti at Dashashwamedh Ghat",
    location: "Varanasi, UP",
    imageUrl: "https://images.unsplash.com/photo-1609342122563-a43ac8917a3a?w=1200&auto=format&fit=crop&q=85",
    category: "pilgrimage",
  },
  {
    id: "gal-3",
    title: "Mahakaleshwar & Somnath 12 Jyotirlinga",
    location: "Ujjain & Somnath",
    imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&auto=format&fit=crop&q=85",
    category: "pilgrimage",
  },
  {
    id: "gal-4",
    title: "Shri Ram Janmabhoomi Mandir",
    location: "Ayodhya, UP",
    imageUrl: "https://images.unsplash.com/photo-1627894483216-2138af692e32?w=1200&auto=format&fit=crop&q=85",
    category: "pilgrimage",
  },
  {
    id: "gal-5",
    title: "Badrinath Temple Himalayan Valley",
    location: "Chamoli, Uttarakhand",
    imageUrl: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=1200&auto=format&fit=crop&q=85",
    category: "mountain",
  },
  {
    id: "gal-6",
    title: "Rishikesh Holy Ganga Aarti & Deepam",
    location: "Rishikesh, Uttarakhand",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=85",
    category: "pilgrimage",
  },
];

const COLLECTION = "sacredDevoteeGallery_v2";
const DELETED_KEY = "voyagr-deleted-gallery-photos";
const CUSTOM_KEY = "voyagr-custom-gallery-photos";

function getDeletedPhotoIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalCustomPhotos(): GalleryPhoto[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCustomPhoto(photo: GalleryPhoto) {
  try {
    const list = getLocalCustomPhotos();
    const existingIdx = list.findIndex((p) => p.id === photo.id);
    if (existingIdx >= 0) {
      list[existingIdx] = photo;
    } else {
      list.push(photo);
    }
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function markPhotoDeleted(id: string) {
  try {
    const deleted = getDeletedPhotoIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
    }
    const custom = getLocalCustomPhotos().filter((p) => p.id !== id);
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom));
  } catch {
    // ignore
  }
}

function getFilteredGallery(rawList: GalleryPhoto[]): GalleryPhoto[] {
  const deletedIds = getDeletedPhotoIds();
  const customList = getLocalCustomPhotos();
  const map = new Map<string, GalleryPhoto>();

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

  return Array.from(map.values());
}

export function subscribeToGallery(callback: (photos: GalleryPhoto[]) => void): Unsubscribe {
  if (!firebaseDb) {
    callback(getFilteredGallery(defaultGallery));
    return () => {};
  }
  try {
    const q = query(collection(firebaseDb, COLLECTION), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const firestoreList = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryPhoto, "id">) }));
        const combined = firestoreList.length > 0 ? firestoreList : defaultGallery;
        callback(getFilteredGallery(combined));
      },
      () => callback(getFilteredGallery(defaultGallery)),
    );
  } catch {
    callback(getFilteredGallery(defaultGallery));
    return () => {};
  }
}

export async function addGalleryPhoto(
  photo: Omit<GalleryPhoto, "id" | "createdAt">,
): Promise<string> {
  const localId = `gal_${Date.now()}`;
  const photoObj: GalleryPhoto = { id: localId, ...photo };
  saveLocalCustomPhoto(photoObj);

  if (firebaseDb) {
    try {
      const colRef = collection(firebaseDb, COLLECTION);
      const docRef = await addDoc(colRef, {
        ...photo,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch {
      // Saved locally
    }
  }
  return localId;
}

export async function deleteGalleryPhoto(id: string): Promise<void> {
  markPhotoDeleted(id);

  if (firebaseDb && !id.startsWith("gal-")) {
    try {
      await deleteDoc(doc(firebaseDb, COLLECTION, id));
    } catch {
      // Handled via local tombstone
    }
  }
}

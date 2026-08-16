/**
 * usePackages — Firestore packages ka real-time hook
 * Firestore se packages load karta hai, fallback static catalog se
 */
import { useEffect, useState } from "react";
import {
  subscribeToPackages,
  getAllPackages,
  type FirebasePackage,
} from "@/lib/firebasePackages";
import { catalog as staticCatalog } from "@/lib/voyagrData";
import { firebaseClientConfigured } from "@/lib/firebase";

import { voyageImages } from "@/lib/voyagrData";

function sanitizeImage(img?: string, name?: string): string {
  if (img && !img.includes("/manus-storage") && img.startsWith("http")) return img;
  const n = (name || "").toLowerCase();
  if (n.includes("rajasthan") || n.includes("jaipur")) return voyageImages.rajasthan;
  if (n.includes("goa")) return voyageImages.goa;
  if (n.includes("ladakh") || n.includes("leh")) return voyageImages.hills;
  if (n.includes("kerala") || n.includes("munnar")) return voyageImages.kerala;
  if (n.includes("meghalaya") || n.includes("shillong")) return voyageImages.meghalaya;
  return voyageImages.hero;
}

/** Static catalog ko FirebasePackage format mein convert karo */
function staticToFirebase(item: (typeof staticCatalog)[number]): FirebasePackage {
  return {
    id: item.id,
    name: item.name,
    location: item.location,
    duration: item.duration,
    days: item.days,
    nights: item.days - 1,
    price: item.price,
    category: item.category,
    image: sanitizeImage(item.image, item.name),
    tag: item.tag,
    description: item.description,
    status: "live",
    sortOrder: 99,
  };
}

const STATIC_PACKAGES: FirebasePackage[] = staticCatalog.map(staticToFirebase);

interface UsePackagesReturn {
  packages: FirebasePackage[];
  isLoading: boolean;
  isFromFirestore: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** Firestore packages ka real-time hook with static fallback */
export function usePackages(): UsePackagesReturn {
  const [packages, setPackages] = useState<FirebasePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromFirestore, setIsFromFirestore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    try {
      setIsLoading(true);
      const fetched = await getAllPackages();
      if (fetched.length > 0) {
        setPackages(fetched);
        setIsFromFirestore(true);
      } else {
        setPackages(STATIC_PACKAGES);
        setIsFromFirestore(false);
      }
    } catch (err) {
      setError("Could not load packages from server.");
      setPackages(STATIC_PACKAGES);
      setIsFromFirestore(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!firebaseClientConfigured) {
      setPackages(STATIC_PACKAGES);
      setIsFromFirestore(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Real-time subscription
    const unsubscribe = subscribeToPackages((firestorePackages) => {
      if (firestorePackages.length > 0) {
        const cleaned = firestorePackages.map((p) => ({
          ...p,
          image: sanitizeImage(p.image, p.name),
        }));
        setPackages(cleaned);
        setIsFromFirestore(true);
      } else {
        // Firestore empty hai — static use karo
        setPackages(STATIC_PACKAGES);
        setIsFromFirestore(false);
      }
      setIsLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, []);

  return { packages, isLoading, isFromFirestore, error, refetch };
}

/** Single package hook */
export function usePackage(id: string | undefined): {
  pkg: FirebasePackage | null;
  isLoading: boolean;
} {
  const { packages, isLoading } = usePackages();
  const pkg = id ? packages.find((p) => p.id === id) ?? null : null;
  return { pkg, isLoading };
}

/** Admin packages hook — draft + live + archived sab */
export function useAdminPackages(): UsePackagesReturn {
  const [packages, setPackages] = useState<FirebasePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    const { getAllPackagesAdmin } = await import("@/lib/firebasePackages");
    try {
      const all = await getAllPackagesAdmin();
      setPackages(all.length > 0 ? all : STATIC_PACKAGES);
    } catch {
      setPackages(STATIC_PACKAGES);
    }
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { getAllPackagesAdmin } = await import("@/lib/firebasePackages");
        const all = await getAllPackagesAdmin();
        setPackages(all.length > 0 ? all : STATIC_PACKAGES);
      } catch (err) {
        setError("Could not load admin packages.");
        setPackages(STATIC_PACKAGES);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { packages, isLoading, isFromFirestore: true, error, refetch };
}

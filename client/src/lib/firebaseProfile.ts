import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { firebaseDb } from "./firebase";

export type FirebaseTravelerProfile = {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  photoURL?: string;
  city?: string;
  emergencyPhone?: string;
  profileComplete?: boolean;
  provider: "google" | "email" | "otp";
};

function providerFor(user: User): FirebaseTravelerProfile["provider"] {
  const providers = user.providerData.map((provider) => provider.providerId);
  if (providers.includes("google.com")) return "google";
  if (providers.includes("phone")) return "otp";
  return "email";
}

export function firebaseProfileFromUser(user: User): FirebaseTravelerProfile {
  return {
    uid: user.uid,
    displayName: user.displayName?.trim() || "Har Har Mahadev Traveler",
    email: user.email?.trim() || "",
    phone: user.phoneNumber?.trim() || "",
    photoURL: user.photoURL?.trim() || "",
    provider: providerFor(user),
  };
}

export async function readFirebaseTravelerProfile(uid: string) {
  if (!firebaseDb) return null;
  const snapshot = await getDoc(doc(firebaseDb, "travelerProfiles", uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function upsertFirebaseTravelerProfile(profile: FirebaseTravelerProfile) {
  if (!firebaseDb) return;
  const reference = doc(firebaseDb, "travelerProfiles", profile.uid);
  const existing = await getDoc(reference);
  const existingData = existing.exists() ? existing.data() : {};
  
  await setDoc(
    reference,
    {
      ...existingData,
      ...profile,
      role: existingData?.role || "user",
      photoURL: profile.photoURL || existingData?.photoURL || "",
      updatedAt: serverTimestamp(),
      ...(!existing.exists() ? { createdAt: serverTimestamp() } : {}),
    },
    { merge: true },
  );
}

export async function createFirebaseSupportTicket(input: {
  uid: string;
  subject: string;
  message: string;
  bookingCode?: string;
}) {
  if (!firebaseDb) throw new Error("Firebase Firestore is not configured.");
  return addDoc(collection(firebaseDb, "supportTickets"), {
    ownerUid: input.uid,
    userId: input.uid,
    subject: input.subject.slice(0, 120),
    message: input.message.slice(0, 2000),
    bookingCode: input.bookingCode?.slice(0, 32) || "",
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

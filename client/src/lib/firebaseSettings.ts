/**
 * Firebase System Settings Service
 * Allows Admin to configure Platform Branding, Owner Contacts, WhatsApp Group, and Payments dynamically in Firestore.
 * Collection: `systemSettings` (doc: `global`)
 */
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { firebaseDb } from "./firebase";

export interface SystemSettings {
  siteName: string;
  platformName: string;
  tagline: string;
  ownerName: string;
  ownerPhone: string;
  ownerWhatsapp: string;
  whatsappNumber?: string;
  whatsappGroupLink: string;
  supportPhone: string;
  supportEmail: string;
  officeAddress: string;
  upiId: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  taxRatePercent: number;
  bannerEnabled: boolean;
  bannerText: string;
  bannerLink: string;
  welcomeOfferCode: string;
  welcomeOfferAmount: number;
  maintenanceMode: boolean;
  bookingEnabled: boolean;
  bookingDisabledNotice?: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export const defaultSettings: SystemSettings = {
  siteName: "Har Har Mahadev Tours & Travels",
  platformName: "Har Har Mahadev Tours & Travels",
  tagline: "पवित्र तीर्थ यात्रा, हेरिटेज दर्शन एवं सम्पूर्ण भारत भ्रमण | Har Har Mahadev",
  ownerName: "Vijay Singh",
  ownerPhone: "+91 96306 42541",
  ownerWhatsapp: "919630642541",
  whatsappGroupLink: "https://wa.me/919630642541?text=हर%20हर%20महादेव!%20मैं%20यात्री%20ग्रुप%20में%20जुड़ना%20चाहता%20हूँ।",
  supportPhone: "+91 96306 42541",
  supportEmail: "info@harharmahadevtours.com",
  officeAddress: "Main Road, Haridwar / Delhi NCR, India",
  upiId: "mahadevtravels@okhdfcbank",
  bankName: "HDFC Bank",
  accountNumber: "50200012345678",
  ifscCode: "HDFC0001234",
  taxRatePercent: 5,
  bannerEnabled: true,
  bannerText: "🚩 जय श्री महाकाल! Special Yatra & Seasonal Tour Booking Open — Use MAHADEV500 for Discount!",
  maintenanceMode: false,
  bookingEnabled: true,
  bookingDisabledNotice: "ऑनलाइन बुकिंग वर्तमान में सीमित है। कृपया तुरंत बुकिंग या जानकारी के लिए व्हाट्सएप पर संपर्क करें।",
  bannerLink: "/explore",
  welcomeOfferCode: "MAHADEV500",
  welcomeOfferAmount: 500,
};

const SETTINGS_DOC = "global";

/** Get system settings */
export async function getSystemSettings(): Promise<SystemSettings> {
  if (!firebaseDb) return defaultSettings;
  try {
    const ref = doc(firebaseDb, "systemSettings", SETTINGS_DOC);
    const snap = await getDoc(ref);
    if (!snap.exists()) return defaultSettings;
    const data = snap.data();
    return {
      ...defaultSettings,
      ...data,
      siteName: data.siteName || data.platformName || defaultSettings.siteName,
    } as SystemSettings;
  } catch {
    return defaultSettings;
  }
}

/** Update system settings (Admin only) */
export async function updateSystemSettings(
  settings: Partial<SystemSettings>,
  adminUid: string,
): Promise<void> {
  if (!firebaseDb) return;
  const ref = doc(firebaseDb, "systemSettings", SETTINGS_DOC);
  await setDoc(
    ref,
    {
      ...settings,
      updatedBy: adminUid,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Real-time listener for system settings */
export function subscribeToSystemSettings(
  callback: (settings: SystemSettings) => void,
): Unsubscribe {
  if (!firebaseDb) {
    callback(defaultSettings);
    return () => {};
  }
  try {
    const ref = doc(firebaseDb, "systemSettings", SETTINGS_DOC);
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          callback({
            ...defaultSettings,
            ...data,
            siteName: data.siteName || data.platformName || defaultSettings.siteName,
          } as SystemSettings);
        } else {
          callback(defaultSettings);
        }
      },
      () => {
        callback(defaultSettings);
      },
    );
  } catch {
    callback(defaultSettings);
    return () => {};
  }
}

/**
 * VOYAGR — Master Platform & Contact Configuration
 * Edit numbers, WhatsApp links, emails, and community groups in one central place.
 */

export const siteConfig = {
  name: "Har Har Mahadev Tours & Travels",
  legalName: "Har Har Mahadev Tours & Travels Pvt. Ltd.",
  tagline: "सम्पूर्ण भारत तीर्थ दर्शन एवं हेरिटेज यात्रा",
  ownerName: "Vijay Singh",

  // ── Contact Numbers & Helplines ──
  contact: {
    primaryPhone: "+91 96306 42541",
    primaryPhoneDisplay: "+91 96306 42541",
    tollFree: "+91 96306 42541",
    whatsappNumber: "919630642541",
    whatsappDisplay: "+91 96306 42541",
    whatsappDmUrl: "https://wa.me/919630642541?text=हर%20हर%20महादेव!%20मैं%20यात्रा%20पैकेज%20की%20जानकारी%20चाहता%20हूँ।",
    supportEmail: "support@voyagr.in",
    bookingsEmail: "concierge@voyagr.in",
    operatingHours: "24x7 Traveler Support & Operations",
    officeAddress: "Haridwar · Delhi NCR · India",
    googleMapsUrl: "https://maps.google.com/?q=Haridwar+Uttarakhand",
  },

  // ── Official Community & Socials ──
  community: {
    whatsappGroupLink: "https://wa.me/919630642541?text=हर%20हर%20महादेव!%20मुझे%20आधिकारिक%20यात्री%20ग्रुप%20में%20जोड़ें।",
    telegramChannel: "https://t.me/voyagrtravel",
    instagram: "https://instagram.com/voyagr.in",
    youtube: "https://youtube.com/@voyagrtravel",
    facebook: "https://facebook.com/voyagrtravel",
  },

  // ── Operational Constants ──
  operations: {
    gstNumber: "07AAACV2026R1ZX",
    gstPercentage: 5,
    currency: "INR",
    currencySymbol: "₹",
    defaultHostName: "Vijay Singh (Tour Operations Head)",
    defaultEmergencyHelpline: "+91 96306 42541",
  },
} as const;

export type SiteConfig = typeof siteConfig;

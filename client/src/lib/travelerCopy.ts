import type { TravelerLocale } from "@/contexts/TravelSessionContext";

export interface AppDictionary {
  nav: {
    home: string;
    explore: string;
    trips: string;
    saved: string;
    account: string;
    support: string;
    control: string;
  };
  actions: {
    bookNow: string;
    whatsappChat: string;
    callHelpline: string;
    viewDetails: string;
    viewItinerary: string;
    printInvoice: string;
    openDesk: string;
    searchPlaceholder: string;
    clearSearch: string;
    applyCoupon: string;
    verifyBooking: string;
  };
  booking: {
    bookingId: string;
    status: string;
    pendingApproval: string;
    confirmed: string;
    leadTraveler: string;
    travelers: string;
    departure: string;
    assignedHost: string;
    driverPhone: string;
    vehicle: string;
    totalAmount: string;
  };
  common: {
    days: string;
    nights: string;
    perPerson: string;
    allTaxesIncluded: string;
    verifiedHost: string;
    emergency24x7: string;
  };
}

export const englishDict: AppDictionary = {
  nav: {
    home: "Home",
    explore: "Explore Tours",
    trips: "My Trips & Tickets",
    saved: "Saved Routes",
    account: "Profile",
    support: "24x7 Help",
    control: "Admin Operations",
  },
  actions: {
    bookNow: "Reserve Trip",
    whatsappChat: "Chat on WhatsApp",
    callHelpline: "Call Concierge Helpline",
    viewDetails: "View Full Package",
    viewItinerary: "Day-by-Day Plan",
    printInvoice: "Download PDF Receipt",
    openDesk: "Open Trip Desk",
    searchPlaceholder: "Where do you want to travel? (Goa, Ladakh, Jaipur...)",
    clearSearch: "Clear",
    applyCoupon: "Apply Coupon",
    verifyBooking: "Open with Booking ID",
  },
  booking: {
    bookingId: "Booking ID",
    status: "Status",
    pendingApproval: "Manual Review in Progress",
    confirmed: "Confirmed & Host Assigned",
    leadTraveler: "Primary Traveler",
    travelers: "Total Travelers",
    departure: "Departure Date",
    assignedHost: "Local Host & Chauffeur",
    driverPhone: "Host Phone",
    vehicle: "Assigned Vehicle",
    totalAmount: "Total Fare",
  },
  common: {
    days: "Days",
    nights: "Nights",
    perPerson: "per person",
    allTaxesIncluded: "GST & All Taxes Included",
    verifiedHost: "100% Verified Local Host",
    emergency24x7: "24x7 On-Road Assistance",
  },
};

export const hindiDict: AppDictionary = {
  nav: {
    home: "होम (मुख्य पृष्ठ)",
    explore: "टूर पैकेज खोजें",
    trips: "मेरी यात्राएं और टिकट",
    saved: "सेव किए हुए पैकेज",
    account: "मेरी प्रोफाइल",
    support: "24x7 मदद व सहायता",
    control: "एडमिन पैनल",
  },
  actions: {
    bookNow: "सीट बुक करें",
    whatsappChat: "व्हाट्सएप पर बात करें",
    callHelpline: "सीधा फोन लगाएं (+91 98765 43210)",
    viewDetails: "पूरी जानकारी देखें",
    viewItinerary: "दिन-वार कार्यक्रम",
    printInvoice: "PDF रसीद डाउनलोड करें",
    openDesk: "ट्रिप डेस्क खोलें",
    searchPlaceholder: "कहाँ जाना चाहते हैं? (गोवा, लद्दाख, जयपुर...)",
    clearSearch: "हटाएं",
    applyCoupon: "कूपन कोड लगाएं",
    verifyBooking: "बुकिंग आईडी से टिकट खोलें",
  },
  booking: {
    bookingId: "बुकिंग आईडी",
    status: "स्थिति",
    pendingApproval: "जाँच प्रक्रिया में है",
    confirmed: "कन्फर्म (ड्राइवर व होस्ट नियुक्त)",
    leadTraveler: "मुख्य यात्री का नाम",
    travelers: "कुल यात्री",
    departure: "यात्रा की तारीख",
    assignedHost: "लोकल गाइड व ड्राइवर",
    driverPhone: "ड्राइवर का फोन नंबर",
    vehicle: "गाड़ी की जानकारी",
    totalAmount: "कुल किराया",
  },
  common: {
    days: "दिन",
    nights: "रातें",
    perPerson: "प्रति व्यक्ति",
    allTaxesIncluded: "जीएसटी व सभी टैक्स शामिल",
    verifiedHost: "100% वेरिफाइड लोकल गाइड",
    emergency24x7: "24x7 ऑन-रोड सहायता उपलब्ध",
  },
};

export function getAppDict(locale: TravelerLocale): AppDictionary {
  return locale === "hi-IN" ? hindiDict : englishDict;
}

export function travelerCopy(locale: TravelerLocale) {
  return locale === "hi-IN"
    ? {
        explore: { kicker: "रूट लाइब्रेरी / 06", lineOne: "अपनी पसंदीदा", lineTwo: "यात्रा चुनें।", body: "आसान टूर पैकेज, सत्यापित होटल और भरोसेमंद लोकल ड्राइवर।" },
        trips: { kicker: "आपकी यात्राएँ / 07", lineOne: "आपकी कन्फर्म", lineTwo: "यात्राएं और टिकट्स।", body: "हर टिकट, ड्राइवर का नंबर, और लाइव सहायता यहाँ उपलब्ध है।" },
        account: { kicker: "प्रोफाइल विवरण", preferences: "पसंद", journey: "यात्रा रिकॉर्ड" },
        wishlist: { kicker: "पसंदीदा पैकेज / 08", lineOne: "सेव किए हुए", lineTwo: "टूर पैकेज।", body: "मनपसंद पैकेज सेव रखें और जब चाहें तब बुक करें।" },
        notifications: { kicker: "अपडेट्स व संदेश", lineOne: "यात्रा", lineTwo: "सूचनाएं।" },
        support: { kicker: "24x7 हेल्पलाइन", lineOne: "हम आपकी", lineTwo: "मदद के लिए तैयार हैं।", body: "कॉल करें या व्हाट्सएप पर सीधा संपर्क करें।" },
      }
    : {
        explore: { kicker: "ROUTE LIBRARY / 06", lineOne: "Find your next", lineTwo: "good elsewhere.", body: "Search by destination, mood, or the kind of pause you need." },
        trips: { kicker: "YOUR ROUTES / 07", lineOne: "The places you’re", lineTwo: "going back to.", body: "Every ticket, note, live location, and support request comes from your protected traveler record." },
        account: { kicker: "YOUR PROFILE / USER", preferences: "PREFERENCES", journey: "THE JOURNEY UP" },
        wishlist: { kicker: "YOUR SAVED PLACES / 08", lineOne: "Keep the good", lineTwo: "ideas close.", body: "Save a route now. Decide when the time feels right." },
        notifications: { kicker: "YOUR INBOX / 09", lineOne: "A few notes", lineTwo: "from the road." },
        support: { kicker: "WE’RE HERE / 10", lineOne: "A good trip has", lineTwo: "someone behind it.", body: "Ask a question, share a concern, or just tell us where you’re headed." },
      };
}

import { BadgeIndianRupee, BedDouble, CarFront, FileBadge, Gift, Hotel, MapPinned, Plane, ShieldCheck, TentTree, TicketCheck, TrainFront, Umbrella } from "lucide-react";

export const nativeServices = [
  { label: "Flights", icon: Plane, tone: "blue", href: "/explore?q=flights" },
  { label: "Hotels", icon: Hotel, tone: "purple", href: "/explore?q=stays" },
  { label: "Packages", icon: Umbrella, tone: "coral", href: "/explore" },
  { label: "Rail & bus", icon: TrainFront, tone: "teal", href: "/explore?q=transfers" },
];

export const nativeUtilityServices = [
  { label: "Airport transfer", icon: CarFront }, { label: "Villas & stays", icon: BedDouble }, { label: "Outstation cab", icon: MapPinned }, { label: "Trip documents", icon: FileBadge },
  { label: "Experiences", icon: TentTree }, { label: "Hourly stays", icon: Hotel }, { label: "Visa help", icon: FileBadge }, { label: "Insurance", icon: ShieldCheck },
];

export const nativeOffers = [
  { id: "deal-goa", eyebrow: "TODAY’S TRAVEL DROP", title: "Goa, with space to slow down.", body: "Save up to ₹2,500 on coastal routes.", code: "GOA2500", className: "offer-ocean", href: "/package/goa" },
  { id: "deal-heritage", eyebrow: "GUIDED WEEKENDS", title: "Find India beyond the brochure.", body: "Curated history walks from ₹4,999.", code: "FIELDGUIDE", className: "offer-sunset", href: "/package/rajasthan" },
  { id: "deal-trip-desk", eyebrow: "TRIP DESK", title: "Keep every issued travel record close.", body: "Open booking ID access for tickets, invoices, and live updates.", code: "TRIPDESK", className: "offer-violet", href: "/access" },
];

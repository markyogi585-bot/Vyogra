import { CalendarClock, MapPinned, PackagePlus, ReceiptText } from "lucide-react";
import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { CampaignControlPanel } from "@/components/admin/CampaignControlPanel";
import { ExploreActionGrid } from "@/components/ExploreActionGrid";

export default function AdminGrowthPage() {
  const operations = [
    { label: "Build a package", note: "Create route inventory", icon: PackagePlus, href: "/admin/packages", accent: "sage" as const },
    { label: "Issue a booking", note: "Manual traveler booking", icon: ReceiptText, href: "/admin/bookings/manual", accent: "clay" as const },
    { label: "Run live trip desk", note: "Host updates and check-ins", icon: MapPinned, href: "/admin/trips/live", accent: "mist" as const },
    { label: "Plan route timing", note: "Campaign calendar", icon: CalendarClock, href: "/admin/tools", accent: "sand" as const },
  ];
  return <AdminPageFrame eyebrow="GROWTH / OFFERS & WIDGETS" title={<>Make the next<br /><i>moment count.</i></>}><p className="admin-page-lead">Create live offers only when there is an operational destination behind them. Each campaign links travelers into a real package, booking, or trip flow.</p><section className="admin-explore-actions"><span className="admin-overline">CONNECTED OPERATIONS</span><ExploreActionGrid actions={operations} /></section><CampaignControlPanel /></AdminPageFrame>;
}

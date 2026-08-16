import { Megaphone } from "lucide-react";
import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { BroadcastComposer } from "@/components/admin/BroadcastComposer";
export default function AdminBroadcastPage() { return <AdminPageFrame eyebrow="AUDIENCE / BROADCASTS" title={<>A message can feel<br /><i>like good timing.</i></>}><div className="admin-campaign-summary"><article><Megaphone size={18} /><span>In-app announcements</span><b>04 active</b></article><article><span>Daily deal</span><b>Goa · ending in 06:42:18</b></article><article><span>Saved drafts</span><b>03 campaigns</b></article></div><BroadcastComposer /></AdminPageFrame>; }

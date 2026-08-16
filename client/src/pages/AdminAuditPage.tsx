import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { AuditTimeline } from "@/components/admin/AuditTimeline";
export default function AdminAuditPage() { return <AdminPageFrame eyebrow="SECURITY / AUDIT TRAIL" title={<>Trust lives in<br /><i>the details.</i></>}><AuditTimeline /></AdminPageFrame>; }

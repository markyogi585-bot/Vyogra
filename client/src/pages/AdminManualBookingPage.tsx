import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import { AdminManualBookingDesk } from "@/admin/AdminManualBookingDesk";

export default function AdminManualBookingPage() {
  return (
    <AdminPageFrame eyebrow="OPERATIONS / MANUAL ISSUE" title="Hi-Tech Manual Booking & Passenger Desk">
      <AdminManualBookingDesk />
    </AdminPageFrame>
  );
}

export type BookingLifecycle = "pending" | "confirmed" | "active" | "completed" | "cancelled" | "refunded";
const allowed: Record<BookingLifecycle, BookingLifecycle[]> = { pending: ["confirmed", "cancelled"], confirmed: ["active", "cancelled"], active: ["completed", "cancelled"], completed: [], cancelled: ["refunded"], refunded: [] };
export function canTransitionBooking(from: BookingLifecycle, to: BookingLifecycle) { return allowed[from].includes(to); }

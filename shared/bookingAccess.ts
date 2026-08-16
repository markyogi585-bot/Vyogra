export const BOOKING_ACCESS_TTL_MINUTES = 20;
export type BookingAccessInput = { bookingCode: string; contactSuffix: string };
export function normalizeBookingCode(value: string) { return value.trim().toUpperCase().replace(/\s+/g, ""); }
export function normalizeContactSuffix(value: string) { return value.replace(/\D/g, "").slice(-4); }
export function isValidBookingAccessInput(input: BookingAccessInput) { return /^VYG-\d{4}-\d{5}$/.test(normalizeBookingCode(input.bookingCode)) && normalizeContactSuffix(input.contactSuffix).length === 4; }
export function accessExpiresAt(from = new Date()) { return new Date(from.getTime() + BOOKING_ACCESS_TTL_MINUTES * 60_000); }

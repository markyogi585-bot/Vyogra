export const couponDefinitions = { GOA2500: { label: "Goa coastal credit", amount: 2500 }, FIELDGUIDE: { label: "Guided route credit", amount: 1800 }, VYGREWARD: { label: "Har Har Mahadev Special Reward", amount: 1200 }, MAHADEV500: { label: "Maha Shivratri Special Discount", amount: 500 } } as const;
export type CouponCode = keyof typeof couponDefinitions;
export function applyCoupon(code: string, subtotal: number) { const normalized = code.trim().toUpperCase() as CouponCode; const coupon = couponDefinitions[normalized]; if (!coupon) return { valid: false, code: normalized, discount: 0, message: "That code is not active for this journey." }; return { valid: true, code: normalized, discount: Math.min(coupon.amount, subtotal), message: `${coupon.label} applied.` }; }
export function formatInr(amount: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount); }
export function issueBookingCode() { return `VYG-2026-${Math.floor(10000 + Math.random() * 89999)}`; }
export function issueInvoiceNumber() { return `INV-VYG-${Math.floor(100000 + Math.random() * 899999)}`; }

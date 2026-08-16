export type RazorpayOrderIntent = { receipt: string; amountInRupees: number; notes: Record<string, string>; };
export function makeRazorpayOrderIntent(input: RazorpayOrderIntent) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) throw new Error("Razorpay server credentials are not configured.");
  return { amount: Math.round(input.amountInRupees * 100), currency: "INR", receipt: input.receipt, notes: input.notes };
}
export function verifyRazorpayEnvironment() { return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET); }

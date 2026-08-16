import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { assertPermission } from "../security/roles";
import { calculateCouponDiscount, calculateInvoiceTotal } from "@shared/commerceTerms";
import { persistManualBooking, persistTravelerCheckout } from "../db";
import { recordAudit } from "../audit/service";

export const commerceRouter = router({
  quote: protectedProcedure.input(z.object({ subtotal: z.number().nonnegative(), taxRate: z.number().min(0).max(100), coupon: z.object({ code: z.string(), discountType: z.enum(["flat", "percent"]), discountValue: z.number().nonnegative(), minimumSubtotal: z.number().nonnegative().optional(), maximumDiscount: z.number().nonnegative().optional() }).optional() })).query(({ input }) => {
    const discount = calculateCouponDiscount(input.subtotal, input.coupon);
    return { ...calculateInvoiceTotal({ subtotal: input.subtotal, taxRate: input.taxRate, discount }), couponCode: input.coupon?.code ?? null };
  }),
  manualIssue: protectedProcedure.input(z.object({ travelerName: z.string().min(2).max(160), phone: z.string().min(8).max(32), email: z.string().email().optional(), packageId: z.number().int().positive(), travelerCount: z.number().int().min(1).max(30).default(1), acceptedTerms: z.boolean(), subtotal: z.number().positive(), taxRate: z.number().min(0).max(100), coupon: z.object({ code: z.string(), discountType: z.enum(["flat", "percent"]), discountValue: z.number().nonnegative() }).optional() })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "booking:manage");
    if (!input.acceptedTerms) throw new Error("Package terms must be accepted before a manual booking can be issued.");
    const discount = calculateCouponDiscount(input.subtotal, input.coupon);
    const totals = calculateInvoiceTotal({ subtotal: input.subtotal, taxRate: input.taxRate, discount });
    const suffix = `${Date.now()}`.slice(-5);
    const bookingCode = `VYG-${new Date().getUTCFullYear()}-${suffix}`;
    const invoiceNumber = `INV-VYG-${new Date().getUTCFullYear().toString().slice(-2)}${suffix}`;
    const persistence = await persistManualBooking({ actorUserId: ctx.user.id, travelerName: input.travelerName, phone: input.phone, email: input.email, packageId: input.packageId, travelerCount: input.travelerCount, acceptedTerms: input.acceptedTerms, subtotal: input.subtotal, tax: totals.tax, discount: totals.discount, total: totals.total, bookingCode, invoiceNumber });
    if (persistence.persisted) await recordAudit(ctx.user.id, { eventType: "booking.manual_issued", entityType: "booking", entityId: String(persistence.bookingId), metadata: { bookingCode, invoiceNumber, travelerUserId: persistence.travelerUserId, totals } });
    return { persisted: persistence.persisted, bookingCode, invoiceNumber, totals, issuedBy: ctx.user.id };
  }),
  checkoutIssue: protectedProcedure.input(z.object({ travelerName: z.string().min(2).max(160), phone: z.string().min(8).max(32), email: z.string().email(), packageId: z.number().int().positive(), travelerCount: z.number().int().min(1).max(30), acceptedTerms: z.literal(true), subtotal: z.number().positive(), taxRate: z.number().min(0).max(100), coupon: z.object({ code: z.string(), discountType: z.enum(["flat", "percent"]), discountValue: z.number().nonnegative() }).optional() })).mutation(async ({ ctx, input }) => {
    const discount = calculateCouponDiscount(input.subtotal, input.coupon);
    const totals = calculateInvoiceTotal({ subtotal: input.subtotal, taxRate: input.taxRate, discount });
    const suffix = `${Date.now()}`.slice(-5);
    const bookingCode = `VYG-${new Date().getUTCFullYear()}-${suffix}`;
    const invoiceNumber = `INV-VYG-${new Date().getUTCFullYear().toString().slice(-2)}${suffix}`;
    const persistence = await persistTravelerCheckout({ userId: ctx.user.id, travelerName: input.travelerName, phone: input.phone, email: input.email, packageId: input.packageId, travelerCount: input.travelerCount, acceptedTerms: input.acceptedTerms, subtotal: input.subtotal, tax: totals.tax, discount: totals.discount, total: totals.total, bookingCode, invoiceNumber });
    if (persistence.persisted) await recordAudit(ctx.user.id, { eventType: "booking.checkout_issued", entityType: "booking", entityId: String(persistence.bookingId), metadata: { bookingCode, invoiceNumber, totals } });
    return { persisted: persistence.persisted, bookingCode, invoiceNumber, totals };
  }),
});

import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  bookingAdjustments,
  bookingCancellationRequests,
  bookingExtensionRequests,
  bookings,
  bookingTripSchedules,
  invoices,
  invoiceLineItems,
  packages,
  payments,
  refundRequests,
  supportTickets,
  users,
} from "../../drizzle/schema";
import { recordAudit } from "../audit/service";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertOwnership, assertPermission, isOperator } from "../security/roles";

const lifecycleState = z.enum(["requested", "reviewing", "approved", "rejected", "cancelled"]);
const refundState = z.enum(["requested", "reviewing", "approved", "rejected", "processed", "failed", "cancelled"]);

async function databaseOrThrow() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Booking operations are temporarily unavailable." });
  return db;
}

async function ownedBooking(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, role: string, bookingCode: string) {
  const [booking] = await db.select({ id: bookings.id, bookingCode: bookings.bookingCode, userId: bookings.userId, status: bookings.status, grandTotal: bookings.grandTotal, addOnTotal: bookings.addOnTotal })
    .from(bookings).where(eq(bookings.bookingCode, bookingCode)).limit(1);
  if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
  if (!isOperator(role)) assertOwnership(userId, booking.userId);
  return booking;
}

function asAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

export const bookingLifecycleRouter = router({
  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await databaseOrThrow();
    return db.select({
      bookingCode: bookings.bookingCode,
      status: bookings.status,
      travelerCount: bookings.travelerCount,
      grandTotal: bookings.grandTotal,
      createdAt: bookings.createdAt,
      packageName: packages.name,
      destination: packages.destination,
      coverImageUrl: packages.coverImageUrl,
      startsAt: bookingTripSchedules.startsAt,
      endsAt: bookingTripSchedules.endsAt,
    }).from(bookings)
      .innerJoin(packages, eq(bookings.packageId, packages.id))
      .leftJoin(bookingTripSchedules, eq(bookingTripSchedules.bookingId, bookings.id))
      .where(eq(bookings.userId, ctx.user.id))
      .orderBy(desc(bookings.createdAt));
  }),

  detail: protectedProcedure.input(z.object({ bookingCode: z.string().min(6).max(32) })).query(async ({ ctx, input }) => {
    const db = await databaseOrThrow();
    const booking = await ownedBooking(db, ctx.user.id, ctx.user.role, input.bookingCode);
    const [record] = await db.select({
      id: bookings.id, bookingCode: bookings.bookingCode, status: bookings.status, travelerCount: bookings.travelerCount, subtotal: bookings.subtotal, addOnTotal: bookings.addOnTotal, grandTotal: bookings.grandTotal, confirmedAt: bookings.confirmedAt, notes: bookings.notes,
      packageName: packages.name, destination: packages.destination, durationDays: packages.durationDays, durationNights: packages.durationNights, coverImageUrl: packages.coverImageUrl,
      startsAt: bookingTripSchedules.startsAt, endsAt: bookingTripSchedules.endsAt,
      invoiceId: invoices.id, invoiceNumber: invoices.invoiceNumber, invoiceStatus: invoices.status, invoiceTotal: invoices.grandTotal,
    }).from(bookings).innerJoin(packages, eq(bookings.packageId, packages.id)).leftJoin(invoices, eq(invoices.bookingId, bookings.id)).leftJoin(bookingTripSchedules, eq(bookingTripSchedules.bookingId, bookings.id)).where(eq(bookings.id, booking.id)).limit(1);
    const [extensions, cancellations, adjustments, refunds, paymentRows] = await Promise.all([
      db.select().from(bookingExtensionRequests).where(eq(bookingExtensionRequests.bookingId, booking.id)).orderBy(desc(bookingExtensionRequests.createdAt)),
      db.select().from(bookingCancellationRequests).where(eq(bookingCancellationRequests.bookingId, booking.id)).orderBy(desc(bookingCancellationRequests.createdAt)),
      db.select().from(bookingAdjustments).where(eq(bookingAdjustments.bookingId, booking.id)).orderBy(desc(bookingAdjustments.createdAt)),
      db.select().from(refundRequests).where(eq(refundRequests.bookingId, booking.id)).orderBy(desc(refundRequests.createdAt)),
      db.select({ id: payments.id, status: payments.status, amount: payments.amount, currency: payments.currency, provider: payments.provider, verifiedAt: payments.verifiedAt }).from(payments).where(eq(payments.bookingId, booking.id)).orderBy(desc(payments.createdAt)),
    ]);
    return { booking: record, extensions, cancellations, adjustments, refunds, payments: paymentRows };
  }),

  requestExtension: protectedProcedure.input(z.object({ bookingCode: z.string().min(6).max(32), additionalDays: z.number().int().min(1).max(30), reason: z.string().min(8).max(1000), requestedStartAt: z.date().optional(), requestedEndAt: z.date().optional() })).mutation(async ({ ctx, input }) => {
    const db = await databaseOrThrow();
    const booking = await ownedBooking(db, ctx.user.id, ctx.user.role, input.bookingCode);
    const result = await db.insert(bookingExtensionRequests).values({ bookingId: booking.id, requestedByUserId: ctx.user.id, additionalDays: input.additionalDays, reason: input.reason, requestedStartAt: input.requestedStartAt ?? null, requestedEndAt: input.requestedEndAt ?? null }).$returningId();
    await recordAudit(ctx.user.id, { eventType: "booking.extension_requested", entityType: "booking_extension_request", entityId: String(result[0]!.id), metadata: { bookingCode: booking.bookingCode, additionalDays: input.additionalDays } });
    return { requestId: result[0]!.id, status: "requested" as const };
  }),

  requestCancellation: protectedProcedure.input(z.object({ bookingCode: z.string().min(6).max(32), reason: z.string().min(8).max(1000), requestedRefundAmount: z.number().nonnegative().optional() })).mutation(async ({ ctx, input }) => {
    const db = await databaseOrThrow();
    const booking = await ownedBooking(db, ctx.user.id, ctx.user.role, input.bookingCode);
    if (["cancelled", "refunded"].includes(booking.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "This booking is already closed." });
    const created = await db.insert(bookingCancellationRequests).values({ bookingId: booking.id, requestedByUserId: ctx.user.id, reason: input.reason, requestedRefundAmount: input.requestedRefundAmount?.toFixed(2) ?? null }).$returningId();
    await recordAudit(ctx.user.id, { eventType: "booking.cancellation_requested", entityType: "booking_cancellation_request", entityId: String(created[0]!.id), metadata: { bookingCode: booking.bookingCode } });
    return { requestId: created[0]!.id, status: "requested" as const };
  }),

  reviewExtension: protectedProcedure.input(z.object({ requestId: z.number().int().positive(), status: lifecycleState, operatorNote: z.string().max(1000).optional(), startsAt: z.date().optional(), endsAt: z.date().optional() })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "booking:manage");
    const db = await databaseOrThrow();
    const [request] = await db.select().from(bookingExtensionRequests).where(eq(bookingExtensionRequests.id, input.requestId)).limit(1);
    if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Extension request not found." });
    if (input.status === "approved" && (!input.startsAt || !input.endsAt || input.endsAt <= input.startsAt)) throw new TRPCError({ code: "BAD_REQUEST", message: "An approved extension needs a valid trip start and end time." });
    await db.update(bookingExtensionRequests).set({ status: input.status, operatorNote: input.operatorNote ?? null, reviewedByUserId: ctx.user.id, reviewedAt: new Date() }).where(eq(bookingExtensionRequests.id, request.id));
    if (input.status === "approved" && input.startsAt && input.endsAt) {
      await db.insert(bookingTripSchedules).values({ bookingId: request.bookingId, startsAt: input.startsAt, endsAt: input.endsAt, source: "extension_approval", updatedByUserId: ctx.user.id }).onDuplicateKeyUpdate({ set: { startsAt: input.startsAt, endsAt: input.endsAt, source: "extension_approval", updatedByUserId: ctx.user.id } });
    }
    await recordAudit(ctx.user.id, { eventType: "booking.extension_reviewed", entityType: "booking_extension_request", entityId: String(request.id), metadata: { bookingId: request.bookingId, status: input.status } });
    return { requestId: request.id, status: input.status };
  }),

  reviewCancellation: protectedProcedure.input(z.object({ requestId: z.number().int().positive(), status: lifecycleState, operatorNote: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "booking:manage");
    const db = await databaseOrThrow();
    const [request] = await db.select().from(bookingCancellationRequests).where(eq(bookingCancellationRequests.id, input.requestId)).limit(1);
    if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Cancellation request not found." });
    await db.update(bookingCancellationRequests).set({ status: input.status, operatorNote: input.operatorNote ?? null, reviewedByUserId: ctx.user.id, reviewedAt: new Date() }).where(eq(bookingCancellationRequests.id, request.id));
    if (input.status === "approved") await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, request.bookingId));
    await recordAudit(ctx.user.id, { eventType: "booking.cancellation_reviewed", entityType: "booking_cancellation_request", entityId: String(request.id), metadata: { bookingId: request.bookingId, status: input.status } });
    return { requestId: request.id, status: input.status };
  }),

  issueAdjustment: protectedProcedure.input(z.object({ bookingCode: z.string().min(6).max(32), kind: z.enum(["additional_charge", "credit"]), description: z.string().min(3).max(240), amount: z.number().positive().max(10_000_000), taxRate: z.number().min(0).max(100).default(0) })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "booking:manage");
    const db = await databaseOrThrow();
    const booking = await ownedBooking(db, ctx.user.id, ctx.user.role, input.bookingCode);
    const [invoice] = await db.select({ id: invoices.id, grandTotal: invoices.grandTotal, taxTotal: invoices.taxTotal }).from(invoices).where(eq(invoices.bookingId, booking.id)).limit(1);
    if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "An issued invoice is required before an adjustment can be added." });
    const sign = input.kind === "credit" ? -1 : 1;
    const signedAmount = sign * input.amount;
    const signedTax = signedAmount * (input.taxRate / 100);
    const lineTotal = signedAmount + signedTax;
    const created = await db.insert(bookingAdjustments).values({ bookingId: booking.id, invoiceId: invoice.id, kind: input.kind, description: input.description, amount: input.amount.toFixed(2), taxRate: input.taxRate.toFixed(2), status: "issued", issuedByUserId: ctx.user.id }).$returningId();
    await db.insert(invoiceLineItems).values({ invoiceId: invoice.id, description: `${input.kind === "credit" ? "Credit" : "Additional charge"}: ${input.description}`, quantity: 1, unitAmount: signedAmount.toFixed(2), taxRate: input.taxRate.toFixed(2), lineTotal: lineTotal.toFixed(2) });
    await db.update(invoices).set({ grandTotal: (asAmount(invoice.grandTotal) + lineTotal).toFixed(2), taxTotal: (asAmount(invoice.taxTotal) + signedTax).toFixed(2) }).where(eq(invoices.id, invoice.id));
    await db.update(bookings).set({ addOnTotal: (asAmount(booking.addOnTotal) + signedAmount).toFixed(2), grandTotal: (asAmount(booking.grandTotal) + lineTotal).toFixed(2) }).where(eq(bookings.id, booking.id));
    await recordAudit(ctx.user.id, { eventType: "booking.adjustment_issued", entityType: "booking_adjustment", entityId: String(created[0]!.id), metadata: { bookingCode: booking.bookingCode, kind: input.kind, amount: input.amount, taxRate: input.taxRate } });
    return { adjustmentId: created[0]!.id, lineTotal: lineTotal.toFixed(2) };
  }),

  voidAdjustment: protectedProcedure.input(z.object({ adjustmentId: z.number().int().positive(), reason: z.string().min(3).max(1000) })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "booking:manage");
    const db = await databaseOrThrow();
    const [adjustment] = await db.select().from(bookingAdjustments).where(eq(bookingAdjustments.id, input.adjustmentId)).limit(1);
    if (!adjustment) throw new TRPCError({ code: "NOT_FOUND", message: "Adjustment not found." });
    if (adjustment.status === "void") throw new TRPCError({ code: "CONFLICT", message: "This adjustment is already voided." });
    const [invoice] = adjustment.invoiceId ? await db.select().from(invoices).where(eq(invoices.id, adjustment.invoiceId)).limit(1) : [];
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, adjustment.bookingId)).limit(1);
    if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
    const sign = adjustment.kind === "credit" ? -1 : 1;
    const signedAmount = sign * asAmount(adjustment.amount);
    const signedTax = signedAmount * (asAmount(adjustment.taxRate) / 100);
    const lineTotal = signedAmount + signedTax;
    if (invoice) {
      await db.insert(invoiceLineItems).values({ invoiceId: invoice.id, description: `Reversal: ${adjustment.description}`, quantity: 1, unitAmount: (-signedAmount).toFixed(2), taxRate: adjustment.taxRate, lineTotal: (-lineTotal).toFixed(2) });
      await db.update(invoices).set({ grandTotal: (asAmount(invoice.grandTotal) - lineTotal).toFixed(2), taxTotal: (asAmount(invoice.taxTotal) - signedTax).toFixed(2) }).where(eq(invoices.id, invoice.id));
    }
    await db.update(bookings).set({ addOnTotal: (asAmount(booking.addOnTotal) - signedAmount).toFixed(2), grandTotal: (asAmount(booking.grandTotal) - lineTotal).toFixed(2) }).where(eq(bookings.id, booking.id));
    await db.update(bookingAdjustments).set({ status: "void", voidedByUserId: ctx.user.id, voidReason: input.reason }).where(eq(bookingAdjustments.id, adjustment.id));
    await recordAudit(ctx.user.id, { eventType: "booking.adjustment_voided", entityType: "booking_adjustment", entityId: String(adjustment.id), metadata: { bookingId: adjustment.bookingId, reason: input.reason } });
    return { adjustmentId: adjustment.id, status: "void" as const };
  }),

  createRefundRequest: protectedProcedure.input(z.object({ bookingCode: z.string().min(6).max(32), amount: z.number().positive().max(10_000_000), reason: z.string().min(8).max(1000), paymentId: z.number().int().positive().optional(), cancellationRequestId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
    const db = await databaseOrThrow();
    const booking = await ownedBooking(db, ctx.user.id, ctx.user.role, input.bookingCode);
    if (!isOperator(ctx.user.role) && input.amount > asAmount(booking.grandTotal)) throw new TRPCError({ code: "BAD_REQUEST", message: "A refund request cannot exceed the booking total." });
    const created = await db.insert(refundRequests).values({ bookingId: booking.id, paymentId: input.paymentId ?? null, cancellationRequestId: input.cancellationRequestId ?? null, requestedByUserId: ctx.user.id, amount: input.amount.toFixed(2), reason: input.reason }).$returningId();
    await recordAudit(ctx.user.id, { eventType: "refund.requested", entityType: "refund_request", entityId: String(created[0]!.id), metadata: { bookingCode: booking.bookingCode, amount: input.amount } });
    return { refundRequestId: created[0]!.id, status: "requested" as const };
  }),

  reviewRefund: protectedProcedure.input(z.object({ refundRequestId: z.number().int().positive(), status: refundState, operatorNote: z.string().max(1000).optional(), providerRefundId: z.string().max(160).optional() })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "booking:manage");
    const db = await databaseOrThrow();
    const [request] = await db.select().from(refundRequests).where(eq(refundRequests.id, input.refundRequestId)).limit(1);
    if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Refund request not found." });
    if (input.status === "processed" && !input.providerRefundId) throw new TRPCError({ code: "BAD_REQUEST", message: "A provider refund reference is required when marking a refund processed." });
    await db.update(refundRequests).set({ status: input.status, operatorNote: input.operatorNote ?? null, providerRefundId: input.providerRefundId ?? null, reviewedByUserId: ctx.user.id, reviewedAt: new Date(), processedAt: input.status === "processed" ? new Date() : null }).where(eq(refundRequests.id, request.id));
    if (input.status === "processed") {
      await db.update(bookings).set({ status: "refunded" }).where(eq(bookings.id, request.bookingId));
      if (request.paymentId) await db.update(payments).set({ status: "refunded" }).where(eq(payments.id, request.paymentId));
      await db.update(invoices).set({ status: "refunded" }).where(eq(invoices.bookingId, request.bookingId));
    }
    await recordAudit(ctx.user.id, { eventType: "refund.reviewed", entityType: "refund_request", entityId: String(request.id), metadata: { bookingId: request.bookingId, status: input.status } });
    return { refundRequestId: request.id, status: input.status };
  }),

  travelerDetail: protectedProcedure.input(z.object({ userId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "traveler:manage");
    const db = await databaseOrThrow();
    const [traveler] = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, avatarUrl: users.avatarUrl, role: users.role, isSuspended: users.isSuspended, isBanned: users.isBanned, createdAt: users.createdAt }).from(users).where(eq(users.id, input.userId)).limit(1);
    if (!traveler) throw new TRPCError({ code: "NOT_FOUND", message: "Traveler not found." });
    const [travelerBookings, tickets] = await Promise.all([
      db.select({ bookingCode: bookings.bookingCode, status: bookings.status, grandTotal: bookings.grandTotal, createdAt: bookings.createdAt, packageName: packages.name, destination: packages.destination }).from(bookings).innerJoin(packages, eq(packages.id, bookings.packageId)).where(eq(bookings.userId, traveler.id)).orderBy(desc(bookings.createdAt)),
      db.select({ ticketCode: supportTickets.ticketCode, subject: supportTickets.subject, status: supportTickets.status, updatedAt: supportTickets.updatedAt }).from(supportTickets).where(eq(supportTickets.userId, traveler.id)).orderBy(desc(supportTickets.updatedAt)),
    ]);
    return { traveler, bookings: travelerBookings, supportTickets: tickets };
  }),
});

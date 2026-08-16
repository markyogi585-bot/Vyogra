import { eq } from "drizzle-orm";
import { z } from "zod";
import { bookings, packages } from "../../drizzle/schema";
import { calculateBookingTotals, bookingCode } from "@shared/booking";
import { recordAudit } from "../audit/service";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertOwnership, isOperator } from "../security/roles";

export const bookingRouter = router({
  estimate: protectedProcedure.input(z.object({ packageId: z.number().int().positive(), travelerCount: z.number().int().min(1).max(12), addOnTotal: z.number().min(0).default(0) })).query(async ({ input }) => { const db = await getDb(); if (!db) return null; const [route] = await db.select().from(packages).where(eq(packages.id, input.packageId)).limit(1); if (!route) return null; return calculateBookingTotals(Number(route.basePrice), input.travelerCount, input.addOnTotal, 0); }),
  createDraft: protectedProcedure.input(z.object({ packageId: z.number().int().positive(), departureId: z.number().int().positive().optional(), travelerCount: z.number().int().min(1).max(12), subtotal: z.number().min(0), addOnTotal: z.number().min(0).default(0), notes: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const grandTotal = input.subtotal + input.addOnTotal; const [result] = await db.insert(bookings).values({ bookingCode: bookingCode(), userId: ctx.user.id, packageId: input.packageId, departureId: input.departureId, travelerCount: input.travelerCount, subtotal: String(input.subtotal), addOnTotal: String(input.addOnTotal), walletApplied: "0.00", grandTotal: String(grandTotal), notes: input.notes }).$returningId(); await recordAudit(ctx.user.id, { eventType: "booking.draft_created", entityType: "booking", entityId: String(result.id), metadata: { packageId: input.packageId, travelerCount: input.travelerCount } }); return { id: result.id, bookingCode: bookingCode() }; }),
  mine: protectedProcedure.query(async ({ ctx }) => { const db = await getDb(); if (!db) return []; return db.select().from(bookings).where(eq(bookings.userId, ctx.user.id)); }),
  byCode: protectedProcedure.input(z.object({ bookingCode: z.string().trim().min(6).max(32) })).query(async ({ ctx, input }) => { const db = await getDb(); if (!db) return null; const [booking] = await db.select().from(bookings).where(eq(bookings.bookingCode, input.bookingCode.toUpperCase())).limit(1); if (!booking) return null; if (!isOperator(ctx.user.role)) assertOwnership(ctx.user.id, booking.userId); return booking; }),
});

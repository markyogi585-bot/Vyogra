import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { bookings, reviews } from "../../drizzle/schema";
import { recordAudit } from "../audit/service";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const reviewRouter = router({
  create: protectedProcedure.input(z.object({ bookingId: z.number().int().positive(), rating: z.number().int().min(1).max(5), body: z.string().trim().min(20).max(500), tags: z.array(z.string().min(1).max(32)).max(6).default([]) })).mutation(async ({ ctx, input }) => { const db = await getDb(); if (!db) throw new Error("Database unavailable"); const [booking] = await db.select().from(bookings).where(and(eq(bookings.id, input.bookingId), eq(bookings.userId, ctx.user.id))).limit(1); if (!booking || booking.status !== "completed") throw new Error("Only completed VOYAGR trips can be reviewed."); const [result] = await db.insert(reviews).values({ bookingId: booking.id, userId: ctx.user.id, packageId: booking.packageId, rating: input.rating, body: input.body, tags: input.tags, status: "pending" }).$returningId(); await recordAudit(ctx.user.id, { eventType: "review.submitted", entityType: "review", entityId: String(result.id), metadata: { bookingId: booking.id } }); return { id: result.id, status: "pending" as const }; }),
  mine: protectedProcedure.query(async ({ ctx }) => { const db = await getDb(); if (!db) return []; return db.select().from(reviews).where(eq(reviews.userId, ctx.user.id)); }),
});

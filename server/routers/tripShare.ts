import { TRPCError } from "@trpc/server";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { bookings, packages, tripShareLinks } from "../../drizzle/schema";
import { recordAudit } from "../audit/service";
import { getDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { assertOwnership, isOperator } from "../security/roles";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

async function getShareableBooking(userId: number, role: string, bookingCode: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Trip sharing is temporarily unavailable." });
  const [booking] = await db.select({ id: bookings.id, userId: bookings.userId, bookingCode: bookings.bookingCode, packageName: packages.name, destination: packages.destination, coverImageUrl: packages.coverImageUrl }).from(bookings).innerJoin(packages, eq(packages.id, bookings.packageId)).where(eq(bookings.bookingCode, bookingCode)).limit(1);
  if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
  if (!isOperator(role)) assertOwnership(userId, booking.userId);
  return { db, booking };
}

export const tripShareRouter = router({
  create: protectedProcedure.input(z.object({ bookingCode: z.string().min(6).max(32), title: z.string().min(3).max(180).optional(), message: z.string().max(320).optional(), imageUrl: z.string().url().max(2048).optional(), expiresAt: z.date().optional() })).mutation(async ({ ctx, input }) => {
    if (input.expiresAt && input.expiresAt <= new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "A share link expiry must be in the future." });
    const { db, booking } = await getShareableBooking(ctx.user.id, ctx.user.role, input.bookingCode);
    const token = randomBytes(32).toString("base64url");
    const created = await db.insert(tripShareLinks).values({ bookingId: booking.id, tokenHash: hashToken(token), title: input.title ?? `${booking.packageName} · ${booking.destination}`, message: input.message ?? null, imageUrl: input.imageUrl ?? booking.coverImageUrl ?? null, expiresAt: input.expiresAt ?? null, createdByUserId: ctx.user.id }).$returningId();
    await recordAudit(ctx.user.id, { eventType: "trip.share_link_created", entityType: "trip_share_link", entityId: String(created[0]!.id), metadata: { bookingCode: booking.bookingCode, expiresAt: input.expiresAt?.toISOString() ?? null } });
    return { shareId: created[0]!.id, token, expiresAt: input.expiresAt ?? null };
  }),

  revoke: protectedProcedure.input(z.object({ shareId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Trip sharing is temporarily unavailable." });
    const [share] = await db.select({ id: tripShareLinks.id, bookingId: tripShareLinks.bookingId, userId: bookings.userId }).from(tripShareLinks).innerJoin(bookings, eq(bookings.id, tripShareLinks.bookingId)).where(eq(tripShareLinks.id, input.shareId)).limit(1);
    if (!share) throw new TRPCError({ code: "NOT_FOUND", message: "Share link not found." });
    if (!isOperator(ctx.user.role)) assertOwnership(ctx.user.id, share.userId);
    await db.update(tripShareLinks).set({ revokedAt: new Date() }).where(eq(tripShareLinks.id, share.id));
    await recordAudit(ctx.user.id, { eventType: "trip.share_link_revoked", entityType: "trip_share_link", entityId: String(share.id), metadata: { bookingId: share.bookingId } });
    return { shareId: share.id, revoked: true as const };
  }),

  resolve: publicProcedure.input(z.object({ token: z.string().min(20).max(160) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const [share] = await db.select({ title: tripShareLinks.title, message: tripShareLinks.message, imageUrl: tripShareLinks.imageUrl, packageName: packages.name, destination: packages.destination, durationDays: packages.durationDays, durationNights: packages.durationNights, bookingStatus: bookings.status, expiresAt: tripShareLinks.expiresAt }).from(tripShareLinks).innerJoin(bookings, eq(bookings.id, tripShareLinks.bookingId)).innerJoin(packages, eq(packages.id, bookings.packageId)).where(and(eq(tripShareLinks.tokenHash, hashToken(input.token)), isNull(tripShareLinks.revokedAt), or(isNull(tripShareLinks.expiresAt), gt(tripShareLinks.expiresAt, new Date())))).limit(1);
    return share ?? null;
  }),
});

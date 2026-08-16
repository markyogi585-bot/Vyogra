import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { assertOwnership, assertPermission, isOperator } from "../security/roles";
import { getDb } from "../db";
import { bookings, tripLocationCheckins, tripUpdateMedia, tripUpdates } from "../../drizzle/schema";
import { recordAudit } from "../audit/service";
import { tripLocationCheckinSchema } from "../../shared/tripLocation";

export const tripOpsRouter = router({
  publishUpdate: protectedProcedure.input(z.object({ bookingId: z.number().int().positive(), type: z.enum(["update", "milestone", "notice", "safety", "media"]), title: z.string().min(3).max(220), body: z.string().min(3).max(500), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), visibility: z.enum(["booking", "departure", "all_active"]), media: z.array(z.object({ storageKey: z.string().min(3).max(512), url: z.string().min(1).max(2048), mimeType: z.string().min(3).max(120), caption: z.string().max(240).optional() })).max(10).default([]) })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "booking:manage");
    const db = await getDb();
    if (!db) return { persisted: false as const, bookingId: input.bookingId, publishedBy: ctx.user.id, publishedAt: new Date(), type: input.type };
    const created = await db.insert(tripUpdates).values({ bookingId: input.bookingId, type: input.type, title: input.title, body: input.body, latitude: input.latitude?.toString(), longitude: input.longitude?.toString(), visibility: input.visibility, publishedByUserId: ctx.user.id }).$returningId();
    const updateId = created[0]!.id;
    if (input.media.length) await db.insert(tripUpdateMedia).values(input.media.map((media) => ({ tripUpdateId: updateId, storageKey: media.storageKey, url: media.url, mimeType: media.mimeType, caption: media.caption ?? null })));
    await recordAudit(ctx.user.id, { eventType: "trip.update_published", entityType: "trip_update", entityId: String(updateId), metadata: { bookingId: input.bookingId, type: input.type, visibility: input.visibility } });
    return { persisted: true as const, updateId, bookingId: input.bookingId, publishedBy: ctx.user.id, publishedAt: new Date(), type: input.type };
  }),
  stageMedia: protectedProcedure.input(z.object({ folder: z.enum(["packages", "users", "tickets", "announcements", "trip_updates"]), fileName: z.string().min(1).max(255), mimeType: z.string().min(3).max(120), byteSize: z.number().int().positive().max(10 * 1024 * 1024) })).mutation(({ ctx, input }) => {
    assertPermission(ctx.user.role, "booking:manage");
    return { accepted: true, uploadPolicy: { folder: input.folder, fileName: input.fileName, maxBytes: 10 * 1024 * 1024 }, stagedBy: ctx.user.id };
  }),
  publishCheckin: protectedProcedure.input(tripLocationCheckinSchema).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "booking:manage");
    const db = await getDb();
    if (!db) return { persisted: false as const, bookingId: input.bookingId };
    const created = await db.insert(tripLocationCheckins).values({ bookingId: input.bookingId, latitude: input.latitude.toFixed(7), longitude: input.longitude.toFixed(7), accuracyMeters: input.accuracyMeters ?? null, label: input.label ?? null, note: input.note ?? null, visibility: input.visibility, source: input.source, createdByUserId: ctx.user.id }).$returningId();
    await recordAudit(ctx.user.id, { eventType: "trip.location_checked_in", entityType: "trip_location_checkin", entityId: String(created[0]!.id), metadata: { bookingId: input.bookingId, visibility: input.visibility, source: input.source } });
    return { persisted: true as const, checkinId: created[0]!.id, bookingId: input.bookingId };
  }),
  latestCheckin: protectedProcedure.input(z.object({ bookingId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return null;
    const [booking] = await db.select({ userId: bookings.userId }).from(bookings).where(eq(bookings.id, input.bookingId)).limit(1);
    if (!booking) return null;
    if (!isOperator(ctx.user.role)) assertOwnership(ctx.user.id, booking.userId);
    const [checkin] = await db.select().from(tripLocationCheckins).where(eq(tripLocationCheckins.bookingId, input.bookingId)).orderBy(desc(tripLocationCheckins.capturedAt)).limit(1);
    return checkin ?? null;
  }),
});

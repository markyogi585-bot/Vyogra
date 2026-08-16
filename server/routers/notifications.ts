import { TRPCError } from "@trpc/server";
import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { bookings, notificationDeliveries, pushDevices } from "../../drizzle/schema";
import { recordAudit } from "../audit/service";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { assertOwnership, assertPermission } from "../security/roles";

const tokenHash = (value: string) => createHash("sha256").update(value).digest("hex");

export const notificationsRouter = router({
  registerDevice: protectedProcedure.input(z.object({ token: z.string().min(32).max(4096), platform: z.enum(["web", "android", "ios"]) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Notification registration is temporarily unavailable." });
    const digest = tokenHash(input.token);
    await db.insert(pushDevices).values({ userId: ctx.user.id, token: input.token, tokenHash: digest, platform: input.platform, isEnabled: true, lastSeenAt: new Date() }).onDuplicateKeyUpdate({ set: { userId: ctx.user.id, token: input.token, platform: input.platform, isEnabled: true, disabledAt: null, lastSeenAt: new Date() } });
    await recordAudit(ctx.user.id, { eventType: "push.device_registered", entityType: "push_device", entityId: digest.slice(0, 16), metadata: { platform: input.platform } });
    return { registered: true as const };
  }),

  disableDevice: protectedProcedure.input(z.object({ token: z.string().min(32).max(4096) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Notification registration is temporarily unavailable." });
    await db.update(pushDevices).set({ isEnabled: false, disabledAt: new Date() }).where(and(eq(pushDevices.userId, ctx.user.id), eq(pushDevices.tokenHash, tokenHash(input.token))));
    return { disabled: true as const };
  }),

  queueTripNotice: protectedProcedure.input(z.object({ bookingCode: z.string().min(6).max(32), title: z.string().min(3).max(180), body: z.string().min(3).max(1000), deepLink: z.string().startsWith("/").max(255).optional() })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "booking:manage");
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Notification delivery is temporarily unavailable." });
    const [booking] = await db.select({ id: bookings.id, userId: bookings.userId }).from(bookings).where(eq(bookings.bookingCode, input.bookingCode)).limit(1);
    if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
    const payload = { title: input.title, body: input.body, deepLink: input.deepLink ?? `/trip/${input.bookingCode}` };
    const [device] = await db.select({ id: pushDevices.id }).from(pushDevices).where(and(eq(pushDevices.userId, booking.userId), eq(pushDevices.isEnabled, true))).limit(1);
    const rows = [{ bookingId: booking.id, recipientUserId: booking.userId, channel: "in_app" as const, status: "sent" as const, payload, sentAt: new Date() }, ...(device ? [{ bookingId: booking.id, recipientUserId: booking.userId, channel: "push" as const, status: "queued" as const, payload }] : [])];
    await db.insert(notificationDeliveries).values(rows);
    await recordAudit(ctx.user.id, { eventType: "trip.notice_queued", entityType: "booking", entityId: String(booking.id), metadata: { hasPushDevice: Boolean(device), deepLink: payload.deepLink } });
    return { inAppDelivered: true as const, pushQueued: Boolean(device), firebaseDeliveryConfigured: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) };
  }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(notificationDeliveries).where(eq(notificationDeliveries.recipientUserId, ctx.user.id));
  }),
});

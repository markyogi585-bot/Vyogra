import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { announcements, bookingTravelers, broadcasts, supportChannels, supportTicketReplies, supportTickets } from "../../../drizzle/schema";
import { recordAudit } from "../../audit/service";
import { getDb } from "../../db";
import { assertPermission } from "../../security/roles";
import { protectedProcedure, router } from "../../_core/trpc";

const supportStatus = z.enum(["open", "in_progress", "resolved", "closed"]);

function assertChannelDestination(channel: "whatsapp" | "email" | "phone", destination: string) {
  const normalized = destination.trim();
  const isValid = channel === "email" ? z.string().email().safeParse(normalized).success : /^\+?[1-9]\d{6,14}$/.test(normalized.replace(/[\s()-]/g, ""));
  if (!isValid) throw new Error(channel === "email" ? "Enter a valid support email address." : "Enter a valid international support number.");
  return channel === "email" ? normalized : normalized.replace(/[^\d+]/g, "");
}

export const adminEngagementRouter = router({
  childTravelers: protectedProcedure.input(z.object({ bookingId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "booking:manage");
    const db = await getDb();
    if (!db) return [];
    return db.select().from(bookingTravelers).where(eq(bookingTravelers.bookingId, input.bookingId)).orderBy(desc(bookingTravelers.createdAt));
  }),
  addChildTraveler: protectedProcedure.input(z.object({ bookingId: z.number().int().positive(), fullName: z.string().trim().min(2).max(160), travelerCategory: z.enum(["child", "infant"]), dateOfBirth: z.coerce.date(), guardianName: z.string().trim().min(2).max(160), guardianPhone: z.string().trim().min(7).max(32), dietaryNotes: z.string().trim().max(1500).optional(), guardianConsent: z.literal(true) })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "booking:manage");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [created] = await db.insert(bookingTravelers).values({ bookingId: input.bookingId, fullName: input.fullName, travelerCategory: input.travelerCategory, dateOfBirth: input.dateOfBirth, guardianName: input.guardianName, guardianPhone: input.guardianPhone, guardianConsentAt: new Date(), dietaryNotes: input.dietaryNotes ?? null }).$returningId();
    await recordAudit(ctx.user.id, { eventType: "booking.child_traveler_added", entityType: "booking_traveler", entityId: String(created.id), metadata: { bookingId: input.bookingId, travelerCategory: input.travelerCategory } });
    return { id: created.id };
  }),
  listAnnouncements: protectedProcedure.query(async ({ ctx }) => {
    assertPermission(ctx.user.role, "announcement:manage");
    const db = await getDb();
    if (!db) return [];
    return db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(100);
  }),
  saveAnnouncement: protectedProcedure.input(z.object({ title: z.string().trim().min(3).max(180), body: z.string().trim().min(5).max(2000), startsAt: z.coerce.date().optional(), endsAt: z.coerce.date().optional(), isActive: z.boolean() })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "announcement:manage");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [created] = await db.insert(announcements).values({ ...input, startsAt: input.startsAt ?? null, endsAt: input.endsAt ?? null, createdByUserId: ctx.user.id }).$returningId();
    await recordAudit(ctx.user.id, { eventType: "announcement.saved", entityType: "announcement", entityId: String(created.id), metadata: { isActive: input.isActive } });
    return { id: created.id };
  }),
  setAnnouncementActive: protectedProcedure.input(z.object({ announcementId: z.number().int().positive(), isActive: z.boolean() })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "announcement:manage");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.update(announcements).set({ isActive: input.isActive }).where(eq(announcements.id, input.announcementId));
    await recordAudit(ctx.user.id, { eventType: "announcement.status_changed", entityType: "announcement", entityId: String(input.announcementId), metadata: { isActive: input.isActive } });
    return { success: true };
  }),
  broadcasts: protectedProcedure.query(async ({ ctx }) => {
    assertPermission(ctx.user.role, "broadcast:manage");
    const db = await getDb();
    if (!db) return [];
    return db.select().from(broadcasts).orderBy(desc(broadcasts.createdAt)).limit(100);
  }),
  publishInAppBroadcast: protectedProcedure.input(z.object({ broadcastId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "broadcast:manage");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.update(broadcasts).set({ status: "sent", sentAt: new Date() }).where(eq(broadcasts.id, input.broadcastId));
    await recordAudit(ctx.user.id, { eventType: "broadcast.in_app_published", entityType: "broadcast", entityId: String(input.broadcastId), metadata: { delivery: "in_app" } });
    return { success: true, delivery: "in_app" as const };
  }),
  supportQueue: protectedProcedure.query(async ({ ctx }) => {
    assertPermission(ctx.user.role, "support:manage");
    const db = await getDb();
    if (!db) return [];
    return db.select().from(supportTickets).orderBy(desc(supportTickets.updatedAt)).limit(150);
  }),
  supportThread: protectedProcedure.input(z.object({ ticketId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "support:manage");
    const db = await getDb();
    if (!db) return [];
    return db.select().from(supportTicketReplies).where(eq(supportTicketReplies.ticketId, input.ticketId)).orderBy(supportTicketReplies.createdAt);
  }),
  replyToSupport: protectedProcedure.input(z.object({ ticketId: z.number().int().positive(), body: z.string().trim().min(2).max(3000), visibleToTraveler: z.boolean().default(true), status: supportStatus.optional() })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "support:manage");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [created] = await db.insert(supportTicketReplies).values({ ticketId: input.ticketId, authorUserId: ctx.user.id, body: input.body, visibleToTraveler: input.visibleToTraveler }).$returningId();
    if (input.status) await db.update(supportTickets).set({ status: input.status, assignedToUserId: ctx.user.id }).where(eq(supportTickets.id, input.ticketId));
    await recordAudit(ctx.user.id, { eventType: "support.reply_added", entityType: "support_ticket", entityId: String(input.ticketId), metadata: { replyId: created.id, visibleToTraveler: input.visibleToTraveler, status: input.status } });
    return { id: created.id };
  }),
  setSupportStatus: protectedProcedure.input(z.object({ ticketId: z.number().int().positive(), status: supportStatus, assignedToUserId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "support:manage");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.update(supportTickets).set({ status: input.status, assignedToUserId: input.assignedToUserId ?? ctx.user.id }).where(eq(supportTickets.id, input.ticketId));
    await recordAudit(ctx.user.id, { eventType: "support.status_changed", entityType: "support_ticket", entityId: String(input.ticketId), metadata: { status: input.status } });
    return { success: true };
  }),
  supportChannels: protectedProcedure.query(async ({ ctx }) => {
    assertPermission(ctx.user.role, "contact:manage");
    const db = await getDb();
    if (!db) return [];
    return db.select().from(supportChannels).orderBy(supportChannels.channel);
  }),
  saveSupportChannel: protectedProcedure.input(z.object({ channel: z.enum(["whatsapp", "email", "phone"]), label: z.string().trim().min(2).max(80), destination: z.string().trim().min(5).max(255), isActive: z.boolean() })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "contact:manage");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const destination = assertChannelDestination(input.channel, input.destination);
    await db.insert(supportChannels).values({ channel: input.channel, label: input.label, destination, isActive: input.isActive, updatedByUserId: ctx.user.id }).onDuplicateKeyUpdate({ set: { label: input.label, destination, isActive: input.isActive, updatedByUserId: ctx.user.id, updatedAt: new Date() } });
    await recordAudit(ctx.user.id, { eventType: "support.channel_saved", entityType: "support_channel", entityId: input.channel, metadata: { active: input.isActive } });
    return { success: true };
  }),
});

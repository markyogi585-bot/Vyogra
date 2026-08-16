import { z } from "zod";
import { and, desc, eq, or, isNull, lte, gte } from "drizzle-orm";
import { announcements, coupons, featuredWidgets } from "../../drizzle/schema";
import { getDb } from "../db";
import { recordAudit } from "../audit/service";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { assertPermission } from "../security/roles";

export const campaignsRouter = router({
  activeAnnouncements: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const now = new Date();
    return db.select({ id: announcements.id, title: announcements.title, body: announcements.body, startsAt: announcements.startsAt, endsAt: announcements.endsAt }).from(announcements).where(and(eq(announcements.isActive, true), or(isNull(announcements.startsAt), lte(announcements.startsAt, now)), or(isNull(announcements.endsAt), gte(announcements.endsAt, now)))).orderBy(desc(announcements.createdAt)).limit(12);
  }),
  activeWidgets: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const now = new Date();
    return db.select({ id: featuredWidgets.id, title: featuredWidgets.title, body: featuredWidgets.body, kind: featuredWidgets.kind, deepLink: featuredWidgets.deepLink, startsAt: featuredWidgets.startsAt, endsAt: featuredWidgets.endsAt }).from(featuredWidgets).where(and(eq(featuredWidgets.isActive, true), or(isNull(featuredWidgets.startsAt), lte(featuredWidgets.startsAt, now)), or(isNull(featuredWidgets.endsAt), gte(featuredWidgets.endsAt, now)))).orderBy(featuredWidgets.createdAt).limit(6);
  }),
  createCoupon: protectedProcedure.input(z.object({ code: z.string().min(3).max(64), title: z.string().min(3).max(160), discountType: z.enum(["flat", "percent"]), discountValue: z.number().positive(), minimumSubtotal: z.number().nonnegative().default(0), endsAt: z.date().optional() })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "broadcast:manage");
    const db = await getDb();
    if (!db) return { persisted: false as const, code: input.code.toUpperCase() };
    const created = await db.insert(coupons).values({ code: input.code.toUpperCase(), title: input.title, discountType: input.discountType, discountValue: input.discountValue.toFixed(2), minimumSubtotal: input.minimumSubtotal.toFixed(2), endsAt: input.endsAt, isActive: true, createdByUserId: ctx.user.id }).$returningId();
    await recordAudit(ctx.user.id, { eventType: "campaign.coupon_created", entityType: "coupon", entityId: String(created[0]!.id), metadata: { code: input.code.toUpperCase(), discountType: input.discountType, discountValue: input.discountValue } });
    return { persisted: true as const, couponId: created[0]!.id, code: input.code.toUpperCase() };
  }),
  saveWidget: protectedProcedure.input(z.object({ title: z.string().min(3).max(180), body: z.string().min(3), kind: z.enum(["daily_deal", "flash_sale", "offer", "announcement"]), deepLink: z.string().max(255).optional(), startsAt: z.date().optional(), endsAt: z.date().optional(), isActive: z.boolean() })).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "broadcast:manage");
    const db = await getDb();
    if (!db) return { persisted: false as const, kind: input.kind };
    const created = await db.insert(featuredWidgets).values({ title: input.title, body: input.body, kind: input.kind, deepLink: input.deepLink ?? null, startsAt: input.startsAt, endsAt: input.endsAt, isActive: input.isActive, createdByUserId: ctx.user.id }).$returningId();
    await recordAudit(ctx.user.id, { eventType: "campaign.widget_saved", entityType: "featured_widget", entityId: String(created[0]!.id), metadata: { kind: input.kind, active: input.isActive } });
    return { persisted: true as const, widgetId: created[0]!.id, kind: input.kind };
  }),
});

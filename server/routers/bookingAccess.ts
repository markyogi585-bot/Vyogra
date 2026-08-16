import { z } from "zod";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import { BOOKING_ACCESS_COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { createBookingAccessToken, verifyBookingAccessToken } from "../security/bookingAccessToken";
import { publicProcedure, router } from "../_core/trpc";
import { accessExpiresAt, isValidBookingAccessInput, normalizeBookingCode, normalizeContactSuffix } from "@shared/bookingAccess";
import { bookingAccessGrants, bookingCancellationRequests, bookingExtensionRequests, bookingTravelers, bookings, bookingTripSchedules, invoices, packages, tripLocationCheckins, tripShareLinks, tripUpdates } from "../../drizzle/schema";
import { getDb } from "../db";

const DEMO_BOOKING_CODE = "DEMO-VYG-GOA-2026";
const DEMO_CONTACT_SUFFIX = "2345";

export const bookingAccessRouter = router({
  validate: publicProcedure.input(z.object({ bookingCode: z.string().min(6).max(32), contactSuffix: z.string().min(4).max(16) })).mutation(({ input }) => {
    const normalized = { bookingCode: normalizeBookingCode(input.bookingCode), contactSuffix: normalizeContactSuffix(input.contactSuffix) };
    if (!isValidBookingAccessInput(normalized)) return { verified: false as const, reason: "FORMAT_INVALID" as const };
    return { verified: true as const, bookingCode: normalized.bookingCode, expiresAt: accessExpiresAt(), scope: ["booking", "documents", "invoice", "trip_updates"] };
  }),
  open: publicProcedure.input(z.object({ bookingCode: z.string().min(6).max(32), contactSuffix: z.string().min(4).max(16) })).mutation(async ({ ctx, input }) => {
    const normalized = { bookingCode: normalizeBookingCode(input.bookingCode), contactSuffix: normalizeContactSuffix(input.contactSuffix) };
    if (normalized.bookingCode === DEMO_BOOKING_CODE && normalized.contactSuffix === DEMO_CONTACT_SUFFIX) {
      return { verified: true as const, demo: true as const, bookingCode: DEMO_BOOKING_CODE, scope: ["demo"] as const };
    }
    if (!isValidBookingAccessInput(normalized)) return { verified: false as const, reason: "FORMAT_INVALID" as const };
    const db = await getDb();
    if (!db) return { verified: false as const, reason: "ACCESS_UNAVAILABLE" as const };
    const [booking] = await db.select({ id: bookings.id, bookingCode: bookings.bookingCode, status: bookings.status, travelerCount: bookings.travelerCount, grandTotal: bookings.grandTotal, packageName: packages.name, destination: packages.destination, durationDays: packages.durationDays, durationNights: packages.durationNights }).from(bookings).innerJoin(packages, eq(bookings.packageId, packages.id)).where(eq(bookings.bookingCode, normalized.bookingCode)).limit(1);
    if (!booking) return { verified: false as const, reason: "NOT_FOUND" as const };
    const suffixHash = createHash("sha256").update(normalized.contactSuffix).digest("hex");
    const [grant] = await db.select({ id: bookingAccessGrants.id, expiresAt: bookingAccessGrants.expiresAt, accessScope: bookingAccessGrants.accessScope }).from(bookingAccessGrants).where(and(eq(bookingAccessGrants.bookingId, booking.id), eq(bookingAccessGrants.verifiedContactHash, suffixHash), gt(bookingAccessGrants.expiresAt, new Date()), isNull(bookingAccessGrants.revokedAt))).limit(1);
    if (!grant) return { verified: false as const, reason: "VERIFICATION_FAILED" as const };
    const token = await createBookingAccessToken({ bookingId: booking.id, grantId: grant.id, bookingCode: booking.bookingCode }, grant.expiresAt);
    ctx.res.cookie(BOOKING_ACCESS_COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: Math.max(0, grant.expiresAt.getTime() - Date.now()) });
    await db.update(bookingAccessGrants).set({ lastUsedAt: new Date() }).where(eq(bookingAccessGrants.id, grant.id));
    const travelers = await db.select({ fullName: bookingTravelers.fullName, phone: bookingTravelers.phone, email: bookingTravelers.email, dietaryNotes: bookingTravelers.dietaryNotes }).from(bookingTravelers).where(eq(bookingTravelers.bookingId, booking.id));
    const [invoice] = await db.select({ invoiceNumber: invoices.invoiceNumber, status: invoices.status, grandTotal: invoices.grandTotal }).from(invoices).where(eq(invoices.bookingId, booking.id)).limit(1);
    return { verified: true as const, scope: grant.accessScope, expiresAt: grant.expiresAt, booking, travelers, invoice: invoice ?? null };
  }),
  current: publicProcedure.input(z.object({ bookingCode: z.string().min(6).max(32) })).query(async ({ ctx, input }) => {
    const normalizedCode = normalizeBookingCode(input.bookingCode);
    const cookie = parseCookieHeader(ctx.req.headers.cookie ?? "")[BOOKING_ACCESS_COOKIE_NAME];
    const token = await verifyBookingAccessToken(cookie);
    if (!token || token.bookingCode !== normalizedCode) return { verified: false as const, reason: "ACCESS_REQUIRED" as const };
    const db = await getDb();
    if (!db) return { verified: false as const, reason: "ACCESS_UNAVAILABLE" as const };
    const [grant] = await db.select({ id: bookingAccessGrants.id, expiresAt: bookingAccessGrants.expiresAt, accessScope: bookingAccessGrants.accessScope }).from(bookingAccessGrants).where(and(eq(bookingAccessGrants.id, token.grantId), eq(bookingAccessGrants.bookingId, token.bookingId), gt(bookingAccessGrants.expiresAt, new Date()), isNull(bookingAccessGrants.revokedAt))).limit(1);
    if (!grant) { ctx.res.clearCookie(BOOKING_ACCESS_COOKIE_NAME, getSessionCookieOptions(ctx.req)); return { verified: false as const, reason: "ACCESS_EXPIRED" as const }; }
    const [booking] = await db.select({ id: bookings.id, bookingCode: bookings.bookingCode, status: bookings.status, travelerCount: bookings.travelerCount, grandTotal: bookings.grandTotal, packageName: packages.name, destination: packages.destination, durationDays: packages.durationDays, durationNights: packages.durationNights }).from(bookings).innerJoin(packages, eq(bookings.packageId, packages.id)).where(eq(bookings.id, token.bookingId)).limit(1);
    if (!booking) return { verified: false as const, reason: "NOT_FOUND" as const };
    const travelers = await db.select({ fullName: bookingTravelers.fullName, phone: bookingTravelers.phone, email: bookingTravelers.email, dietaryNotes: bookingTravelers.dietaryNotes }).from(bookingTravelers).where(eq(bookingTravelers.bookingId, booking.id));
    const [invoice] = await db.select({ invoiceNumber: invoices.invoiceNumber, status: invoices.status, grandTotal: invoices.grandTotal }).from(invoices).where(eq(invoices.bookingId, booking.id)).limit(1);
    await db.update(bookingAccessGrants).set({ lastUsedAt: new Date() }).where(eq(bookingAccessGrants.id, grant.id));
    return { verified: true as const, scope: grant.accessScope, expiresAt: grant.expiresAt, booking, travelers, invoice: invoice ?? null };
  }),
  tripDesk: publicProcedure.input(z.object({ bookingCode: z.string().min(6).max(32) })).query(async ({ ctx, input }) => {
    const normalizedCode = normalizeBookingCode(input.bookingCode);
    const cookie = parseCookieHeader(ctx.req.headers.cookie ?? "")[BOOKING_ACCESS_COOKIE_NAME];
    const token = await verifyBookingAccessToken(cookie);
    if (!token || token.bookingCode !== normalizedCode) return { verified: false as const, reason: "ACCESS_REQUIRED" as const };
    const db = await getDb();
    if (!db) return { verified: false as const, reason: "ACCESS_UNAVAILABLE" as const };
    const [grant] = await db.select({ id: bookingAccessGrants.id, expiresAt: bookingAccessGrants.expiresAt, accessScope: bookingAccessGrants.accessScope }).from(bookingAccessGrants).where(and(eq(bookingAccessGrants.id, token.grantId), eq(bookingAccessGrants.bookingId, token.bookingId), gt(bookingAccessGrants.expiresAt, new Date()), isNull(bookingAccessGrants.revokedAt))).limit(1);
    if (!grant || !grant.accessScope?.includes("trip_updates")) return { verified: false as const, reason: "ACCESS_EXPIRED" as const };
    const [booking] = await db.select({ id: bookings.id, bookingCode: bookings.bookingCode, status: bookings.status, travelerCount: bookings.travelerCount, packageName: packages.name, destination: packages.destination, durationDays: packages.durationDays, durationNights: packages.durationNights, coverImageUrl: packages.coverImageUrl, startsAt: bookingTripSchedules.startsAt, endsAt: bookingTripSchedules.endsAt }).from(bookings).innerJoin(packages, eq(bookings.packageId, packages.id)).leftJoin(bookingTripSchedules, eq(bookingTripSchedules.bookingId, bookings.id)).where(and(eq(bookings.id, token.bookingId), eq(bookings.bookingCode, normalizedCode))).limit(1);
    if (!booking) return { verified: false as const, reason: "NOT_FOUND" as const };
    const [checkin] = await db.select().from(tripLocationCheckins).where(eq(tripLocationCheckins.bookingId, booking.id)).orderBy(desc(tripLocationCheckins.capturedAt)).limit(1);
    const updates = await db.select({ id: tripUpdates.id, type: tripUpdates.type, title: tripUpdates.title, body: tripUpdates.body, publishedAt: tripUpdates.publishedAt }).from(tripUpdates).where(eq(tripUpdates.bookingId, booking.id)).orderBy(desc(tripUpdates.publishedAt)).limit(12);
    await db.update(bookingAccessGrants).set({ lastUsedAt: new Date() }).where(eq(bookingAccessGrants.id, grant.id));
    return { verified: true as const, expiresAt: grant.expiresAt, booking, checkin: checkin ?? null, updates };
  }),
  requestExtension: publicProcedure.input(z.object({ bookingCode: z.string().min(6).max(32), additionalDays: z.number().int().min(1).max(30), reason: z.string().min(8).max(1000) })).mutation(async ({ ctx, input }) => {
    const normalizedCode = normalizeBookingCode(input.bookingCode);
    const token = await verifyBookingAccessToken(parseCookieHeader(ctx.req.headers.cookie ?? "")[BOOKING_ACCESS_COOKIE_NAME]);
    if (!token || token.bookingCode !== normalizedCode) return { accepted: false as const, reason: "ACCESS_REQUIRED" as const };
    const db = await getDb();
    if (!db) return { accepted: false as const, reason: "ACCESS_UNAVAILABLE" as const };
    const [grant] = await db.select({ id: bookingAccessGrants.id }).from(bookingAccessGrants).where(and(eq(bookingAccessGrants.id, token.grantId), eq(bookingAccessGrants.bookingId, token.bookingId), gt(bookingAccessGrants.expiresAt, new Date()), isNull(bookingAccessGrants.revokedAt))).limit(1);
    if (!grant) return { accepted: false as const, reason: "ACCESS_EXPIRED" as const };
    const created = await db.insert(bookingExtensionRequests).values({ bookingId: token.bookingId, requestedByUserId: null, additionalDays: input.additionalDays, reason: input.reason }).$returningId();
    return { accepted: true as const, requestId: created[0]!.id, status: "requested" as const };
  }),
  requestCancellation: publicProcedure.input(z.object({ bookingCode: z.string().min(6).max(32), reason: z.string().min(8).max(1000), requestedRefundAmount: z.number().nonnegative().optional() })).mutation(async ({ ctx, input }) => {
    const normalizedCode = normalizeBookingCode(input.bookingCode);
    const token = await verifyBookingAccessToken(parseCookieHeader(ctx.req.headers.cookie ?? "")[BOOKING_ACCESS_COOKIE_NAME]);
    if (!token || token.bookingCode !== normalizedCode) return { accepted: false as const, reason: "ACCESS_REQUIRED" as const };
    const db = await getDb();
    if (!db) return { accepted: false as const, reason: "ACCESS_UNAVAILABLE" as const };
    const [grant] = await db.select({ id: bookingAccessGrants.id }).from(bookingAccessGrants).where(and(eq(bookingAccessGrants.id, token.grantId), eq(bookingAccessGrants.bookingId, token.bookingId), gt(bookingAccessGrants.expiresAt, new Date()), isNull(bookingAccessGrants.revokedAt))).limit(1);
    if (!grant) return { accepted: false as const, reason: "ACCESS_EXPIRED" as const };
    const [booking] = await db.select({ status: bookings.status }).from(bookings).where(eq(bookings.id, token.bookingId)).limit(1);
    if (!booking || ["cancelled", "refunded"].includes(booking.status)) return { accepted: false as const, reason: "BOOKING_CLOSED" as const };
    const created = await db.insert(bookingCancellationRequests).values({ bookingId: token.bookingId, requestedByUserId: null, reason: input.reason, requestedRefundAmount: input.requestedRefundAmount?.toFixed(2) ?? null }).$returningId();
    return { accepted: true as const, requestId: created[0]!.id, status: "requested" as const };
  }),
  createTripShare: publicProcedure.input(z.object({ bookingCode: z.string().min(6).max(32), message: z.string().max(320).optional() })).mutation(async ({ ctx, input }) => {
    const normalizedCode = normalizeBookingCode(input.bookingCode);
    const token = await verifyBookingAccessToken(parseCookieHeader(ctx.req.headers.cookie ?? "")[BOOKING_ACCESS_COOKIE_NAME]);
    if (!token || token.bookingCode !== normalizedCode) return { created: false as const, reason: "ACCESS_REQUIRED" as const };
    const db = await getDb();
    if (!db) return { created: false as const, reason: "ACCESS_UNAVAILABLE" as const };
    const [grant] = await db.select({ id: bookingAccessGrants.id }).from(bookingAccessGrants).where(and(eq(bookingAccessGrants.id, token.grantId), eq(bookingAccessGrants.bookingId, token.bookingId), gt(bookingAccessGrants.expiresAt, new Date()), isNull(bookingAccessGrants.revokedAt))).limit(1);
    if (!grant) return { created: false as const, reason: "ACCESS_EXPIRED" as const };
    const [booking] = await db.select({ packageName: packages.name, destination: packages.destination, coverImageUrl: packages.coverImageUrl }).from(bookings).innerJoin(packages, eq(packages.id, bookings.packageId)).where(eq(bookings.id, token.bookingId)).limit(1);
    if (!booking) return { created: false as const, reason: "NOT_FOUND" as const };
    const shareToken = randomBytes(32).toString("base64url");
    const created = await db.insert(tripShareLinks).values({ bookingId: token.bookingId, tokenHash: createHash("sha256").update(shareToken).digest("hex"), title: `${booking.packageName} · ${booking.destination}`, message: input.message ?? null, imageUrl: booking.coverImageUrl ?? null, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000), createdByUserId: 0 }).$returningId();
    return { created: true as const, shareId: created[0]!.id, token: shareToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000) };
  }),
});

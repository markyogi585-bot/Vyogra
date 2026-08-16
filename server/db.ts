import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { bookingAccessGrants, bookingTermsAcceptances, bookings, bookingTravelers, invoiceLineItems, invoices, packageTerms, users } from "../drizzle/schema";
import type { InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { createHash } from "node:crypto";

let database: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!database && process.env.DATABASE_URL) {
    try { database = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect", error); database = null; }
  }
  return database;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, name: user.name ?? null, email: user.email ?? null, phone: user.phone ?? null, avatarUrl: user.avatarUrl ?? null, loginMethod: user.loginMethod ?? null, lastSignedIn: new Date(), role: user.role ?? (user.openId === ENV.ownerOpenId ? "super_admin" : "user") };
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: { name: values.name, email: values.email, phone: values.phone, avatarUrl: values.avatarUrl, loginMethod: values.loginMethod, role: values.role, lastSignedIn: new Date() } });
}

export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return rows[0]; }

export async function ensureFirebaseUser(identity: { uid: string; name: string | null; email: string | null; phone: string | null; picture: string | null; provider: string | null; role: "user" | "sub_admin" | "admin" | "super_admin" | null }) {
  const db = await getDb();
  if (!db) return undefined;
  const openId = `firebase:${identity.uid}`;
  const existing = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  if (existing[0]) {
    await db.update(users).set({ name: identity.name, email: identity.email, phone: identity.phone, avatarUrl: identity.picture, loginMethod: identity.provider, role: identity.role ?? existing[0].role, lastSignedIn: new Date() }).where(eq(users.id, existing[0].id));
    return (await db.select().from(users).where(eq(users.id, existing[0].id)).limit(1))[0];
  }
  // A phone-authenticated traveler may already hold bookings issued manually by
  // an operator. Merge only on Firebase-verified phone equality, preserving the
  // existing role and booking history rather than trusting an arbitrary email.
  if (identity.phone) {
    const legacy = await db.select().from(users).where(eq(users.phone, identity.phone)).limit(1);
    if (legacy[0]) {
      await db.update(users).set({ openId, name: identity.name ?? legacy[0].name, avatarUrl: identity.picture, loginMethod: identity.provider, role: identity.role ?? legacy[0].role, lastSignedIn: new Date() }).where(eq(users.id, legacy[0].id));
      return (await db.select().from(users).where(eq(users.id, legacy[0].id)).limit(1))[0];
    }
  }
  await db.insert(users).values({ openId, name: identity.name, email: identity.email, phone: identity.phone, avatarUrl: identity.picture, loginMethod: identity.provider, role: identity.role ?? "user", lastSignedIn: new Date() });
  return (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
}

type PersistManualBookingInput = {
  actorUserId: number;
  travelerName: string;
  phone: string;
  email?: string;
  packageId: number;
  travelerCount: number;
  acceptedTerms: boolean;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  bookingCode: string;
  invoiceNumber: string;
};

export async function persistManualBooking(input: PersistManualBookingInput) {
  const db = await getDb();
  if (!db) return { persisted: false as const };
  if (!input.acceptedTerms) throw new Error("A package terms acceptance is required before a booking can be issued.");
  return db.transaction(async (tx) => {
    const normalizedPhone = input.phone.replace(/\D/g, "");
    const existingTraveler = await tx.select({ id: users.id }).from(users).where(eq(users.phone, input.phone)).limit(1);
    let travelerUserId = existingTraveler[0]?.id;
    if (!travelerUserId) {
      const inserted = await tx.insert(users).values({ openId: `manual:${normalizedPhone}:${Date.now()}`, name: input.travelerName, phone: input.phone, email: input.email ?? null, loginMethod: "booking_access", role: "user", lastSignedIn: new Date() }).$returningId();
      travelerUserId = inserted[0]!.id;
    }
    const bookingResult = await tx.insert(bookings).values({ bookingCode: input.bookingCode, userId: travelerUserId, packageId: input.packageId, status: "confirmed", travelerCount: input.travelerCount, subtotal: input.subtotal.toFixed(2), addOnTotal: "0.00", walletApplied: "0.00", grandTotal: input.total.toFixed(2), confirmedAt: new Date(), notes: "Issued through manual booking workspace." }).$returningId();
    const bookingId = bookingResult[0]!.id;
    await tx.insert(bookingTravelers).values({ bookingId, fullName: input.travelerName, phone: input.phone, email: input.email ?? null });
    const termsResult = await tx.insert(packageTerms).values({ packageId: input.packageId, revision: `manual-${Date.now()}`, title: "Manual booking terms", body: "Traveler accepted the package-specific cancellation, rooming, and conduct terms at issue time.", isActive: true, createdByUserId: input.actorUserId }).$returningId();
    await tx.insert(bookingTermsAcceptances).values({ bookingId, packageTermsId: termsResult[0]!.id, acceptedByUserId: travelerUserId, acceptedByName: input.travelerName, acceptanceSource: "admin_manual_booking" });
    const invoiceResult = await tx.insert(invoices).values({ invoiceNumber: input.invoiceNumber, bookingId, userId: travelerUserId, status: "issued", subtotal: input.subtotal.toFixed(2), taxTotal: input.tax.toFixed(2), discountTotal: input.discount.toFixed(2), grandTotal: input.total.toFixed(2), currency: "INR", billingSnapshot: { travelerName: input.travelerName, phone: input.phone, email: input.email ?? null }, issuedByUserId: input.actorUserId, issuedAt: new Date() }).$returningId();
    await tx.insert(invoiceLineItems).values([{ invoiceId: invoiceResult[0]!.id, description: "Tour package", quantity: 1, unitAmount: input.subtotal.toFixed(2), taxRate: input.subtotal ? ((input.tax / input.subtotal) * 100).toFixed(2) : "0.00", lineTotal: (input.subtotal + input.tax).toFixed(2) }, ...(input.discount > 0 ? [{ invoiceId: invoiceResult[0]!.id, description: "Campaign credit", quantity: 1, unitAmount: (-input.discount).toFixed(2), taxRate: "0.00", lineTotal: (-input.discount).toFixed(2) }] : [])]);
    const accessSecret = `${input.bookingCode}:${normalizedPhone}:${Date.now()}`;
    await tx.insert(bookingAccessGrants).values({ bookingId, tokenHash: createHash("sha256").update(accessSecret).digest("hex"), verifiedContactHash: createHash("sha256").update(normalizedPhone.slice(-4)).digest("hex"), accessScope: ["booking", "documents", "invoice", "trip_updates"], expiresAt: new Date(Date.now() + 20 * 60_000), createdByUserId: input.actorUserId });
    return { persisted: true as const, bookingId, invoiceId: invoiceResult[0]!.id, travelerUserId };
  });
}

type PersistTravelerCheckoutInput = {
  userId: number;
  travelerName: string;
  phone: string;
  email?: string;
  packageId: number;
  travelerCount: number;
  acceptedTerms: boolean;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  bookingCode: string;
  invoiceNumber: string;
};

export async function persistTravelerCheckout(input: PersistTravelerCheckoutInput) {
  const db = await getDb();
  if (!db) return { persisted: false as const };
  if (!input.acceptedTerms) throw new Error("Package terms must be accepted before checkout can be confirmed.");
  return db.transaction(async (tx) => {
    const bookingResult = await tx.insert(bookings).values({ bookingCode: input.bookingCode, userId: input.userId, packageId: input.packageId, status: "confirmed", travelerCount: input.travelerCount, subtotal: input.subtotal.toFixed(2), addOnTotal: "0.00", walletApplied: "0.00", grandTotal: input.total.toFixed(2), confirmedAt: new Date(), notes: "Issued through authenticated traveler checkout." }).$returningId();
    const bookingId = bookingResult[0]!.id;
    await tx.insert(bookingTravelers).values({ bookingId, fullName: input.travelerName, phone: input.phone, email: input.email ?? null });
    const termsResult = await tx.insert(packageTerms).values({ packageId: input.packageId, revision: `checkout-${Date.now()}`, title: "Traveler checkout terms", body: "Traveler accepted the package-specific cancellation, rooming, conduct, and payment terms at checkout.", isActive: true, createdByUserId: input.userId }).$returningId();
    await tx.insert(bookingTermsAcceptances).values({ bookingId, packageTermsId: termsResult[0]!.id, acceptedByUserId: input.userId, acceptedByName: input.travelerName, acceptanceSource: "traveler_checkout" });
    const invoiceResult = await tx.insert(invoices).values({ invoiceNumber: input.invoiceNumber, bookingId, userId: input.userId, status: "issued", subtotal: input.subtotal.toFixed(2), taxTotal: input.tax.toFixed(2), discountTotal: input.discount.toFixed(2), grandTotal: input.total.toFixed(2), currency: "INR", billingSnapshot: { travelerName: input.travelerName, phone: input.phone, email: input.email ?? null }, issuedByUserId: input.userId, issuedAt: new Date() }).$returningId();
    await tx.insert(invoiceLineItems).values([{ invoiceId: invoiceResult[0]!.id, description: "Tour package", quantity: 1, unitAmount: input.subtotal.toFixed(2), taxRate: input.subtotal ? ((input.tax / input.subtotal) * 100).toFixed(2) : "0.00", lineTotal: (input.subtotal + input.tax).toFixed(2) }, ...(input.discount > 0 ? [{ invoiceId: invoiceResult[0]!.id, description: "Campaign credit", quantity: 1, unitAmount: (-input.discount).toFixed(2), taxRate: "0.00", lineTotal: (-input.discount).toFixed(2) }] : [])]);
    const normalizedPhone = input.phone.replace(/\D/g, "");
    const accessSecret = `${input.bookingCode}:${normalizedPhone}:${Date.now()}`;
    await tx.insert(bookingAccessGrants).values({ bookingId, tokenHash: createHash("sha256").update(accessSecret).digest("hex"), verifiedContactHash: createHash("sha256").update(normalizedPhone.slice(-4)).digest("hex"), accessScope: ["booking", "documents", "invoice", "trip_updates"], expiresAt: new Date(Date.now() + 20 * 60_000), createdByUserId: input.userId });
    return { persisted: true as const, bookingId, invoiceId: invoiceResult[0]!.id };
  });
}

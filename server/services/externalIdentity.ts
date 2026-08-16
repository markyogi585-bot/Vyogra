import { and, eq } from "drizzle-orm";
import { externalIdentities } from "../../drizzle/schema";
import type { VerifiedExternalIdentity } from "../../shared/externalIdentity";
import { getDb } from "../db";

/** Only call this after the provider's server-side verifier has authenticated the token/claim. */
export async function upsertVerifiedExternalIdentity(input: VerifiedExternalIdentity) {
  const db = await getDb();
  if (!db) return { persisted: false as const };
  const existing = await db.select({ id: externalIdentities.id }).from(externalIdentities).where(and(eq(externalIdentities.provider, input.provider), eq(externalIdentities.providerSubject, input.providerSubject))).limit(1);
  if (existing[0]) {
    await db.update(externalIdentities).set({ userId: input.userId, provider: input.provider, email: input.email ?? null, phone: input.phone ?? null, claims: input.claims, verifiedAt: new Date() }).where(eq(externalIdentities.id, existing[0].id));
    return { persisted: true as const, id: existing[0].id, created: false as const };
  }
  const inserted = await db.insert(externalIdentities).values({ userId: input.userId, provider: input.provider, providerSubject: input.providerSubject, email: input.email ?? null, phone: input.phone ?? null, claims: input.claims, verifiedAt: new Date() }).$returningId();
  return { persisted: true as const, id: inserted[0]!.id, created: true as const };
}

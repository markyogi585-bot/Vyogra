import { eq } from "drizzle-orm";
import { externalIdentities } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { upsertVerifiedExternalIdentity } from "../services/externalIdentity";

export const identityRouter = router({
  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select({ id: externalIdentities.id, provider: externalIdentities.provider, email: externalIdentities.email, phone: externalIdentities.phone, verifiedAt: externalIdentities.verifiedAt }).from(externalIdentities).where(eq(externalIdentities.userId, ctx.user.id));
  }),
  upsertCurrentTrustedSession: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await upsertVerifiedExternalIdentity({ userId: ctx.user.id, provider: "manus_oauth", providerSubject: ctx.user.openId, email: ctx.user.email ?? undefined, phone: ctx.user.phone ?? undefined, claims: { source: "trusted_session" } });
    return result;
  }),
});

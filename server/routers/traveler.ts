import { eq } from "drizzle-orm";
import { localeSchema } from "../../shared/packageBlueprint";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const travelerRouter = router({
  preferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { locale: "en-IN" as const };
    const [traveler] = await db.select({ locale: users.preferredLocale }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    return { locale: traveler?.locale === "hi-IN" ? "hi-IN" as const : "en-IN" as const };
  }),
  setLocale: protectedProcedure.input(localeSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    await db.update(users).set({ preferredLocale: input }).where(eq(users.id, ctx.user.id));
    return { locale: input };
  }),
});

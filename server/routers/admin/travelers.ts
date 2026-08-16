import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "../../../drizzle/schema";
import { recordAudit } from "../../audit/service";
import { getDb } from "../../db";
import { assertPermission } from "../../security/roles";
import { protectedProcedure, router } from "../../_core/trpc";

export const adminTravelersRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => { assertPermission(ctx.user.role, "traveler:manage"); const db = await getDb(); if (!db) return []; return db.select().from(users).orderBy(desc(users.createdAt)).limit(100); }),
  setModerationState: protectedProcedure.input(z.object({ userId: z.number().int().positive(), action: z.enum(["warn", "suspend", "ban", "restore"]), days: z.number().int().min(1).max(365).optional(), reason: z.string().trim().min(3).max(500) })).mutation(async ({ ctx, input }) => { assertPermission(ctx.user.role, "traveler:manage"); const db = await getDb(); if (!db) throw new Error("Database unavailable"); const changes = input.action === "suspend" ? { isSuspended: true, suspendedUntil: new Date(Date.now() + (input.days ?? 7) * 86400000) } : input.action === "ban" ? { isBanned: true, isSuspended: false, suspendedUntil: null } : input.action === "restore" ? { isBanned: false, isSuspended: false, suspendedUntil: null } : {}; if (input.action !== "warn") await db.update(users).set(changes).where(eq(users.id, input.userId)); await recordAudit(ctx.user.id, { eventType: `traveler.${input.action}`, entityType: "user", entityId: String(input.userId), metadata: { reason: input.reason, days: input.days } }); return { success: true }; }),
});

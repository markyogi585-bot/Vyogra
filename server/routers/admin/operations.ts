import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auditEvents, broadcasts, budgetLines } from "../../../drizzle/schema";
import { recordAudit } from "../../audit/service";
import { getDb } from "../../db";
import { assertPermission } from "../../security/roles";
import { getIntegrationStatus } from "../../config/integrationStatus";
import { protectedProcedure, router } from "../../_core/trpc";

export const adminOperationsRouter = router({
  createBroadcast: protectedProcedure.input(z.object({ title: z.string().trim().min(3).max(180), body: z.string().trim().min(5).max(1000), audience: z.string().trim().min(2).max(80), deepLink: z.string().max(255).optional(), scheduledAt: z.date().optional() })).mutation(async ({ ctx, input }) => { assertPermission(ctx.user.role, "broadcast:manage"); const db = await getDb(); if (!db) throw new Error("Database unavailable"); const [result] = await db.insert(broadcasts).values({ ...input, status: input.scheduledAt ? "scheduled" : "draft", createdByUserId: ctx.user.id }).$returningId(); await recordAudit(ctx.user.id, { eventType: "broadcast.created", entityType: "broadcast", entityId: String(result.id), metadata: { audience: input.audience } }); return { id: result.id }; }),
  addBudgetLine: protectedProcedure.input(z.object({ packageId: z.number().int().positive(), name: z.string().trim().min(2).max(120), category: z.string().trim().min(2).max(64), costPerTraveler: z.number().min(0), notes: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => { assertPermission(ctx.user.role, "budget:manage"); const db = await getDb(); if (!db) throw new Error("Database unavailable"); const [result] = await db.insert(budgetLines).values({ ...input, costPerTraveler: String(input.costPerTraveler), createdByUserId: ctx.user.id }).$returningId(); await recordAudit(ctx.user.id, { eventType: "budget.line_created", entityType: "budget_line", entityId: String(result.id), metadata: { packageId: input.packageId } }); return { id: result.id }; }),
  audit: protectedProcedure.query(async ({ ctx }) => { assertPermission(ctx.user.role, "audit:read"); const db = await getDb(); if (!db) return []; return db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(200); }),
  integrationStatus: protectedProcedure.query(({ ctx }) => { assertPermission(ctx.user.role, "system:manage"); return getIntegrationStatus(); }),
});

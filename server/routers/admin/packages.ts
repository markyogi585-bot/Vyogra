import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { packageDays, packageDraftRevisions, packageMedia, packageTerms, packageTranslations, packages } from "../../../drizzle/schema";
import { packageBlueprintSchema } from "../../../shared/packageBlueprint";
import { recordAudit } from "../../audit/service";
import { getDb } from "../../db";
import { assertPermission } from "../../security/roles";
import { protectedProcedure, router } from "../../_core/trpc";

export const adminPackagesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => { assertPermission(ctx.user.role, "package:write"); const db = await getDb(); if (!db) return []; return db.select().from(packages).orderBy(desc(packages.updatedAt)); }),
  create: protectedProcedure.input(z.object({ slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(160), name: z.string().trim().min(3).max(220), summary: z.string().trim().min(20).max(5000), destination: z.string().trim().min(2).max(220), category: z.string().trim().min(2).max(64), durationDays: z.number().int().min(1).max(60), durationNights: z.number().int().min(0).max(59), basePrice: z.number().positive() })).mutation(async ({ ctx, input }) => { assertPermission(ctx.user.role, "package:write"); const db = await getDb(); if (!db) throw new Error("Database unavailable"); const [result] = await db.insert(packages).values({ ...input, basePrice: String(input.basePrice), createdByUserId: ctx.user.id, groupMin: 1, groupMax: 12, status: "draft" }).$returningId(); await recordAudit(ctx.user.id, { eventType: "package.created", entityType: "package", entityId: String(result.id), metadata: { slug: input.slug } }); return { id: result.id }; }),
  saveBlueprint: protectedProcedure.input(packageBlueprintSchema).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "package:write");
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const result = await db.transaction(async (tx) => {
      const packageValues = { slug: input.slug, name: input.name, summary: input.summary, destination: input.destination, category: input.category, durationDays: input.durationDays, durationNights: input.durationNights, groupMin: input.groupMin, groupMax: input.groupMax, basePrice: input.basePrice.toFixed(2), coverImageUrl: input.coverImageUrl ?? null, tags: input.tags, inclusions: input.inclusions, exclusions: input.exclusions, status: input.status, publishedAt: input.status === "published" ? new Date() : null };
      let packageId = input.packageId;
      if (packageId) {
        await tx.update(packages).set(packageValues).where(eq(packages.id, packageId));
        await tx.delete(packageDays).where(eq(packageDays.packageId, packageId));
        await tx.delete(packageMedia).where(eq(packageMedia.packageId, packageId));
        await tx.delete(packageTranslations).where(eq(packageTranslations.packageId, packageId));
      } else {
        const inserted = await tx.insert(packages).values({ ...packageValues, createdByUserId: ctx.user.id }).$returningId();
        packageId = inserted[0]!.id;
      }
      await tx.insert(packageDays).values(input.itinerary.map((day, index) => ({ packageId: packageId!, dayNumber: index + 1, title: day.title, description: day.description ?? null, location: day.location ?? null, latitude: day.latitude?.toFixed(7), longitude: day.longitude?.toFixed(7), activities: day.activities })));
      if (input.media.length) await tx.insert(packageMedia).values(input.media.map((media) => ({ packageId: packageId!, storageKey: media.storageKey, url: media.url, alt: media.alt ?? null, sortOrder: media.sortOrder })));
      await tx.update(packageTerms).set({ isActive: false }).where(eq(packageTerms.packageId, packageId!));
      await tx.insert(packageTerms).values({ packageId: packageId!, revision: input.terms.revision, title: input.terms.title, body: input.terms.body, isActive: true, createdByUserId: ctx.user.id }).onDuplicateKeyUpdate({ set: { title: input.terms.title, body: input.terms.body, isActive: true, createdByUserId: ctx.user.id } });
      if (input.translations.length) await tx.insert(packageTranslations).values(input.translations.map((translation) => ({ packageId: packageId!, locale: translation.locale, name: translation.name, summary: translation.summary, destination: translation.destination, inclusions: translation.inclusions, exclusions: translation.exclusions, updatedByUserId: ctx.user.id })));
      const prior = await tx.select({ revision: packageDraftRevisions.revision }).from(packageDraftRevisions).where(eq(packageDraftRevisions.packageId, packageId!)).orderBy(desc(packageDraftRevisions.revision)).limit(1);
      const revision = (prior[0]?.revision ?? 0) + 1;
      await tx.insert(packageDraftRevisions).values({ packageId: packageId!, revision, payload: { ...input, packageId }, createdByUserId: ctx.user.id });
      return { packageId: packageId!, revision };
    });
    await recordAudit(ctx.user.id, { eventType: "package.blueprint_saved", entityType: "package", entityId: String(result.packageId), metadata: { revision: result.revision, status: input.status, translations: input.translations.map((translation) => translation.locale) } });
    return { persisted: true as const, ...result };
  }),
  setStatus: protectedProcedure.input(z.object({ packageId: z.number().int().positive(), status: z.enum(["draft", "published", "paused", "archived"]) })).mutation(async ({ ctx, input }) => { assertPermission(ctx.user.role, "package:write"); const db = await getDb(); if (!db) throw new Error("Database unavailable"); await db.update(packages).set({ status: input.status, publishedAt: input.status === "published" ? new Date() : null }).where(eq(packages.id, input.packageId)); await recordAudit(ctx.user.id, { eventType: `package.${input.status}`, entityType: "package", entityId: String(input.packageId) }); return { success: true }; }),
});

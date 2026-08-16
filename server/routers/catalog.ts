import { and, asc, eq, like } from "drizzle-orm";
import { z } from "zod";
import { packages } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";

export const catalogRouter = router({
  list: publicProcedure.input(z.object({ query: z.string().trim().max(120).optional(), category: z.string().max(64).optional(), limit: z.number().int().min(1).max(48).default(12) })).query(async ({ input }) => { const db = await getDb(); if (!db) return []; const where = input.category ? and(eq(packages.status, "published"), eq(packages.category, input.category)) : eq(packages.status, "published"); const rows = await db.select().from(packages).where(where).orderBy(asc(packages.name)).limit(input.limit); if (!input.query) return rows; const term = `%${input.query}%`; return rows.filter((row) => [row.name, row.destination, row.category].some((value) => value.toLowerCase().includes(input.query!.toLowerCase()))).filter(() => term.length > 2); }),
  bySlug: publicProcedure.input(z.object({ slug: z.string().min(1).max(160) })).query(async ({ input }) => { const db = await getDb(); if (!db) return null; const rows = await db.select().from(packages).where(and(eq(packages.slug, input.slug), eq(packages.status, "published"))).limit(1); return rows[0] ?? null; }),
});

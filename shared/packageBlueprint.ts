import { z } from "zod";

export const supportedLocales = ["en-IN", "hi-IN"] as const;
export const localeSchema = z.enum(supportedLocales);

export const packageBlueprintSchema = z.object({
  packageId: z.number().int().positive().optional(),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(160),
  name: z.string().trim().min(3).max(220),
  summary: z.string().trim().min(20).max(5000),
  destination: z.string().trim().min(2).max(220),
  category: z.string().trim().min(2).max(64),
  durationDays: z.number().int().min(1).max(60),
  durationNights: z.number().int().min(0).max(59),
  basePrice: z.number().positive(),
  groupMin: z.number().int().min(1).max(99).default(1),
  groupMax: z.number().int().min(1).max(99).default(12),
  coverImageUrl: z.string().url().optional(),
  tags: z.array(z.string().trim().min(1).max(48)).max(12).default([]),
  inclusions: z.array(z.string().trim().min(1).max(240)).max(30).default([]),
  exclusions: z.array(z.string().trim().min(1).max(240)).max(30).default([]),
  status: z.enum(["draft", "published", "paused", "archived"]).default("draft"),
  itinerary: z.array(z.object({ title: z.string().trim().min(3).max(220), description: z.string().trim().max(3000).optional(), location: z.string().trim().max(220).optional(), latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional(), activities: z.array(z.string().trim().min(1).max(140)).max(20).default([]) })).min(1).max(60),
  media: z.array(z.object({ storageKey: z.string().trim().min(3).max(512), url: z.string().min(1).max(2048), alt: z.string().trim().max(220).optional(), sortOrder: z.number().int().min(0).max(1000).default(0) })).max(30).default([]),
  terms: z.object({ revision: z.string().trim().min(1).max(32), title: z.string().trim().min(3).max(220), body: z.string().trim().min(20).max(10000) }),
  translations: z.array(z.object({ locale: localeSchema, name: z.string().trim().min(3).max(220), summary: z.string().trim().min(20).max(5000), destination: z.string().trim().min(2).max(220), inclusions: z.array(z.string().trim().min(1).max(240)).max(30).default([]), exclusions: z.array(z.string().trim().min(1).max(240)).max(30).default([]) })).max(2).default([]),
}).refine((value) => value.groupMax >= value.groupMin, { message: "Maximum group size must be at least the minimum group size.", path: ["groupMax"] });

export type PackageBlueprint = z.infer<typeof packageBlueprintSchema>;

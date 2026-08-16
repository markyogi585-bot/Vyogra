import { z } from "zod";

export const tripLocationCheckinSchema = z.object({
  bookingId: z.number().int().positive(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().int().positive().max(100000).optional(),
  label: z.string().trim().min(2).max(220).optional(),
  note: z.string().trim().max(1000).optional(),
  visibility: z.enum(["booking", "departure", "all_active"]).default("booking"),
  source: z.enum(["host_manual", "device", "operations"]).default("host_manual"),
});

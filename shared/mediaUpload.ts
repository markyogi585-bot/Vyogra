import { z } from "zod";

export const supportedMediaMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export const mediaUploadSchema = z.object({
  folder: z.enum(["packages", "users", "tickets", "announcements", "trip_updates"]),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(supportedMediaMimeTypes),
  base64: z.string().min(4),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
}).superRefine((value, ctx) => {
  const byteLength = Buffer.byteLength(value.base64.replace(/^data:[^;]+;base64,/, ""), "base64");
  if (byteLength > 10 * 1024 * 1024) ctx.addIssue({ code: "custom", message: "Choose a file under 10 MB.", path: ["base64"] });
});

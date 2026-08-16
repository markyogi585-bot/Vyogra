import path from "node:path";
import { mediaAssets } from "../../drizzle/schema";
import { mediaUploadSchema } from "../../shared/mediaUpload";
import { recordAudit } from "../audit/service";
import { getDb } from "../db";
import { assertPermission } from "../security/roles";
import { storagePut } from "../storage";
import { protectedProcedure, router } from "../_core/trpc";

export const mediaRouter = router({
  upload: protectedProcedure.input(mediaUploadSchema).mutation(async ({ ctx, input }) => {
    assertPermission(ctx.user.role, "package:write");
    const bytes = Buffer.from(input.base64.replace(/^data:[^;]+;base64,/, ""), "base64");
    const safeName = path.basename(input.fileName).replace(/[^a-zA-Z0-9._-]/g, "-") || "asset";
    const { key, url } = await storagePut(`${input.folder}/${ctx.user.id}/${safeName}`, bytes, input.mimeType);
    const db = await getDb();
    if (!db) throw new Error("Database unavailable after media upload");
    const inserted = await db.insert(mediaAssets).values({ storageKey: key, url, originalFileName: input.fileName, mimeType: input.mimeType, byteSize: bytes.byteLength, folder: input.folder, tags: input.tags, uploadedByUserId: ctx.user.id }).$returningId();
    await recordAudit(ctx.user.id, { eventType: "media.uploaded", entityType: "media_asset", entityId: String(inserted[0]!.id), metadata: { folder: input.folder, mimeType: input.mimeType, byteSize: bytes.byteLength } });
    return { id: inserted[0]!.id, storageKey: key, url, fileName: input.fileName, mimeType: input.mimeType };
  }),
});

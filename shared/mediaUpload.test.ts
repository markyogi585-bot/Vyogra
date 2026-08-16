import { describe, expect, it } from "vitest";
import { mediaUploadSchema } from "./mediaUpload";

describe("secure media upload contract", () => {
  it("accepts managed-storage image metadata without storing a database blob", () => {
    const parsed = mediaUploadSchema.parse({ folder: "packages", fileName: "goa-cover.webp", mimeType: "image/webp", base64: Buffer.from("photo").toString("base64") });
    expect(parsed.folder).toBe("packages");
  });

  it("rejects unsupported file types", () => {
    expect(() => mediaUploadSchema.parse({ folder: "packages", fileName: "script.exe", mimeType: "application/x-msdownload", base64: "c2FmZQ==" })).toThrow();
  });
});

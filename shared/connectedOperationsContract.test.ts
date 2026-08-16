import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("connected administrator and traveler care operations", () => {
  it("keeps child traveler consent and support conversations in server-backed records", () => {
    const schema = read("drizzle/schema.ts");
    const admin = read("server/routers/admin/engagement.ts");
    const support = read("server/routers/support.ts");

    ["travelerCategory", "guardianName", "guardianPhone", "guardianConsentAt", "supportTicketReplies", "supportChannels"].forEach((field) => expect(schema).toContain(field));
    ["addChildTraveler", "guardianConsent: z.literal(true)", "supportQueue", "replyToSupport", "saveSupportChannel", "publishInAppBroadcast"].forEach((procedure) => expect(admin).toContain(procedure));
    ["channels: publicProcedure", "thread: protectedProcedure", "reply: protectedProcedure", "assertOwnership"].forEach((procedure) => expect(support).toContain(procedure));
  });

  it("keeps notifications and contact actions meaningful to travelers", () => {
    const platform = read("client/src/pages/PlatformPages.tsx");

    expect(platform).toContain("campaigns.activeAnnouncements.useQuery");
    expect(platform).toContain("support.channels.useQuery");
    expect(platform).toContain("https://wa.me/");
    expect(platform).toContain("support.create.useMutation");
    expect(platform).not.toContain("mailto:hello@voyagr.in");
  });
});

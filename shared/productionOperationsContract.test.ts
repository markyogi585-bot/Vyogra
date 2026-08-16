import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("production operations ecosystem", () => {
  it("keeps booking lifecycle actions role-bound and booking scoped", () => {
    const router = source("server/routers/bookingLifecycle.ts");
    expect(router).toContain("assertPermission(ctx.user.role, \"booking:manage\")");
    expect(router).toContain("requestCancellation");
    expect(router).toContain("reviewRefund");
    expect(router).toContain("bookingTripSchedules");
  });

  it("creates revocable privacy-safe share surfaces", () => {
    const router = source("server/routers/tripShare.ts");
    const page = source("client/src/pages/TripSharePage.tsx");
    expect(router).toContain("tokenHash");
    expect(router).toContain("revokedAt");
    expect(router).toContain("expiresAt");
    expect(page).toContain("No traveler contact, invoice, or live-location data");
    expect(page).toContain("og:image");
  });

  it("publishes only public crawler surfaces", () => {
    const robots = source("client/public/robots.txt");
    const sitemap = source("client/public/sitemap.xml");
    const index = source("client/index.html");
    expect(robots).toContain("Disallow: /admin/");
    expect(robots).toContain("Disallow: /invoice/");
    expect(robots).toContain("Sitemap:");
    expect(sitemap).toContain("/explore");
    expect(index).toContain('rel="canonical"');
    expect(index).toContain('application/ld+json');
  });

  it("keeps push delivery provider-safe with an in-app fallback", () => {
    const router = source("server/routers/notifications.ts");
    expect(router).toContain("registerDevice");
    expect(router).toContain("channel: \"in_app\"");
    expect(router).toContain("inAppDelivered");
    expect(router).toContain("FIREBASE_SERVICE_ACCOUNT_JSON");
  });
});

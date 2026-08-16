import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const project = process.cwd();
const read = (path: string) => readFileSync(resolve(project, path), "utf8");
const app = read("client/src/App.tsx");
const platformPages = read("client/src/pages/PlatformPages.tsx");
const nativeStyles = read("client/src/styles/native-2026.css");

describe("native traveler route audit", () => {
  it("registers every retained traveler journey as a real application route", () => {
    [
      "/",
      "/app",
      "/explore",
      "/package/:id",
      "/access",
      "/access/:bookingCode",
      "/checkout",
      "/invoice/:bookingCode",
      "/account",
      "/trips",
      "/trips/live",
      "/trip/:bookingCode",
      "/wishlist",
      "/review",
      "/notifications",
      "/support",
    ].forEach((route) => expect(app).toContain(`path={"${route}"}`));
  });

  it("keeps shared explorer, detail, and history pages inside native traveler shells", () => {
    expect(platformPages).toContain("<VoyagrShell title=\"EXPLORE\"");
    expect(platformPages).toContain("<VoyagrShell title=\"ROUTE DETAIL\"");
    expect(platformPages).toContain("trpc.bookings.mine.useQuery");
    expect(platformPages).toContain("booking-sheet");
    expect(platformPages).toContain("openAuth(\"booking\")");
  });

  it("defines native treatment for the named traveler route families", () => {
    [
      ".native-desk",
      ".explore-results",
      ".package-detail-page",
      ".booking-access-layout",
      ".checkout-layout",
      ".booking-portal-hero",
      ".trip-dashboard",
      ".trip-card",
      ".wishlist-card",
      ".review-composer-card",
      ".notification-list",
      ".support-actions",
      ".live-trip-hero",
    ].forEach((selector) => expect(nativeStyles).toContain(selector));
  });
});

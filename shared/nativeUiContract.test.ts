import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { connectedTravelerRoutes, isConnectedTravelerRoute } from "./navigationContract";

const project = process.cwd();
const appSource = readFileSync(resolve(project, "client/src/App.tsx"), "utf8");
const nativeStyles = readFileSync(resolve(project, "client/src/styles/native-2026.css"), "utf8");

describe("2026 native app UI contract", () => {
  it("registers the shared native system once at the route boundary", () => {
    expect(appSource).toContain('import "./styles/native-2026.css"');
    expect(appSource).toContain('<GlobalTravelSheets />');
    expect(appSource).toContain('path={"/app"}');
  });

  it("keeps every primary traveler destination connected", () => {
    expect(connectedTravelerRoutes).toEqual(expect.arrayContaining([
      "/explore",
      "/access",
      "/checkout",
      "/trips",
      "/trips/live",
      "/wallet",
      "/wishlist",
      "/account",
      "/support",
      "/notifications",
    ]));
    connectedTravelerRoutes.forEach((route) => expect(isConnectedTravelerRoute(route)).toBe(true));
  });

  it("defines native treatment for traveler and administrator workspaces", () => {
    [
      "--native-violet: #6f61ff",
      ".inner-bottom-nav",
      ".package-detail-page",
      ".booking-access-layout",
      ".wallet-methods",
      ".review-composer-card",
      ".admin-page-frame",
      ".manual-booking-layout",
      "prefers-reduced-motion",
    ].forEach((selector) => expect(nativeStyles).toContain(selector));
  });
});

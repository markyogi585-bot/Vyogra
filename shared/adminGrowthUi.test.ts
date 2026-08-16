import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/pages/AdminGrowthPage.tsx", import.meta.url), "utf8");

describe("admin growth connected Explore actions", () => {
  it("reuses the shared Explore action primitive instead of disconnected metric widgets", () => {
    expect(source).toContain("ExploreActionGrid");
    expect(source).not.toContain("growth-metric-row");
  });

  it("links growth work to concrete administration routes", () => {
    ["/admin/packages", "/admin/bookings/manual", "/admin/trips/live", "/admin/tools"].forEach((path) => expect(source).toContain(path));
  });
});

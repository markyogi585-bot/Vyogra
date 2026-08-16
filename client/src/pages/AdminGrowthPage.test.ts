import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./AdminGrowthPage.tsx", import.meta.url), "utf8");

describe("AdminGrowthPage connected Explore actions", () => {
  it("reuses the shared Explore action primitive rather than rendering disconnected metric widgets", () => {
    expect(source).toContain("ExploreActionGrid");
    expect(source).not.toContain("growth-metric-row");
  });

  it("links growth operations to concrete administration workspaces", () => {
    ["/admin/packages", "/admin/bookings/manual", "/admin/trips/live", "/admin/tools"].forEach((path) => expect(source).toContain(path));
  });
});

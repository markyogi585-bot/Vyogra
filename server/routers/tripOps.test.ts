import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./tripOps.ts", import.meta.url), "utf8");

describe("trip location procedure safeguards", () => {
  it("guards host check-in publishing through the booking-management permission", () => {
    const publishStart = source.indexOf("publishCheckin");
    const publishEnd = source.indexOf("latestCheckin");
    expect(source.slice(publishStart, publishEnd)).toContain('assertPermission(ctx.user.role, "booking:manage")');
    expect(source.slice(publishStart, publishEnd)).toContain("tripLocationCheckins");
  });

  it("checks booking ownership for a traveler live-location read while allowing operators", () => {
    const latest = source.slice(source.indexOf("latestCheckin"));
    expect(latest).toContain("isOperator(ctx.user.role)");
    expect(latest).toContain("assertOwnership(ctx.user.id, booking.userId)");
  });
});

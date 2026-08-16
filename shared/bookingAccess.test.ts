import { describe, expect, it } from "vitest";
import { accessExpiresAt, isValidBookingAccessInput, normalizeBookingCode, normalizeContactSuffix } from "./bookingAccess";

describe("booking access policy", () => {
  it("normalizes issued booking codes and contact suffixes", () => {
    expect(normalizeBookingCode(" vyg-2026-08456 ")).toBe("VYG-2026-08456");
    expect(normalizeContactSuffix("+91 99714 06264")).toBe("6264");
  });

  it("requires a correctly shaped code and exactly four verified digits", () => {
    expect(isValidBookingAccessInput({ bookingCode: "VYG-2026-08456", contactSuffix: "6264" })).toBe(true);
    expect(isValidBookingAccessInput({ bookingCode: "VYG-2026-8456", contactSuffix: "6264" })).toBe(false);
    expect(isValidBookingAccessInput({ bookingCode: "VYG-2026-08456", contactSuffix: "264" })).toBe(false);
  });

  it("expires a direct booking access grant after the policy window", () => {
    const startsAt = new Date("2026-08-14T00:00:00.000Z");
    expect(accessExpiresAt(startsAt).toISOString()).toBe("2026-08-14T00:20:00.000Z");
  });
});

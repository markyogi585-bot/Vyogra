import { describe, expect, it } from "vitest";
import { localeSchema } from "./packageBlueprint";
import { tripLocationCheckinSchema } from "./tripLocation";

describe("traveler preference and trip location contracts", () => {
  it("accepts only the supported English and Hindi locales", () => {
    expect(localeSchema.parse("en-IN")).toBe("en-IN");
    expect(localeSchema.parse("hi-IN")).toBe("hi-IN");
    expect(() => localeSchema.parse("en-US")).toThrow();
  });

  it("keeps trip check-ins inside valid geographic bounds", () => {
    expect(tripLocationCheckinSchema.parse({ bookingId: 24, latitude: 15.0106, longitude: 74.0236 })).toMatchObject({ source: "host_manual", visibility: "booking" });
    expect(() => tripLocationCheckinSchema.parse({ bookingId: 24, latitude: 122, longitude: 74 })).toThrow();
  });
});

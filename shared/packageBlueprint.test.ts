import { describe, expect, it } from "vitest";
import { packageBlueprintSchema } from "./packageBlueprint";

const validBlueprint = { slug: "goa-slow-route", name: "Goa, at your own pace", summary: "A small-group South Goa journey with careful stays, local hosts, and room for the road to unfold.", destination: "South Goa", category: "Beaches", durationDays: 5, durationNights: 4, basePrice: 12490, itinerary: [{ title: "Arrive in Palolem" }], terms: { revision: "2026-09", title: "Goa route terms", body: "Cancellation, rooming, conduct, and insurance terms are accepted before payment is captured." } };

describe("package blueprint contract", () => {
  it("accepts a persistable package draft with an itinerary and terms revision", () => {
    const parsed = packageBlueprintSchema.parse(validBlueprint);
    expect(parsed.status).toBe("draft");
    expect(parsed.itinerary).toHaveLength(1);
  });

  it("rejects an invalid traveler-size range and unsupported translation locale", () => {
    expect(() => packageBlueprintSchema.parse({ ...validBlueprint, groupMin: 8, groupMax: 2 })).toThrow();
    expect(() => packageBlueprintSchema.parse({ ...validBlueprint, translations: [{ locale: "fr-FR", name: "Goa", summary: validBlueprint.summary, destination: "Goa" }] })).toThrow();
  });
});

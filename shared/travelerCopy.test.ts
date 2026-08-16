import { describe, expect, it } from "vitest";
import { travelerCopy } from "../client/src/lib/travelerCopy";

describe("traveler page locale copy", () => {
  it("keeps complete English core-page copy available", () => {
    const copy = travelerCopy("en-IN");
    expect(copy.explore.lineOne).toBe("Find your next");
    expect(copy.trips.body).toContain("protected traveler record");
    expect(copy.support.kicker).toBe("WE’RE HERE / 10");
  });

  it("switches core traveler headings and supporting copy to Hindi", () => {
    const copy = travelerCopy("hi-IN");
    expect(copy.explore.lineTwo).toBe("यात्रा खोजें।");
    expect(copy.wishlist.body).toContain("रूट सेव करें");
    expect(copy.notifications.kicker).toBe("आपका इनबॉक्स / 09");
  });
});

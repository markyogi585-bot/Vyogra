import { describe, expect, it } from "vitest";
import { verifiedExternalIdentitySchema } from "./externalIdentity";

describe("external identity mapping contract", () => {
  it("accepts only verified provider mapping shapes", () => {
    expect(verifiedExternalIdentitySchema.parse({ userId: 4, provider: "firebase_google", providerSubject: "firebase-uid-4", email: "traveler@example.com" }).provider).toBe("firebase_google");
  });

  it("rejects unknown providers and empty subjects", () => {
    expect(() => verifiedExternalIdentitySchema.parse({ userId: 4, provider: "unknown", providerSubject: "x" })).toThrow();
  });

  it("keeps the supported trusted-session provider in the typed identity vocabulary", () => {
    expect(verifiedExternalIdentitySchema.parse({ userId: 4, provider: "manus_oauth", providerSubject: "manus-open-id" }).provider).toBe("manus_oauth");
  });
});

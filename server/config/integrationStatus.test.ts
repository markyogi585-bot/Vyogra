import { describe, expect, it } from "vitest";
import { getIntegrationStatus } from "./integrationStatus";

describe("integration status contract", () => {
  it("reports only safe configuration state and keeps managed storage/maps usable without provider credentials", () => {
    const states = getIntegrationStatus({});
    expect(states.find((state) => state.key === "managed_storage")?.configured).toBe(true);
    expect(states.find((state) => state.key === "maps")?.configured).toBe(true);
    expect(states.find((state) => state.key === "firebase")?.configured).toBe(false);
    expect(JSON.stringify(states)).not.toContain("PRIVATE_KEY");
  });

  it("requires the complete client and server Firebase boundary before calling auth configured", () => {
    const partial = getIntegrationStatus({ VITE_FIREBASE_API_KEY: "key", VITE_FIREBASE_PROJECT_ID: "voyagr" });
    const complete = getIntegrationStatus({ VITE_FIREBASE_API_KEY: "key", VITE_FIREBASE_AUTH_DOMAIN: "voyagr.firebaseapp.com", VITE_FIREBASE_PROJECT_ID: "voyagr", VITE_FIREBASE_APP_ID: "app", FIREBASE_CLIENT_EMAIL: "service@voyagr.iam.gserviceaccount.com", FIREBASE_PRIVATE_KEY: "private" });
    expect(partial.find((state) => state.key === "firebase")?.configured).toBe(false);
    expect(complete.find((state) => state.key === "firebase")?.configured).toBe(true);
  });

  it("keeps external provider activation off when no user credential was supplied", () => {
    const states = getIntegrationStatus({});
    expect(states.find((state) => state.key === "firebase")?.configured).toBe(false);
    expect(states.find((state) => state.key === "supabase")?.configured).toBe(false);
  });
});

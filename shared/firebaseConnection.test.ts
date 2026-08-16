import { describe, expect, it } from "vitest";
import { firebaseWebConfig } from "../client/src/lib/firebase";

describe("Firebase web configuration", () => {
  it("reaches the Identity Toolkit endpoint with the supplied tour-b631c web key without mutating user data", async () => {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseWebConfig.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const body = await response.json() as { error?: { message?: string } };

    expect(response.status).toBe(400);
    expect(body.error?.message).toBe("MISSING_EMAIL");
  }, 20_000);
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Firebase traveler and operations integration", () => {
  it("uses official Firebase SDK methods for Google, email/password, and phone verification", () => {
    const authSheet = read("client/src/components/sheets/AuthSheet.tsx");

    ["signInWithPopup", "GoogleAuthProvider", "signInWithPhoneNumber", "RecaptchaVerifier", "createUserWithEmailAndPassword", "signInWithEmailAndPassword"].forEach((symbol) => {
      expect(authSheet).toContain(symbol);
    });
    expect(authSheet).not.toContain("Use any four digits for the prototype");
  });

  it("hydrates the client session and protected tRPC traffic from verified Firebase identity", () => {
    const session = read("client/src/contexts/TravelSessionContext.tsx");
    const client = read("client/src/main.tsx");
    const context = read("server/_core/context.ts");
    const verifier = read("server/security/firebaseToken.ts");

    expect(session).toContain("onAuthStateChanged");
    expect(session).toContain("upsertFirebaseTravelerProfile");
    expect(client).toContain("firebaseAuth.currentUser.getIdToken()");
    expect(context).toContain("verifyFirebaseIdToken");
    expect(context).toContain("ensureFirebaseUser");
    expect(verifier).toContain("jwtVerify");
    expect(verifier).toContain("https://securetoken.google.com/${projectId}");
    expect(verifier).toContain("claimedRole");
    expect(read("client/src/lib/firebaseProfile.ts")).toContain("!existing.exists() ? { createdAt: serverTimestamp() } : {}");
  });

  it("allows only owner-scoped traveler profiles and support tickets in Firestore while keeping booking, invoice, and admin records server-only", () => {
    const rules = read("firestore.rules");

    expect(rules).toContain("match /travelerProfiles/{uid}");
    expect(rules).toContain("allow create: if owns(uid) && safeProfile()");
    expect(rules).toContain("request.resource.data.createdAt == resource.data.createdAt");
    expect(rules).toContain("request.resource.data.role == resource.data.role");
    expect(rules).toContain("match /supportTickets/{ticketId}");
    expect(rules).toContain("allow create: if signedIn() && safeSupportTicket()");
    ["match /bookings/{document=**} { allow read, write: if false; }", "match /invoices/{document=**} { allow read, write: if false; }", "match /admin/{document=**} { allow read, write: if false; }"]
      .forEach((boundary) => expect(rules).toContain(boundary));
  });
});

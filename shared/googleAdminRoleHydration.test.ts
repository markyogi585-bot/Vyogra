import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("Google login and admin role hydration", () => {
  it("completes mobile Google redirect sign-in and preserves popup fallback", () => {
    const authSheet = source("client/src/components/sheets/AuthSheet.tsx");
    expect(authSheet).toContain("getRedirectResult");
    expect(authSheet).toContain("signInWithRedirect");
    expect(authSheet).toContain("mobileBrowser");
    expect(authSheet).toContain("signInWithPopup");
    expect(authSheet).toContain('saveFirebaseSession(result.user, "google")');
  });

  it("replaces only provisional Firebase roles with the server-authoritative app role", () => {
    const session = source("client/src/contexts/TravelSessionContext.tsx");
    expect(session).toContain("trpc.auth.me.useQuery");
    expect(session).toContain("serverSession.data?.role");
    expect(session).toContain("role as SessionProfile");
    expect(session).toContain("localStorage.setItem(STORAGE_KEY");
  });

  it("continues to materialize Firebase identity through the database role resolver", () => {
    const context = source("server/_core/context.ts");
    const db = source("server/db.ts");
    expect(context).toContain("ensureFirebaseUser");
    expect(db).toContain("identity.role ?? existing[0].role");
  });
});

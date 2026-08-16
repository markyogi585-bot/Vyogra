import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("admin profile and session access", () => {
  it("keeps the admin workspace and settings route behind an explicit role gate", () => {
    const app = source("client/src/App.tsx");
    expect(app).toContain('path={"/admin"}');
    expect(app).toContain('path={"/admin/settings"}');
    expect(app).toContain('allowed={["admin", "super_admin"]}');
  });

  it("exposes connected identity and Firebase project status in profile settings", () => {
    const page = source("client/src/pages/AdminProfileSettingsPage.tsx");
    expect(page).toContain("useTravelSession");
    expect(page).toContain("firebaseAuth?.currentUser");
    expect(page).toContain("tour-b631c");
    expect(page).toContain("signOut");
    expect(page).toContain("/admin");
  });

  it("does not leave the admin logout control as a decorative icon", () => {
    const admin = source("client/src/pages/Admin.tsx");
    expect(admin).toContain("admin-logout-button");
    expect(admin).toContain("signOut()");
    expect(admin).toContain("/admin/settings");
  });
});

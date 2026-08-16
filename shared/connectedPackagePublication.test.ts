import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const source = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("connected administrator package publication", () => {
  it("keeps draft saving and publication as explicit server-authorized actions", () => {
    const stepper = source("client/src/components/admin/PackageStepper.tsx");
    const router = source("server/routers/admin/packages.ts");

    expect(stepper).toContain('save("draft")');
    expect(stepper).toContain('save("published")');
    expect(stepper).toContain("Publish package");
    expect(stepper).toContain("setSavedPackageId(result.packageId)");
    expect(router).toContain('assertPermission(ctx.user.role, "package:write")');
    expect(router).toContain('status: z.enum(["draft", "published", "paused", "archived"])');
  });
});

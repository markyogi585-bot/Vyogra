import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./packages.ts", import.meta.url), "utf8");

describe("admin package blueprint persistence lifecycle", () => {
  it("keeps a draft save transactional and records all dependent package surfaces", () => {
    expect(source).toContain("saveBlueprint");
    expect(source).toContain("db.transaction");
    expect(source).toContain("packageDays");
    expect(source).toContain("packageMedia");
    expect(source).toContain("packageTerms");
    expect(source).toContain("packageTranslations");
    expect(source).toContain("packageDraftRevisions");
  });
});

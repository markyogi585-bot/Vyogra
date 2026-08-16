import { describe, expect, it } from "vitest";
import { can } from "./permissions";

describe("VOYAGR permissions", () => {
  it("keeps traveler wallets private", () => { expect(can("user", "wallet:own")).toBe(true); expect(can("sub_admin", "wallet:own")).toBe(false); });
  it("limits system configuration to super admins", () => { expect(can("super_admin", "system:manage")).toBe(true); expect(can("admin", "system:manage")).toBe(false); });
  it("permits package work for tour operators", () => { expect(can("sub_admin", "package:write")).toBe(true); expect(can("user", "package:write")).toBe(false); });
});

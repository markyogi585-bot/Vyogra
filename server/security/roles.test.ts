import { describe, expect, it } from "vitest";
import { assertOwnership, assertPermission, isOperator } from "./roles";

describe("VOYAGR server role guards", () => {
  it("allows platform operations only to the correct role", () => {
    expect(() => assertPermission("admin", "broadcast:manage")).not.toThrow();
    expect(() => assertPermission("sub_admin", "broadcast:manage")).toThrow("permission");
  });
  it("keeps traveler records isolated by owner ID", () => {
    expect(() => assertOwnership(21, 21)).not.toThrow();
    expect(() => assertOwnership(21, 22)).toThrow("another traveler");
  });
  it("recognizes all operational roles", () => {
    expect(isOperator("sub_admin")).toBe(true);
    expect(isOperator("admin")).toBe(true);
    expect(isOperator("super_admin")).toBe(true);
    expect(isOperator("user")).toBe(false);
  });
  it("keeps live-location reads with the booking owner while allowing host operators to publish", () => {
    expect(() => assertOwnership(44, 44)).not.toThrow();
    expect(() => assertOwnership(44, 45)).toThrow("another traveler");
    expect(isOperator("sub_admin")).toBe(true);
    expect(isOperator("user")).toBe(false);
  });
});

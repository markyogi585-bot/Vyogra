import { describe, expect, it } from "vitest";
import { calculateBookingTotals } from "./booking";

describe("calculateBookingTotals", () => {
  it("calculates traveler pricing and uses only available wallet credit", () => {
    expect(calculateBookingTotals(12490, 2, 1200, 1000)).toEqual({ subtotal: 24980, addOnTotal: 1200, walletApplied: 1000, grandTotal: 25180 });
  });
  it("never creates a negative total from wallet credit", () => {
    expect(calculateBookingTotals(1000, 1, 0, 5000)).toEqual({ subtotal: 1000, addOnTotal: 0, walletApplied: 1000, grandTotal: 0 });
  });
});

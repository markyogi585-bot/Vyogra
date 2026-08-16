import { describe, expect, it } from "vitest";
import { calculateCouponDiscount, calculateInvoiceTotal } from "./commerceTerms";

describe("commerce totals", () => {
  it("caps a percentage coupon and honors its minimum subtotal", () => {
    expect(calculateCouponDiscount(10_000, { code: "NATIVE20", discountType: "percent", discountValue: 20, maximumDiscount: 1_200 })).toBe(1_200);
    expect(calculateCouponDiscount(3_000, { code: "NATIVE20", discountType: "percent", discountValue: 20, minimumSubtotal: 5_000 })).toBe(0);
  });

  it("returns a tax-aware invoice total that never falls below zero", () => {
    expect(calculateInvoiceTotal({ subtotal: 37_498, taxRate: 5, discount: 2_500 })).toEqual({ taxable: 37_498, tax: 1_875, discount: 2_500, total: 36_873 });
    expect(calculateInvoiceTotal({ subtotal: 100, taxRate: 0, discount: 500 }).total).toBe(0);
  });
});

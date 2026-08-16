import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({ persistManualBooking: vi.fn(), persistTravelerCheckout: vi.fn() }));
vi.mock("../audit/service", () => ({ recordAudit: vi.fn() }));

import { persistTravelerCheckout } from "../db";
import { commerceRouter } from "./commerce";

const input = { travelerName: "Aarav Mehta", phone: "+919971406264", email: "aarav@example.com", packageId: 1, travelerCount: 3, acceptedTerms: true as const, subtotal: 37498, taxRate: 5, coupon: { code: "GOA2500", discountType: "flat" as const, discountValue: 2500 } };

describe("authenticated checkout issuance", () => {
  beforeEach(() => vi.clearAllMocks());
  it("persists a confirmed traveler checkout before returning booking identifiers", async () => {
    vi.mocked(persistTravelerCheckout).mockResolvedValue({ persisted: true, bookingId: 101, invoiceId: 501 });
    const caller = commerceRouter.createCaller({ user: { id: 7, role: "user" } } as never);
    const result = await caller.checkoutIssue(input);
    expect(result.persisted).toBe(true);
    expect(result.bookingCode).toMatch(/^VYG-/);
    expect(result.invoiceNumber).toMatch(/^INV-VYG-/);
    expect(persistTravelerCheckout).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, travelerName: input.travelerName, acceptedTerms: true, discount: 2500 }));
  });

  it("refuses an issuance request that does not include accepted package terms", async () => {
    const caller = commerceRouter.createCaller({ user: { id: 7, role: "user" } } as never);
    await expect(caller.checkoutIssue({ ...input, acceptedTerms: false } as never)).rejects.toThrow();
    expect(persistTravelerCheckout).not.toHaveBeenCalled();
  });
});

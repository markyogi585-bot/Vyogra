import { describe, expect, it } from "vitest";
import { canTransitionBooking } from "./bookingStatus";

describe("booking status transitions", () => {
  it("allows the planned traveler lifecycle", () => { expect(canTransitionBooking("pending", "confirmed")).toBe(true); expect(canTransitionBooking("confirmed", "active")).toBe(true); expect(canTransitionBooking("active", "completed")).toBe(true); });
  it("prevents terminal and unsafe lifecycle jumps", () => { expect(canTransitionBooking("completed", "confirmed")).toBe(false); expect(canTransitionBooking("pending", "completed")).toBe(false); expect(canTransitionBooking("refunded", "active")).toBe(false); });
});

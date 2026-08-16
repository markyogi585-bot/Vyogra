import { describe, expect, it } from "vitest";
import { OTP_LOCKOUT_MS, OTP_TTL_MS, createOtpState, evaluateOtpAttempt } from "./otpPolicy";

describe("OTP policy", () => {
  it("creates a five-minute verification window", () => { const now = new Date("2026-08-14T00:00:00Z"); expect(createOtpState(now).expiresAt.getTime()).toBe(now.getTime() + OTP_TTL_MS); });
  it("locks a number after three failed attempts", () => { const now = new Date("2026-08-14T00:00:00Z"); let state = createOtpState(now); state = evaluateOtpAttempt(state, now).next; state = evaluateOtpAttempt(state, now).next; const result = evaluateOtpAttempt(state, now); expect(result.allowed).toBe(false); expect(result.reason).toBe("locked"); expect(result.next.lockedUntil?.getTime()).toBe(now.getTime() + OTP_LOCKOUT_MS); });
});

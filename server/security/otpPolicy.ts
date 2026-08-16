export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 3;
export const OTP_LOCKOUT_MS = 30 * 60 * 1000;
export type OtpPolicyState = { attempts: number; expiresAt: Date; lockedUntil?: Date | null; };
export function createOtpState(now = new Date()): OtpPolicyState { return { attempts: 0, expiresAt: new Date(now.getTime() + OTP_TTL_MS), lockedUntil: null }; }
export function evaluateOtpAttempt(state: OtpPolicyState, now = new Date()) { if (state.lockedUntil && state.lockedUntil > now) return { allowed: false, reason: "locked" as const, next: state }; if (state.expiresAt <= now) return { allowed: false, reason: "expired" as const, next: state }; const attempts = state.attempts + 1; const lockedUntil = attempts >= OTP_MAX_ATTEMPTS ? new Date(now.getTime() + OTP_LOCKOUT_MS) : null; return { allowed: attempts < OTP_MAX_ATTEMPTS, reason: attempts < OTP_MAX_ATTEMPTS ? "retry" as const : "locked" as const, next: { ...state, attempts, lockedUntil } }; }

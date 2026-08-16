import { jwtVerify, SignJWT } from "jose";
import { ENV } from "../_core/env";

type BookingAccessPayload = { bookingId: number; grantId: number; bookingCode: string };
const encoder = new TextEncoder();

function signingKey() {
  if (!ENV.cookieSecret) throw new Error("Booking access is not configured.");
  return encoder.encode(ENV.cookieSecret);
}

export async function createBookingAccessToken(payload: BookingAccessPayload, expiresAt: Date) {
  return new SignJWT({ bookingId: payload.bookingId, grantId: payload.grantId, bookingCode: payload.bookingCode })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(`booking-access:${payload.grantId}`)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(signingKey());
}

export async function verifyBookingAccessToken(token: string | undefined): Promise<BookingAccessPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), { algorithms: ["HS256"] });
    if (typeof payload.bookingId !== "number" || typeof payload.grantId !== "number" || typeof payload.bookingCode !== "string") return null;
    return { bookingId: payload.bookingId, grantId: payload.grantId, bookingCode: payload.bookingCode };
  } catch {
    return null;
  }
}

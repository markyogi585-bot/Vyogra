import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("secure trip-aware traveler experience", () => {
  it("uses a signed HttpOnly scoped booking access token instead of browser-stored contact suffixes", () => {
    expect(source("server/routers/bookingAccess.ts")).toContain("createBookingAccessToken");
    expect(source("server/routers/bookingAccess.ts")).toContain("BOOKING_ACCESS_COOKIE_NAME");
    expect(source("client/src/pages/BookingPortalPage.tsx")).toContain("bookingAccess.current");
    expect(source("client/src/pages/BookingPortalPage.tsx")).not.toContain("sessionStorage");
  });

  it("removes active wallet routes and prevents wallet application to booking estimates", () => {
    expect(source("client/src/App.tsx")).not.toContain("WalletPage");
    expect(source("server/routers/booking.ts")).not.toContain("useWallet");
    expect(source("server/routers/booking.ts")).toContain('walletApplied: "0.00"');
  });

  it("protects invoice and active trip views behind verified booking access", () => {
    expect(source("client/src/pages/InvoicePage.tsx")).toContain("bookingAccess.current");
    expect(source("client/src/pages/TripDashboardPage.tsx")).toContain("bookingAccess.tripDesk");
    expect(source("client/src/pages/TripDashboardPage.tsx")).toContain('trip.status !== "active"');
    expect(source("client/src/pages/TripDashboardPage.tsx")).toContain("api.open-meteo.com/v1/forecast");
  });
});

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const source = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("demo dashboard and checkout amount repair", () => {
  it("keeps the demo booking reference explicitly non-production and separate from protected booking access", () => {
    const app = source("client/src/App.tsx");
    const page = source("client/src/pages/DemoTripPage.tsx");
    const access = source("client/src/pages/BookingAccessPage.tsx");
    const accessRouter = source("server/routers/bookingAccess.ts");
    expect(app).toContain('path={"/demo/trip"}');
    expect(page).toContain("DEMO-VYG-GOA-2026");
    expect(page).toContain("NON-PRODUCTION DEMO");
    expect(page).toContain("Real bookings need verified contact suffix");
    expect(access).toContain('const DEMO_BOOKING_CODE = "DEMO-VYG-GOA-2026"');
    expect(access).toContain("normalizedSuffix === DEMO_CONTACT_SUFFIX");
    expect(access).toContain('setLocation("/demo/trip")');
    expect(access).toContain('Link href="/demo/trip">Open the non-production demo dashboard</Link>');
    expect(access).toContain("Demo only — real booking access remains verified.");
    expect(access).toContain("open.mutate({ bookingCode: code, contactSuffix: contact })");
    expect(accessRouter).toContain('const DEMO_BOOKING_CODE = "DEMO-VYG-GOA-2026"');
    expect(accessRouter).toContain("demo: true as const");
  });

  it("uses the shared invoice formula for displayed checkout totals", () => {
    const checkout = source("client/src/pages/CheckoutPage.tsx");
    expect(checkout).toContain("calculateInvoiceTotal");
    expect(checkout).toContain("addOnTotal");
    expect(checkout).toContain("Route fare");
    expect(checkout).toContain("Taxes & service fee");
  });

  it("does not imply a real charge when a live payment provider is absent", () => {
    const checkout = source("client/src/pages/CheckoutPage.tsx");
    expect(checkout).toContain("payment pending");
    expect(checkout).toContain("Payment collection is disabled");
  });
});

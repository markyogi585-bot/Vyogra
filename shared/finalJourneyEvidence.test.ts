import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const project = process.cwd();
const read = (path: string) => readFileSync(resolve(project, path), "utf8");

describe("final connected journey evidence", () => {
  it("defines loading, empty, error, or permission states for connected traveler journeys", () => {
    const home = read("client/src/pages/Home.tsx");
    const platform = read("client/src/pages/PlatformPages.tsx");
    const checkout = read("client/src/pages/CheckoutPage.tsx");
    const bookingAccess = read("client/src/pages/BookingAccessPage.tsx");
    const bookingPortal = read("client/src/pages/BookingPortalPage.tsx");
    const liveTrip = read("client/src/pages/LiveTripPage.tsx");
    const roleGate = read("client/src/components/security/RoleGate.tsx");

    expect(home).toContain("isLoading");
    expect(home).toContain("isError");
    expect(platform).toContain("Nothing here yet.");
    expect(platform).toContain("history.isLoading");
    expect(platform).toContain("history.isError");
    expect(checkout).toContain("issue.isError");
    expect(bookingAccess).toContain("onError");
    expect(bookingPortal).toContain("access.isLoading");
    expect(liveTrip).toContain("isError");
    expect(roleGate).toContain("ROLE-BOUND WORKSPACE");
  });

  it("keeps invoice, trip-operations, media, campaigns, and manual issue surfaces in native admin frames", () => {
    const invoice = read("client/src/pages/AdminInvoicePage.tsx");
    const operations = read("client/src/pages/AdminTripOperationsPage.tsx");
    const tools = read("client/src/pages/AdminTools.tsx");
    const growth = read("client/src/pages/AdminGrowthPage.tsx");
    const styles = read("client/src/styles/native-2026.css");

    expect(invoice).toContain("AdminPageFrame");
    expect(invoice).toContain("admin-invoice-layout");
    expect(operations).toContain("AdminPageFrame");
    expect(operations).toContain("TripUpdateComposer");
    expect(tools).toContain("Media");
    expect(growth).toContain("CampaignControlPanel");
    [".admin-invoice-layout", ".admin-trip-ops", ".media-folder-row", ".campaign-control-grid"].forEach((selector) => expect(styles).toContain(selector));
  });

  it("keeps OTP failure, login completion, persistence, and sign-out transitions explicit", () => {
    const auth = read("client/src/components/sheets/AuthSheet.tsx");
    const session = read("client/src/contexts/TravelSessionContext.tsx");

    expect(auth).toContain("attempt");
    expect(auth).toContain("otp-locked");
    expect(auth).toContain("completeAuth");
    expect(session).toContain("localStorage.setItem(STORAGE_KEY");
    expect(session).toContain("localStorage.removeItem(STORAGE_KEY");
    expect(session).toContain("signOut:");
  });
});

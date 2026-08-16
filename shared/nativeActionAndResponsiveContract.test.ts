import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const project = process.cwd();
const read = (path: string) => readFileSync(resolve(project, path), "utf8");
const styles = read("client/src/styles/native-2026.css");

describe("native action and responsive contract", () => {
  it("keeps primary commerce and traveler-access actions on typed API contracts", () => {
    const checkout = read("client/src/pages/CheckoutPage.tsx");
    const bookingAccess = read("client/src/pages/BookingAccessPage.tsx");
    const liveTrip = read("client/src/components/live/TripUpdateComposer.tsx");
    const media = read("client/src/components/media/MediaUploadBox.tsx");

    expect(checkout).toContain("commerce.checkoutIssue.useMutation");
    expect(bookingAccess).toContain("bookingAccess.open.useMutation");
    expect(liveTrip).toContain("tripOps.publishUpdate.useMutation");
    expect(media).toContain("media.upload.useMutation");
  });

  it("keeps primary administrative issue and campaign actions on typed mutations", () => {
    const manualBooking = read("client/src/pages/AdminManualBookingPage.tsx");
    const campaigns = read("client/src/components/admin/CampaignControlPanel.tsx");
    const packageBuilder = read("client/src/components/admin/PackageStepper.tsx");

    expect(manualBooking).toContain("commerce.manualIssue.useMutation");
    expect(campaigns).toContain("campaigns.createCoupon.useMutation");
    expect(campaigns).toContain("campaigns.saveWidget.useMutation");
    expect(packageBuilder).toContain("admin.packages.saveBlueprint.useMutation");
  });

  it("provides reduced-motion, safe-area, compact-sheet, and mobile-dock fallbacks", () => {
    [
      "env(safe-area-inset-bottom)",
      "@media (prefers-reduced-motion: reduce)",
      ".inner-bottom-nav",
      "@media(max-width:760px)",
      ".filter-sheet",
      ".booking-sheet",
      ".ops-sidebar{display:none",
    ].forEach((token) => expect(styles).toContain(token));
  });

  it("keeps phone cards inside the viewport and avoids the retired Monsoon style override", () => {
    const home = read("client/src/pages/Home.tsx");
    const toastSurface = read("client/src/components/ui/sonner.tsx");

    expect(home).not.toContain('import "./explore-system.css"');
    [
      "html,body,#root{max-width:100%;overflow-x:hidden}",
      ".explore-card,.wishlist-card,.trip-card,.account-page>*{min-width:0}",
      ".account-hero{display:grid;grid-template-columns:auto minmax(0,1fr) auto",
      ".home-route-library,.explore-results,.wishlist-grid{grid-template-columns:1fr!important",
      ".inner-bottom-nav{bottom:max(10px,env(safe-area-inset-bottom))!important;width:calc(100% - 20px)!important",
      ".quick-account-grid{grid-template-columns:1fr 1fr",
    ].forEach((token) => expect(styles).toContain(token));
    expect(toastSurface).not.toContain('from "next-themes"');
  });
});

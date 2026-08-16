import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const project = process.cwd();
const read = (path: string) => readFileSync(resolve(project, path), "utf8");
const app = read("client/src/App.tsx");
const adminHome = read("client/src/pages/Admin.tsx");
const adminFrame = read("client/src/components/admin/AdminPageFrame.tsx");
const commandCenter = read("client/src/pages/AdminTools.tsx");
const manualBooking = read("client/src/pages/AdminManualBookingPage.tsx");
const engagement = read("client/src/pages/AdminEngagementPage.tsx");
const nativeStyles = read("client/src/styles/native-2026.css");

describe("native administrative route audit", () => {
  it("registers every retained administrative workspace behind role gates", () => {
    [
      "/admin",
      "/admin/tools",
      "/admin/packages/new",
      "/admin/broadcasts",
      "/admin/budget",
      "/admin/system",
      "/admin/audit",
      "/admin/travelers/aarav-mehta",
      "/admin/operations",
      "/admin/engagement",
      "/admin/bookings/manual",
      "/admin/trips/live",
      "/admin/growth",
      "/admin/invoices/:bookingCode",
    ].forEach((route) => {
      expect(app).toContain(`path={"${route}"}`);
      expect(app).toContain("<RoleGate");
    });
  });

  it("uses shared role-aware frames and connected operational workspaces", () => {
    expect(adminFrame).toContain("Role-aware workspace");
    expect(commandCenter).toContain("ops-app");
    expect(commandCenter).toContain("/admin/engagement");
    expect(manualBooking).toContain("commerce.manualIssue.useMutation");
    expect(manualBooking).toContain("manual-booking-layout");
    expect(engagement).toContain("admin.engagement.supportQueue.useQuery");
    expect(engagement).toContain("admin.engagement.addChildTraveler.useMutation");
  });

  it("routes administrator home actions into the connected protected workspaces", () => {
    [
      'navigate("/admin/packages/new")',
      'navigate("/admin/operations")',
      'navigate("/admin/broadcasts")',
      'navigate("/admin/travelers/aarav-mehta")',
      "navigate(`/admin/bookings/${id}`)",
    ].forEach((action) => expect(adminHome).toContain(action));
  });

  it("defines native administration treatment for command, frame, and issue panels", () => {
    [
      ".ops-app",
      ".ops-sidebar",
      ".admin-page-frame",
      ".admin-panel",
      ".campaign-control-panel",
      ".manual-booking-layout",
      ".manual-booking-summary",
      ".manual-issued",
      ".engagement-grid",
      ".engagement-ticket-list",
    ].forEach((selector) => expect(nativeStyles).toContain(selector));
  });
});

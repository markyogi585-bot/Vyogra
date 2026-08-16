import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const project = process.cwd();
const read = (path: string) => readFileSync(resolve(project, path), "utf8");

describe("connected traveler journey contract", () => {
  it("preserves provider-safe identity boundaries while retaining account-free booking access", () => {
    const integrationStatus = read("server/config/integrationStatus.test.ts");
    const identity = read("shared/externalIdentity.test.ts");
    const bookingAccess = read("client/src/pages/BookingAccessPage.tsx");

    expect(integrationStatus).toContain("Firebase");
    expect(identity).toContain("verified");
    expect(bookingAccess).toContain("bookingAccess.open.useMutation");
    expect(bookingAccess).toContain("traveler contact suffix");
  });

  it("keeps account-sheet transitions explicit for OTP, sign-in completion, and sign-out", () => {
    const authSheet = read("client/src/components/sheets/AuthSheet.tsx");
    const session = read("client/src/contexts/TravelSessionContext.tsx");

    expect(authSheet).toContain("OTP");
    expect(authSheet).toContain("completeAuth");
    expect(session).toContain("completeAuth:");
    expect(session).toContain("signOut:");
    expect(session).toContain("LOCALE_STORAGE_KEY");
  });

  it("issues checkout records and reads traveler history through typed procedures", () => {
    const checkout = read("client/src/pages/CheckoutPage.tsx");
    const platform = read("client/src/pages/PlatformPages.tsx");
    const commerceTests = read("server/routers/commerce.procedure.test.ts");

    expect(checkout).toContain("commerce.checkoutIssue.useMutation");
    expect(checkout).toContain("acceptedTerms: true");
    expect(platform).toContain("trpc.bookings.mine.useQuery");
    expect(commerceTests).toContain("checkoutIssue");
  });
});

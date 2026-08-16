import { describe, expect, it } from "vitest";
import { campaignCardClass, isPublicCampaignKind, publicCampaignKinds } from "./campaignWidgets";

describe("public campaign widget contract", () => {
  it("recognises the daily-deal, flash-sale, and general-offer kinds that the home rail can render", () => {
    expect(isPublicCampaignKind("daily_deal")).toBe(true);
    expect(isPublicCampaignKind("flash_sale")).toBe(true);
    expect(isPublicCampaignKind("offer")).toBe(true);
    expect(isPublicCampaignKind("unknown")).toBe(false);
  });

  it("creates a dedicated visual class for every accepted campaign kind", () => {
    expect(publicCampaignKinds.map(campaignCardClass)).toEqual(["offer-daily_deal", "offer-flash_sale", "offer-offer", "offer-announcement"]);
  });
});

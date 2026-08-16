export const publicCampaignKinds = ["daily_deal", "flash_sale", "offer", "announcement"] as const;
export type PublicCampaignKind = (typeof publicCampaignKinds)[number];

export function isPublicCampaignKind(value: string): value is PublicCampaignKind {
  return publicCampaignKinds.includes(value as PublicCampaignKind);
}

export function campaignCardClass(kind: PublicCampaignKind) {
  return `offer-${kind}`;
}

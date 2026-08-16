import { z } from "zod";

export const externalIdentityProviderSchema = z.enum(["firebase_google", "firebase_phone", "supabase", "manus_oauth"]);
export const verifiedExternalIdentitySchema = z.object({
  userId: z.number().int().positive(),
  provider: externalIdentityProviderSchema,
  providerSubject: z.string().trim().min(3).max(255),
  email: z.string().email().optional(),
  phone: z.string().trim().min(8).max(32).optional(),
  claims: z.record(z.string(), z.unknown()).default({}),
});
export type VerifiedExternalIdentity = z.infer<typeof verifiedExternalIdentitySchema>;

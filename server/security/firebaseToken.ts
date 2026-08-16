import { createRemoteJWKSet, jwtVerify } from "jose";

const projectId = "tour-b631c";
const firebaseKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));

export type VerifiedFirebaseIdentity = {
  uid: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  picture: string | null;
  provider: string | null;
  role: "user" | "sub_admin" | "admin" | "super_admin" | null;
};

export async function verifyFirebaseIdToken(token: string): Promise<VerifiedFirebaseIdentity | null> {
  try {
    const { payload } = await jwtVerify(token, firebaseKeys, {
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
    });
    if (typeof payload.sub !== "string" || !payload.sub) return null;
    const firebase = payload.firebase as { sign_in_provider?: unknown } | undefined;
    const claimedRole = typeof payload.role === "string" && ["user", "sub_admin", "admin", "super_admin"].includes(payload.role) ? payload.role as VerifiedFirebaseIdentity["role"] : null;
    return {
      uid: payload.sub,
      email: typeof payload.email === "string" ? payload.email : null,
      phone: typeof payload.phone_number === "string" ? payload.phone_number : null,
      name: typeof payload.name === "string" ? payload.name : null,
      picture: typeof payload.picture === "string" ? payload.picture : null,
      provider: typeof firebase?.sign_in_provider === "string" ? firebase.sign_in_provider : null,
      role: claimedRole,
    };
  } catch {
    return null;
  }
}

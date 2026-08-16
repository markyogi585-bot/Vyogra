import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ensureFirebaseUser } from "../db";
import { verifyFirebaseIdToken } from "../security/firebaseToken";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  if (!user) {
    const authorization = opts.req.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
    if (token) {
      const identity = await verifyFirebaseIdToken(token);
      if (identity) user = await ensureFirebaseUser(identity) ?? null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

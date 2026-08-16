import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { walletTransactions, wallets } from "../../drizzle/schema";
import { inr } from "@/lib/formatters";
import { recordAudit } from "../audit/service";
import { getDb } from "../db";
import { assertPermission } from "../security/roles";
import { protectedProcedure, router } from "../_core/trpc";

export const walletRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => { const db = await getDb(); if (!db) return { balance: "0", currency: "INR", transactions: [] }; const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, ctx.user.id)).limit(1); if (!wallet) return { balance: "0", currency: "INR", transactions: [] }; const transactions = await db.select().from(walletTransactions).where(eq(walletTransactions.walletId, wallet.id)).orderBy(desc(walletTransactions.createdAt)).limit(40); return { balance: wallet.balance, currency: wallet.currency, transactions }; }),
  grantCredit: protectedProcedure.input(z.object({ userId: z.number().int().positive(), amount: z.number().positive(), description: z.string().trim().min(3).max(240) })).mutation(async ({ ctx, input }) => { assertPermission(ctx.user.role, "traveler:manage"); const db = await getDb(); if (!db) throw new Error("Database unavailable"); const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, input.userId)).limit(1); if (!wallet) throw new Error("Wallet not found"); await db.insert(walletTransactions).values({ walletId: wallet.id, type: "admin_credit", amount: String(input.amount), description: input.description }); await recordAudit(ctx.user.id, { eventType: "wallet.credit_granted", entityType: "wallet", entityId: String(wallet.id), metadata: { userId: input.userId, amount: input.amount } }); return { success: true, message: `${inr(input.amount)} credit recorded` }; }),
});

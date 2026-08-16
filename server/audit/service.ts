import { auditEvents } from "../../drizzle/schema";
import { getDb } from "../db";
import type { AuditEventInput } from "@shared/audit";

export async function recordAudit(actorUserId: number | null, event: AuditEventInput) { const db = await getDb(); if (!db) return { persisted: false as const }; await db.insert(auditEvents).values({ actorUserId, eventType: event.eventType, entityType: event.entityType, entityId: event.entityId ?? null, metadata: event.metadata, requestId: event.requestId ?? null }); return { persisted: true as const }; }

export type AuditEventInput = { eventType: string; entityType: string; entityId?: string; metadata?: Record<string, unknown>; requestId?: string; };

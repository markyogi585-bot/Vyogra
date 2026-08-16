import { describe, expect, it } from "vitest";
import type { AuditEventInput } from "./audit";

describe("audit event shape", () => {
  it("retains actor-independent event, entity, and metadata fields", () => { const event: AuditEventInput = { eventType: "broadcast.created", entityType: "broadcast", entityId: "42", metadata: { audience: "wishlist_users", scheduled: false }, requestId: "req-123" }; expect(event).toMatchObject({ eventType: "broadcast.created", entityType: "broadcast", entityId: "42", metadata: { audience: "wishlist_users" } }); });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../db", () => ({ getDb: vi.fn() }));
vi.mock("../../audit/service", () => ({ recordAudit: vi.fn() }));

import { getDb } from "../../db";
import { adminPackagesRouter } from "./packages";

const blueprint = { slug: "goa-slow-route", name: "Goa, at your own pace", summary: "A considered South Goa journey with careful stays, local hosts, and room for the road to unfold.", destination: "South Goa", category: "Beaches", durationDays: 5, durationNights: 4, basePrice: 12490, itinerary: [{ title: "Arrive in Palolem" }], terms: { revision: "2026-09", title: "Goa route terms", body: "Cancellation, rooming, conduct, and insurance terms are accepted before payment is captured." } };

describe("admin package blueprint procedure", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a traveler draft save before requesting the database", async () => {
    const caller = adminPackagesRouter.createCaller({ user: { id: 2, role: "user" } } as never);
    await expect(caller.saveBlueprint(blueprint)).rejects.toThrow("permission");
    expect(getDb).not.toHaveBeenCalled();
  });

  it("uses one transaction to persist a new package, dependent records, and a revision", async () => {
    const insert = vi.fn()
      .mockReturnValueOnce({ values: () => ({ $returningId: async () => [{ id: 71 }] }) })
      .mockReturnValueOnce({ values: async () => undefined })
      .mockReturnValueOnce({ values: () => ({ onDuplicateKeyUpdate: async () => undefined }) })
      .mockReturnValueOnce({ values: async () => undefined });
    const update = vi.fn(() => ({ set: () => ({ where: async () => undefined }) }));
    const select = vi.fn(() => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: async () => [] }) }) }) }));
    const tx = { insert, update, select };
    const transaction = vi.fn(async (callback: (inner: typeof tx) => unknown) => callback(tx));
    vi.mocked(getDb).mockResolvedValue({ transaction } as never);
    const caller = adminPackagesRouter.createCaller({ user: { id: 5, role: "admin" } } as never);
    await expect(caller.saveBlueprint(blueprint)).resolves.toMatchObject({ persisted: true, packageId: 71, revision: 1 });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledTimes(4);
  });
});

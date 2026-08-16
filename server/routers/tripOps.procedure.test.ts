import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({ getDb: vi.fn() }));
vi.mock("../audit/service", () => ({ recordAudit: vi.fn() }));

import { getDb } from "../db";
import { tripOpsRouter } from "./tripOps";

const checkin = { bookingId: 8, latitude: 15.0106, longitude: 74.0236, label: "Palolem beach" };

describe("trip location procedures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a traveler attempting to publish a host check-in before touching storage", async () => {
    const caller = tripOpsRouter.createCaller({ user: { id: 2, role: "user" } } as never);
    await expect(caller.publishCheckin(checkin)).rejects.toThrow("permission");
    expect(getDb).not.toHaveBeenCalled();
  });

  it("persists an operator check-in and returns its generated identifier", async () => {
    const insert = vi.fn(() => ({ values: () => ({ $returningId: async () => [{ id: 91 }] }) }));
    vi.mocked(getDb).mockResolvedValue({ insert } as never);
    const caller = tripOpsRouter.createCaller({ user: { id: 5, role: "admin" } } as never);
    await expect(caller.publishCheckin(checkin)).resolves.toMatchObject({ persisted: true, checkinId: 91, bookingId: 8 });
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("rejects a traveler reading a check-in for another booking owner", async () => {
    const select = vi.fn(() => ({ from: () => ({ where: () => ({ limit: async () => [{ userId: 99 }] }) }) }));
    vi.mocked(getDb).mockResolvedValue({ select } as never);
    const caller = tripOpsRouter.createCaller({ user: { id: 4, role: "user" } } as never);
    await expect(caller.latestCheckin({ bookingId: 8 })).rejects.toThrow("another traveler");
  });
});

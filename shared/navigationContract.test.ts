import { describe, expect, it } from "vitest";
import { connectedTravelerRoutes, isConnectedTravelerRoute } from "./navigationContract";

describe("connected traveler navigation", () => {
  it("keeps every retained home action on a real traveler route", () => {
    expect(connectedTravelerRoutes).toEqual(expect.arrayContaining(["/explore", "/access", "/trips", "/wallet", "/trips/live"]));
    connectedTravelerRoutes.forEach((path) => expect(isConnectedTravelerRoute(path)).toBe(true));
  });

  it("rejects placeholder or external pseudo-routes", () => {
    expect(isConnectedTravelerRoute("#")).toBe(false);
    expect(isConnectedTravelerRoute("/coming-soon")).toBe(false);
  });
});

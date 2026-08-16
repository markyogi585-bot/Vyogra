export const connectedTravelerRoutes = ["/explore", "/access", "/trips", "/wallet", "/wishlist", "/account", "/trips/live", "/support", "/notifications", "/checkout"] as const;

export type ConnectedTravelerRoute = (typeof connectedTravelerRoutes)[number];

export function isConnectedTravelerRoute(path: string) {
  return connectedTravelerRoutes.includes(path as ConnectedTravelerRoute);
}

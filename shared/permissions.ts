export type VoyagrRole = "user" | "sub_admin" | "admin" | "super_admin";
export type Permission = "package:read" | "package:write" | "booking:own" | "booking:manage" | "traveler:manage" | "wallet:own" | "review:own" | "broadcast:manage" | "announcement:manage" | "support:manage" | "contact:manage" | "budget:manage" | "system:manage" | "audit:read";

const permissionMatrix: Record<Permission, VoyagrRole[]> = {
  "package:read": ["user", "sub_admin", "admin", "super_admin"], "package:write": ["sub_admin", "admin", "super_admin"], "booking:own": ["user", "super_admin"], "booking:manage": ["sub_admin", "admin", "super_admin"], "traveler:manage": ["admin", "super_admin"], "wallet:own": ["user", "super_admin"], "review:own": ["user", "super_admin"], "broadcast:manage": ["admin", "super_admin"], "announcement:manage": ["admin", "super_admin"], "support:manage": ["sub_admin", "admin", "super_admin"], "contact:manage": ["admin", "super_admin"], "budget:manage": ["admin", "super_admin"], "system:manage": ["super_admin"], "audit:read": ["admin", "super_admin"],
};

export function can(role: VoyagrRole, permission: Permission) { return permissionMatrix[permission].includes(role); }
export function roleLabel(role: VoyagrRole) { return ({ user: "Traveler", sub_admin: "Sub-Admin", admin: "Admin", super_admin: "Super Admin" } as const)[role]; }

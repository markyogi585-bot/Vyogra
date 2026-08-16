import { TRPCError } from "@trpc/server";
import { can, type Permission, type VoyagrRole } from "@shared/permissions";

export function assertPermission(role: string, permission: Permission) { if (!can(role as VoyagrRole, permission)) throw new TRPCError({ code: "FORBIDDEN", message: "Your account does not have permission for this action." }); }
export function assertOwnership(actorUserId: number, ownerUserId: number) { if (actorUserId !== ownerUserId) throw new TRPCError({ code: "FORBIDDEN", message: "This record belongs to another traveler." }); }
export function isOperator(role: string) { return ["sub_admin", "admin", "super_admin"].includes(role); }

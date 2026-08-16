// Kept separate from lib/actions/users.ts (which has `"use server"`, and can
// only export async functions) so both server and client code can import
// these plain constants directly.

import type { UserRole } from "@/lib/generated/prisma/client";

export const ALL_ROLES: UserRole[] = ["MEMBER", "EBOARD", "TREASURER", "ADMIN", "SUPER_ADMIN"];

export const ROLE_LABELS: Record<string, string> = {
  MEMBER: "Member",
  EBOARD: "E-Board",
  TREASURER: "Treasurer",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

// Two separate ceilings per viewer role:
// - assignableRoles: which NEW roles they're allowed to set someone to.
// - manageableCurrentRoles: whose CURRENT role they're allowed to touch at all.
// A Super Admin can promote/demote anyone up through Admin (never another
// Super Admin — that's only ever set via BOOTSTRAP_SUPER_ADMIN_EMAIL or the
// DB directly). An Admin can promote a Member/Treasurer all the way up to
// Admin, but can't touch someone who is already Admin or Super Admin (no
// peer-level power) — so in practice an Admin can only ever demote someone
// back down to Member, never "remove" another Admin's standing.
export const ROLE_PERMISSIONS: Record<
  string,
  { assignableRoles: UserRole[]; manageableCurrentRoles: UserRole[] }
> = {
  SUPER_ADMIN: {
    assignableRoles: ["MEMBER", "EBOARD", "TREASURER", "ADMIN"],
    manageableCurrentRoles: ["MEMBER", "EBOARD", "TREASURER", "ADMIN"],
  },
  ADMIN: {
    assignableRoles: ["MEMBER", "EBOARD", "TREASURER", "ADMIN"],
    manageableCurrentRoles: ["MEMBER", "EBOARD", "TREASURER"],
  },
};

import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User, UserRole } from "@/lib/generated/prisma/client";

const ADMIN_ROLES: UserRole[] = ["TREASURER", "ADMIN", "SUPER_ADMIN"];
const ROLE_MANAGER_ROLES: UserRole[] = ["ADMIN", "SUPER_ADMIN"];
// Everyone allowed into the /admin shell at all — Treasurer/Admin/Super Admin
// (full access) plus E-Board (read-only: Ledger + Budgets only, enforced by
// those two pages using this check while every other admin page still uses
// the stricter requireAdmin()).
const ADMIN_AREA_ROLES: UserRole[] = ["TREASURER", "ADMIN", "SUPER_ADMIN", "EBOARD"];

/** Returns the signed-in user's app-level profile, or null if not signed in. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  return prisma.user.findUnique({ where: { id: authUser.id } });
}

/** Redirects to /login if not signed in; otherwise returns the user profile. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirects to /login (unauthenticated) or /dashboard (wrong role) as needed. */
export async function requireRole(roles: UserRole[]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export async function requireAdmin(): Promise<User> {
  return requireRole(ADMIN_ROLES);
}

/** Treasurer/Admin/Super Admin, or E-Board (view-only). Use for the /admin
 * shell itself and for the Ledger/Budgets pages E-Board can see; every other
 * admin page/action should keep using requireAdmin(). */
export async function requireAdminAreaAccess(): Promise<User> {
  return requireRole(ADMIN_AREA_ROLES);
}

export async function requireSuperAdmin(): Promise<User> {
  return requireRole(["SUPER_ADMIN"]);
}

/** Admin or Super Admin — the two roles allowed to manage other users' roles
 * (each restricted to a different assignable-roles ceiling, see lib/actions/users.ts). */
export async function requireRoleManager(): Promise<User> {
  return requireRole(ROLE_MANAGER_ROLES);
}

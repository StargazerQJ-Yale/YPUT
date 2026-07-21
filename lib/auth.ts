import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User, UserRole } from "@/lib/generated/prisma/client";

const ADMIN_ROLES: UserRole[] = ["TREASURER", "SUPER_ADMIN"];

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

export async function requireSuperAdmin(): Promise<User> {
  return requireRole(["SUPER_ADMIN"]);
}

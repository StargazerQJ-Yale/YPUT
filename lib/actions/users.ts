"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin, requireRoleManager } from "@/lib/auth";
import { DEFAULT_ADMIN_PIN, hashPin } from "@/lib/pin";
import { ALL_ROLES, ROLE_PERMISSIONS } from "@/lib/role-permissions";
import type { UserRole } from "@/lib/generated/prisma/client";

export type ActionResult = { success: true } | { success: false; error: string };

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Enter a valid email"),
});

export async function updateUserProfile(
  targetUserId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireSuperAdmin();

  const parsed = profileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { fullName: parsed.data.fullName, email: parsed.data.email.toLowerCase() },
    });
  } catch {
    return { success: false, error: "Another user already has that email." };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleTestAccount(
  targetUserId: string,
  isTestAccount: boolean,
): Promise<ActionResult> {
  const currentUser = await requireSuperAdmin();

  if (targetUserId === currentUser.id) {
    return { success: false, error: "You can't mark your own account as a test account." };
  }

  await prisma.user.update({ where: { id: targetUserId }, data: { isTestAccount } });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserRole(targetUserId: string, role: UserRole): Promise<ActionResult> {
  const currentUser = await requireRoleManager();
  const permissions = ROLE_PERMISSIONS[currentUser.role] ?? {
    assignableRoles: [],
    manageableCurrentRoles: [],
  };

  if (!ALL_ROLES.includes(role) || !permissions.assignableRoles.includes(role)) {
    return { success: false, error: "You don't have permission to assign that role." };
  }
  if (targetUserId === currentUser.id) {
    return { success: false, error: "You can't change your own role." };
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true, passwordHash: true },
  });
  if (!target) {
    return { success: false, error: "User not found." };
  }
  if (!permissions.manageableCurrentRoles.includes(target.role)) {
    return { success: false, error: "You don't have permission to change this user's role." };
  }

  const needsDefaultPin =
    (role === "EBOARD" || role === "TREASURER" || role === "ADMIN" || role === "SUPER_ADMIN") &&
    !target.passwordHash;

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      role,
      ...(needsDefaultPin ? { passwordHash: await hashPin(DEFAULT_ADMIN_PIN) } : {}),
    },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/cycles");
  return { success: true };
}

"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { DEFAULT_ADMIN_PIN, PIN_COOKIE_NAME, hashPin, signPinToken, verifyPin } from "@/lib/pin";

export type ActionResult = { success: true } | { success: false; error: string };

export async function verifyAdminPin(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAdmin();

  const pin = String(formData.get("pin") ?? "");
  if (!pin) return { success: false, error: "Enter your PIN." };
  if (!user.passwordHash) return { success: false, error: "No PIN is set for your account yet — ask a Super Admin to reset it." };

  const valid = await verifyPin(pin, user.passwordHash);
  if (!valid) return { success: false, error: "Incorrect PIN." };

  const { value, maxAge } = signPinToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set(PIN_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge,
  });

  return { success: true };
}

export async function changeAdminPin(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireAdmin();

  const currentPin = String(formData.get("currentPin") ?? "");
  const newPin = String(formData.get("newPin") ?? "");

  if (!user.passwordHash || !(await verifyPin(currentPin, user.passwordHash))) {
    return { success: false, error: "Current PIN is incorrect." };
  }
  if (newPin.length < 6) {
    return { success: false, error: "New PIN must be at least 6 characters." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPin(newPin) },
  });

  // Re-issue the cookie for the new PIN so the current session isn't kicked out.
  const { value, maxAge } = signPinToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set(PIN_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge,
  });

  return { success: true };
}

export async function resetAdminPinToDefault(targetUserId: string): Promise<ActionResult> {
  await requireSuperAdmin();

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { role: true } });
  if (!target || target.role === "MEMBER") {
    return { success: false, error: "That user isn't a Treasurer or Super Admin." };
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { passwordHash: await hashPin(DEFAULT_ADMIN_PIN) },
  });

  return { success: true };
}

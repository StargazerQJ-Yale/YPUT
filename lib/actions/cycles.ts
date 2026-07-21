"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { getDefaultOrg } from "@/lib/org";

export type ActionResult = { success: true } | { success: false; error: string };

const cycleSchema = z
  .object({
    label: z.string().trim().min(1, "Label is required").max(100),
    treasurerUserId: z.string().min(1, "Select a treasurer"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export async function createCycle(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireSuperAdmin();
  const org = await getDefaultOrg();

  const parsed = cycleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { label, treasurerUserId, startDate, endDate } = parsed.data;

  await prisma.reimbursementCycle.create({
    data: {
      orgId: org.id,
      label,
      treasurerUserId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  revalidatePath("/admin/cycles");
  return { success: true };
}

export async function updateCycle(
  cycleId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireSuperAdmin();

  const parsed = cycleSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { label, treasurerUserId, startDate, endDate } = parsed.data;

  await prisma.reimbursementCycle.update({
    where: { id: cycleId },
    data: {
      label,
      treasurerUserId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  revalidatePath("/admin/cycles");
  return { success: true };
}

export async function deleteCycle(cycleId: string): Promise<ActionResult> {
  await requireSuperAdmin();

  await prisma.reimbursementCycle.delete({ where: { id: cycleId } }).catch(() => null);

  revalidatePath("/admin/cycles");
  return { success: true };
}

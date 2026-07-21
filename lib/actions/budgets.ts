"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getDefaultOrg, getActiveFiscalYear } from "@/lib/org";

export type ActionResult = { success: true } | { success: false; error: string };

const areaSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
});

const itemSchema = z.object({
  budgetAreaId: z.string().min(1, "Select a budget area"),
  name: z.string().trim().min(1, "Name is required").max(100),
  budgetedAmount: z.coerce.number({ error: "Enter a valid amount" }).nonnegative("Amount can't be negative"),
});

export async function createBudgetArea(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const org = await getDefaultOrg();
  const fiscalYear = await getActiveFiscalYear();

  const parsed = areaSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await prisma.budgetArea.create({
      data: { orgId: org.id, fiscalYearId: fiscalYear.id, name: parsed.data.name },
    });
  } catch {
    return { success: false, error: "A budget area with this name already exists." };
  }

  revalidatePath("/admin/budgets");
  return { success: true };
}

export async function createBudgetItem(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = itemSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await prisma.budgetItem.create({
      data: {
        budgetAreaId: parsed.data.budgetAreaId,
        name: parsed.data.name,
        budgetedAmount: parsed.data.budgetedAmount,
      },
    });
  } catch {
    return { success: false, error: "A budget category with this name already exists in that area." };
  }

  revalidatePath("/admin/budgets");
  return { success: true };
}

export async function updateBudgetArea(
  budgetAreaId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = areaSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await prisma.budgetArea.update({
      where: { id: budgetAreaId },
      data: { name: parsed.data.name },
    });
  } catch {
    return { success: false, error: "A budget area with this name already exists." };
  }

  revalidatePath("/admin/budgets");
  return { success: true };
}

export async function updateBudgetItem(
  budgetItemId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = itemSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await prisma.budgetItem.update({
      where: { id: budgetItemId },
      data: {
        budgetAreaId: parsed.data.budgetAreaId,
        name: parsed.data.name,
        budgetedAmount: parsed.data.budgetedAmount,
      },
    });
  } catch {
    return { success: false, error: "A budget category with this name already exists in that area." };
  }

  revalidatePath("/admin/budgets");
  return { success: true };
}

export async function deleteBudgetArea(budgetAreaId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.budgetArea.delete({ where: { id: budgetAreaId } });
  } catch {
    return {
      success: false,
      error: "Can't delete a budget area that still has categories or reimbursements linked to it.",
    };
  }
  revalidatePath("/admin/budgets");
  return { success: true };
}

export async function deleteBudgetItem(budgetItemId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await prisma.budgetItem.delete({ where: { id: budgetItemId } });
  } catch {
    return {
      success: false,
      error: "Can't delete a budget category that still has reimbursements linked to it.",
    };
  }
  revalidatePath("/admin/budgets");
  return { success: true };
}

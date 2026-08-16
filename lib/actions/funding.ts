"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getDefaultOrg, getActiveFiscalYear } from "@/lib/org";

export type ActionResult = { success: true } | { success: false; error: string };

const depositSchema = z.object({
  amount: z.coerce.number({ error: "Enter a valid amount" }).positive("Amount must be greater than 0"),
  source: z.string().trim().min(1, "Say where these funds came from").max(200),
  promisedBy: z.string().trim().max(200).optional().or(z.literal("")),
  status: z.enum(["PROMISED", "RECEIVED"]),
  depositDate: z.string().min(1, "Date is required"),
});

export async function createFundDeposit(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const org = await getDefaultOrg();
  const fiscalYear = await getActiveFiscalYear();

  const parsed = depositSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.fundDeposit.create({
    data: {
      orgId: org.id,
      fiscalYearId: fiscalYear.id,
      amount: parsed.data.amount,
      source: parsed.data.source,
      promisedBy: parsed.data.promisedBy || null,
      status: parsed.data.status,
      depositDate: new Date(parsed.data.depositDate),
      recordedByUserId: admin.id,
    },
  });

  revalidatePath("/admin/budgets");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteFundDeposit(depositId: string): Promise<ActionResult> {
  await requireAdmin();

  await prisma.fundDeposit.delete({ where: { id: depositId } }).catch(() => null);

  revalidatePath("/admin/budgets");
  revalidatePath("/admin");
  return { success: true };
}

/** Flips a promised deposit to received, and updates the date to when it
 * actually arrived (defaults to today). */
export async function markFundDepositReceived(
  depositId: string,
  receivedDate: string,
): Promise<ActionResult> {
  await requireAdmin();

  await prisma.fundDeposit.update({
    where: { id: depositId },
    data: { status: "RECEIVED", depositDate: new Date(receivedDate) },
  });

  revalidatePath("/admin/budgets");
  revalidatePath("/admin");
  return { success: true };
}

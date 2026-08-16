"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getDefaultOrg } from "@/lib/org";

export type ActionResult = { success: true } | { success: false; error: string };

const manualEntrySchema = z.object({
  budgetItemId: z.string().min(1, "Select a budget category"),
  amount: z.coerce.number({ error: "Enter a valid amount" }).positive("Amount must be greater than 0"),
  occurredAt: z.string().min(1, "Date is required"),
  description: z.string().trim().min(1, "Say what this was for").max(500),
});

/** For spending that never went through a Reimbursement submission (e.g.
 * recorded after the fact, or paid entirely outside the site) — Treasurer/
 * Admin/Super Admin only, same as everything else that touches the ledger. */
export async function createManualLedgerEntry(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const org = await getDefaultOrg();

  const parsed = manualEntrySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const values = parsed.data;

  const budgetItem = await prisma.budgetItem.findFirst({
    where: { id: values.budgetItemId, budgetArea: { orgId: org.id } },
  });
  if (!budgetItem) {
    return { success: false, error: "Selected budget category is invalid." };
  }

  await prisma.ledgerTransaction.create({
    data: {
      orgId: org.id,
      budgetItemId: values.budgetItemId,
      amount: values.amount,
      occurredAt: new Date(values.occurredAt),
      description: values.description,
      recordedByUserId: admin.id,
    },
  });

  revalidatePath("/admin/ledger");
  revalidatePath("/admin/budgets");
  revalidatePath("/admin");
  revalidatePath("/ledger");
  return { success: true };
}

/** Only for manual entries — a reimbursement-linked row has to be removed via
 * that reimbursement's own delete action (super-admin-gated once paid), so
 * the two stay in sync rather than leaving a paid reimbursement with no
 * matching ledger row. */
export async function deleteLedgerEntry(entryId: string): Promise<ActionResult> {
  await requireAdmin();

  const entry = await prisma.ledgerTransaction.findUnique({
    where: { id: entryId },
    select: { reimbursementId: true },
  });
  if (!entry) return { success: false, error: "Ledger entry not found." };
  if (entry.reimbursementId) {
    return {
      success: false,
      error: "This entry is linked to a reimbursement — delete it from the reimbursement's page instead.",
    };
  }

  await prisma.ledgerTransaction.delete({ where: { id: entryId } });

  revalidatePath("/admin/ledger");
  revalidatePath("/admin/budgets");
  revalidatePath("/admin");
  revalidatePath("/ledger");
  return { success: true };
}

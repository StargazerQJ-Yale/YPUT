"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { reimbursementFormSchema } from "@/lib/validations/reimbursement";
import type { ReimbursementStatus } from "@/lib/generated/prisma/client";

export type ActionResult = { success: true } | { success: false; error: string };

async function transitionStatus(
  reimbursementId: string,
  toStatus: ReimbursementStatus,
  note: string | undefined,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const current = await prisma.reimbursement.findUnique({
    where: { id: reimbursementId },
    select: { status: true },
  });
  if (!current) return { success: false, error: "Reimbursement not found." };

  await prisma.$transaction([
    prisma.reimbursement.update({
      where: { id: reimbursementId },
      data: { status: toStatus },
    }),
    prisma.reimbursementStatusHistory.create({
      data: {
        reimbursementId,
        fromStatus: current.status,
        toStatus,
        changedByUserId: admin.id,
        note: note || null,
      },
    }),
  ]);

  revalidatePath(`/admin/reimbursements/${reimbursementId}`);
  revalidatePath("/admin/reimbursements");
  revalidatePath("/admin");
  revalidatePath(`/reimbursements/${reimbursementId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

export async function approveReimbursement(reimbursementId: string, note?: string) {
  return transitionStatus(reimbursementId, "APPROVED", note);
}

export async function rejectReimbursement(reimbursementId: string, note?: string) {
  return transitionStatus(reimbursementId, "REJECTED", note);
}

export async function requestInfo(reimbursementId: string, note: string) {
  return transitionStatus(reimbursementId, "NEEDS_INFO", note);
}

export async function deleteReimbursement(reimbursementId: string): Promise<ActionResult> {
  const admin = await requireAdmin();

  const current = await prisma.reimbursement.findUnique({
    where: { id: reimbursementId },
    select: { status: true },
  });
  if (!current) return { success: false, error: "Reimbursement not found." };

  // A paid reimbursement has a LedgerTransaction recorded (and cascades on
  // delete) — deleting it erases real spending history from the books, so
  // only Super Admin can override this (e.g. to clean up test data).
  if (current.status === "PAID" && admin.role !== "SUPER_ADMIN") {
    return {
      success: false,
      error: "A paid reimbursement can't be deleted — it's part of the ledger. Only a Super Admin can override this.",
    };
  }

  await prisma.reimbursement.delete({ where: { id: reimbursementId } });

  revalidatePath("/admin/reimbursements");
  revalidatePath("/admin");
  revalidatePath("/admin/budgets");
  revalidatePath("/admin/ledger");
  return { success: true };
}

export async function updateReimbursement(
  reimbursementId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const current = await prisma.reimbursement.findUnique({
    where: { id: reimbursementId },
    select: { status: true, orgId: true },
  });
  if (!current) return { success: false, error: "Reimbursement not found." };

  // A paid reimbursement already has a LedgerTransaction recorded at its
  // original amount/budget item — editing after the fact would desync the
  // ledger and every budget's Used/Remaining total, so it's locked once paid.
  if (current.status === "PAID") {
    return { success: false, error: "A paid reimbursement can no longer be edited." };
  }

  const parsed = reimbursementFormSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const values = parsed.data;

  const budgetItem = await prisma.budgetItem.findFirst({
    where: { id: values.budgetItemId, budgetAreaId: values.budgetAreaId },
  });
  if (!budgetItem) {
    return { success: false, error: "Selected budget category doesn't belong to that budget area." };
  }

  const rawGuestId = formData.get("guestId");
  let guestId: string | null = null;
  if (typeof rawGuestId === "string" && rawGuestId) {
    const guest = await prisma.guest.findFirst({ where: { id: rawGuestId, orgId: current.orgId } });
    if (!guest) {
      return { success: false, error: "Selected guest doesn't belong to this organization." };
    }
    guestId = guest.id;
  }

  await prisma.$transaction([
    prisma.reimbursement.update({
      where: { id: reimbursementId },
      data: {
        fullName: values.fullName,
        email: values.email,
        amount: values.amount,
        budgetAreaId: values.budgetAreaId,
        budgetItemId: values.budgetItemId,
        description: values.description,
        eventName: values.eventName || null,
        purchaseDate: new Date(values.purchaseDate),
        paymentMethod: values.paymentMethod,
        paymentHandle: values.paymentHandle,
        notes: values.notes || null,
        guestId,
      },
    }),
    prisma.reimbursementStatusHistory.create({
      data: {
        reimbursementId,
        fromStatus: current.status,
        toStatus: current.status,
        changedByUserId: admin.id,
        note: "Edited by admin",
      },
    }),
  ]);

  revalidatePath(`/admin/reimbursements/${reimbursementId}`);
  revalidatePath("/admin/reimbursements");
  revalidatePath("/admin");
  revalidatePath("/admin/budgets");
  revalidatePath(`/reimbursements/${reimbursementId}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin/guests");
  if (guestId) revalidatePath(`/admin/guests/${guestId}`);

  return { success: true };
}

export async function markPaid(
  reimbursementId: string,
  paidDate: string,
  transactionId: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  if (!transactionId.trim()) {
    return { success: false, error: "Transaction ID is required." };
  }

  const current = await prisma.reimbursement.findUnique({
    where: { id: reimbursementId },
    select: { status: true, orgId: true, amount: true, budgetItemId: true },
  });
  if (!current) return { success: false, error: "Reimbursement not found." };

  const occurredAt = new Date(paidDate);

  await prisma.$transaction([
    prisma.reimbursement.update({
      where: { id: reimbursementId },
      data: { status: "PAID" },
    }),
    prisma.reimbursementStatusHistory.create({
      data: {
        reimbursementId,
        fromStatus: current.status,
        toStatus: "PAID",
        changedByUserId: admin.id,
      },
    }),
    prisma.payment.upsert({
      where: { reimbursementId },
      update: { paidDate: occurredAt, transactionId, recordedByUserId: admin.id },
      create: {
        reimbursementId,
        paidDate: occurredAt,
        transactionId,
        recordedByUserId: admin.id,
      },
    }),
    // The automatic ledger: one entry per paid reimbursement, upserted so
    // re-recording a payment (new date/txn ID) just updates it in place.
    prisma.ledgerTransaction.upsert({
      where: { reimbursementId },
      update: { occurredAt },
      create: {
        reimbursementId,
        orgId: current.orgId,
        budgetItemId: current.budgetItemId,
        amount: current.amount,
        occurredAt,
      },
    }),
  ]);

  revalidatePath(`/admin/reimbursements/${reimbursementId}`);
  revalidatePath("/admin/reimbursements");
  revalidatePath("/admin");
  revalidatePath("/admin/budgets");
  revalidatePath("/admin/ledger");
  revalidatePath(`/reimbursements/${reimbursementId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

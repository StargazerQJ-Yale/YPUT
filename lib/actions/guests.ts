"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getDefaultOrg, getActiveFiscalYear } from "@/lib/org";
import { researchGuestAndMatchLectureship } from "@/lib/groq";
import type { GroqModel } from "@/lib/groq-models";

export type ActionResult = { success: true } | { success: false; error: string };

const guestSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  debateDate: z.string().min(1, "Debate date is required"),
});

export async function createGuest(_prevState: ActionResult | null, formData: FormData) {
  const admin = await requireAdmin();
  const org = await getDefaultOrg();

  const parsed = guestSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." } as ActionResult;
  }

  const guest = await prisma.guest.create({
    data: {
      orgId: org.id,
      name: parsed.data.name,
      debateDate: new Date(parsed.data.debateDate),
      createdByUserId: admin.id,
    },
  });

  revalidatePath("/admin/guests");
  redirect(`/admin/guests/${guest.id}`);
}

export async function researchGuest(
  guestId: string,
  options: { model: GroqModel; useWebSearch?: boolean },
): Promise<ActionResult> {
  await requireAdmin();
  const org = await getDefaultOrg();

  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest || guest.orgId !== org.id) {
    return { success: false, error: "Guest not found." };
  }

  const lectureships = await prisma.lectureshipFund.findMany({
    where: { orgId: org.id },
    select: { id: true, name: true, purpose: true },
  });

  let result;
  try {
    result = await researchGuestAndMatchLectureship(guest.name, lectureships, options);
  } catch (error) {
    console.error("Groq research failed:", error);
    return { success: false, error: "Couldn't complete the research. Please try again." };
  }

  await prisma.guest.update({
    where: { id: guestId },
    data: {
      status: "RESEARCHED",
      researchSummary: result.summary,
      matchedLectureshipId: result.matchedLectureshipId,
      matchReasoning: result.reasoning,
    },
  });

  revalidatePath(`/admin/guests/${guestId}`);
  revalidatePath("/admin/guests");
  return { success: true };
}

const matchSchema = z.object({
  matchedLectureshipId: z.string().min(1, "Select a lectureship"),
  matchReasoning: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function updateGuestMatch(
  guestId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = matchSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.guest.update({
    where: { id: guestId },
    data: {
      matchedLectureshipId: parsed.data.matchedLectureshipId,
      matchReasoning: parsed.data.matchReasoning || null,
      status: "CONFIRMED",
    },
  });

  revalidatePath(`/admin/guests/${guestId}`);
  revalidatePath("/admin/guests");
  return { success: true };
}

const addExpenseSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Enter a valid email"),
  amount: z.coerce.number({ error: "Enter a valid amount" }).positive("Amount must be greater than 0"),
  budgetAreaId: z.string().min(1, "Select a budget area"),
  budgetItemId: z.string().min(1, "Select a budget category"),
  description: z.string().trim().min(1, "Description is required").max(2000),
  eventName: z.string().trim().max(200).optional().or(z.literal("")),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  paymentMethod: z.enum(["VENMO", "ZELLE", "BANK_TRANSFER"], { error: "Select a payment method" }),
  paymentHandle: z.string().trim().min(1, "Payment handle is required").max(200),
  paidDate: z.string().min(1, "Paid date is required"),
  transactionId: z.string().trim().min(1, "Transaction ID is required").max(200),
});

/** Records a guest expense directly as PAID — for backfilling costs the org
 * already knows about and has already covered (a receipt someone hands the
 * treasurer after the fact), skipping the submit-then-review flow since
 * there's nothing left to review. Mirrors what markPaid() does (status
 * history + Payment + LedgerTransaction) so it behaves like any other paid
 * reimbursement everywhere else in the app. */
export async function addGuestExpense(
  guestId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const org = await getDefaultOrg();

  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest || guest.orgId !== org.id) {
    return { success: false, error: "Guest not found." };
  }

  const receiptPath = formData.get("receiptPath");
  const receiptName = formData.get("receiptName");
  const hasReceipt = typeof receiptPath === "string" && receiptPath.length > 0;

  const parsed = addExpenseSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  if (!hasReceipt) {
    return { success: false, error: "Upload a receipt image or PDF." };
  }
  const values = parsed.data;

  const budgetItem = await prisma.budgetItem.findFirst({
    where: { id: values.budgetItemId, budgetAreaId: values.budgetAreaId },
  });
  if (!budgetItem) {
    return { success: false, error: "Selected budget category is invalid." };
  }

  const fiscalYear = await getActiveFiscalYear();
  const paidDate = new Date(values.paidDate);

  await prisma.reimbursement.create({
    data: {
      orgId: org.id,
      fiscalYearId: fiscalYear.id,
      submitterUserId: admin.id,
      guestId,
      fullName: values.fullName,
      email: values.email,
      amount: values.amount,
      receiptPath: receiptPath as string,
      receiptName: typeof receiptName === "string" && receiptName ? receiptName : "receipt",
      budgetAreaId: values.budgetAreaId,
      budgetItemId: values.budgetItemId,
      description: values.description,
      eventName: values.eventName || guest.name,
      purchaseDate: new Date(values.purchaseDate),
      paymentMethod: values.paymentMethod,
      paymentHandle: values.paymentHandle,
      status: "PAID",
      statusHistory: {
        create: {
          fromStatus: null,
          toStatus: "PAID",
          changedByUserId: admin.id,
          note: "Added directly as paid (guest expense, backfilled)",
        },
      },
      payment: {
        create: {
          paidDate,
          transactionId: values.transactionId,
          recordedByUserId: admin.id,
        },
      },
      ledgerTransaction: {
        create: {
          orgId: org.id,
          budgetItemId: values.budgetItemId,
          amount: values.amount,
          occurredAt: paidDate,
        },
      },
    },
  });

  revalidatePath(`/admin/guests/${guestId}`);
  revalidatePath("/admin/guests");
  revalidatePath("/admin/ledger");
  revalidatePath("/admin/budgets");
  revalidatePath("/admin");
  revalidatePath("/ledger");
  return { success: true };
}

export async function deleteGuest(guestId: string): Promise<ActionResult> {
  await requireAdmin();

  await prisma.guest.delete({ where: { id: guestId } }).catch(() => null);

  revalidatePath("/admin/guests");
  return { success: true };
}

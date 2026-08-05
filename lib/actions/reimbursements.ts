"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDefaultOrg, getActiveFiscalYear } from "@/lib/org";
import { getActiveCycle } from "@/lib/cycles";
import { reimbursementFormSchema } from "@/lib/validations/reimbursement";
import { sendReimbursementSubmittedEmail } from "@/lib/email";

export type SubmitReimbursementState = {
  fieldErrors?: Record<string, string[] | undefined>;
  formError?: string;
  // Echoes back everything the user typed (except the file, which browsers
  // can't repopulate) so a failed submit doesn't wipe the form.
  values?: Record<string, string>;
};

export async function submitReimbursement(
  _prevState: SubmitReimbursementState,
  formData: FormData,
): Promise<SubmitReimbursementState> {
  const user = await requireUser();

  const raw = Object.fromEntries(formData.entries());
  const rawValues = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
  const parsed = reimbursementFormSchema.safeParse(raw);

  // The receipt itself is uploaded directly from the browser to Supabase
  // Storage (see lib/actions/receipt-upload.ts) before this action runs —
  // routing the file bytes through this Server Action instead would risk a
  // 413 from Vercel's ~4.5MB function payload cap. Only the resulting path
  // reaches us here.
  const receiptPath = formData.get("receiptPath");
  const receiptName = formData.get("receiptName");
  const hasReceipt = typeof receiptPath === "string" && receiptPath.length > 0;

  if (!parsed.success || !hasReceipt) {
    const fieldErrors = parsed.success ? {} : parsed.error.flatten().fieldErrors;
    return {
      values: rawValues,
      fieldErrors: {
        ...fieldErrors,
        receipt: hasReceipt ? undefined : ["Upload a receipt image or PDF"],
      },
    };
  }

  const values = parsed.data;
  const org = await getDefaultOrg();
  const fiscalYear = await getActiveFiscalYear();

  const budgetItem = await prisma.budgetItem.findFirst({
    where: { id: values.budgetItemId, budgetAreaId: values.budgetAreaId },
  });
  if (!budgetItem) {
    return {
      values: rawValues,
      formError: "Selected budget category is invalid. Please re-select and try again.",
    };
  }

  const activeCycle = await getActiveCycle(org.id);

  const reimbursement = await prisma.reimbursement.create({
    data: {
      orgId: org.id,
      fiscalYearId: fiscalYear.id,
      submitterUserId: user.id,
      fullName: values.fullName,
      email: values.email,
      amount: values.amount,
      receiptPath: receiptPath,
      receiptName: typeof receiptName === "string" && receiptName ? receiptName : "receipt",
      budgetAreaId: values.budgetAreaId,
      budgetItemId: values.budgetItemId,
      description: values.description,
      eventName: values.eventName || null,
      purchaseDate: new Date(values.purchaseDate),
      paymentMethod: values.paymentMethod,
      paymentHandle: values.paymentHandle,
      notes: values.notes || null,
      cycleId: activeCycle?.id,
      status: "PENDING",
      statusHistory: {
        create: {
          fromStatus: null,
          toStatus: "PENDING",
          changedByUserId: user.id,
          note: "Submitted",
        },
      },
    },
  });

  const treasuryStaff = await prisma.user.findMany({
    where: { orgId: org.id, role: { in: ["TREASURER", "ADMIN", "SUPER_ADMIN"] } },
    select: { email: true },
  });
  await sendReimbursementSubmittedEmail(reimbursement, treasuryStaff.map((u) => u.email));

  revalidatePath("/dashboard");
  redirect(`/reimbursements/${reimbursement.id}`);
}

"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDefaultOrg, getActiveFiscalYear } from "@/lib/org";
import { getActiveCycle } from "@/lib/cycles";
import { reimbursementFormSchema } from "@/lib/validations/reimbursement";

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

  const receiptFile = formData.get("receipt");
  const hasReceipt = receiptFile instanceof File && receiptFile.size > 0;

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
  const file = receiptFile as File;
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

  const ext = file.name.includes(".") ? file.name.split(".").pop() : undefined;
  const objectPath = `${org.id}/${user.id}/${randomUUID()}${ext ? `.${ext}` : ""}`;

  const admin = createAdminClient();
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await admin.storage
    .from(process.env.SUPABASE_RECEIPTS_BUCKET || "receipts")
    .upload(objectPath, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Receipt upload failed:", uploadError);
    return {
      values: rawValues,
      formError:
        process.env.NODE_ENV === "production"
          ? "Failed to upload the receipt. Please try again."
          : `Failed to upload the receipt: ${uploadError.message}`,
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
      receiptPath: objectPath,
      receiptName: file.name,
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

  revalidatePath("/dashboard");
  redirect(`/reimbursements/${reimbursement.id}`);
}

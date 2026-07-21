"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { success: true } | { success: false; error: string };

function revalidateReimbursementPaths(reimbursementId: string) {
  revalidatePath(`/reimbursements/${reimbursementId}`);
  revalidatePath("/dashboard");
  revalidatePath(`/admin/reimbursements/${reimbursementId}`);
  revalidatePath("/admin/reimbursements");
  revalidatePath("/admin");
}

export async function respondToNeedsInfo(
  reimbursementId: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const reimbursement = await prisma.reimbursement.findUnique({
    where: { id: reimbursementId },
    select: { submitterUserId: true, status: true, orgId: true },
  });
  if (!reimbursement || reimbursement.submitterUserId !== user.id) {
    return { success: false, error: "Reimbursement not found." };
  }
  if (reimbursement.status !== "NEEDS_INFO") {
    return { success: false, error: "This reimbursement isn't awaiting more info." };
  }

  const note = String(formData.get("note") ?? "").trim();
  if (!note) {
    return { success: false, error: "Please write a response before submitting." };
  }

  const attachmentFile = formData.get("receipt");
  const hasAttachment = attachmentFile instanceof File && attachmentFile.size > 0;

  let attachmentPath: string | undefined;
  let attachmentName: string | undefined;

  if (hasAttachment) {
    const file = attachmentFile as File;
    const ext = file.name.includes(".") ? file.name.split(".").pop() : undefined;
    const objectPath = `${reimbursement.orgId}/${user.id}/${randomUUID()}${ext ? `.${ext}` : ""}`;

    const admin = createAdminClient();
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from(process.env.SUPABASE_RECEIPTS_BUCKET || "receipts")
      .upload(objectPath, Buffer.from(arrayBuffer), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Attachment upload failed:", uploadError);
      return { success: false, error: "Failed to upload the file. Please try again." };
    }

    attachmentPath = objectPath;
    attachmentName = file.name;
  }

  // The original receipt is left untouched — the response's file (if any)
  // is attached to this specific history entry instead, so nothing is
  // silently overwritten and admins can see exactly what came with each reply.
  await prisma.$transaction([
    prisma.reimbursement.update({
      where: { id: reimbursementId },
      data: { status: "PENDING" },
    }),
    prisma.reimbursementStatusHistory.create({
      data: {
        reimbursementId,
        fromStatus: "NEEDS_INFO",
        toStatus: "PENDING",
        changedByUserId: user.id,
        note,
        attachmentPath,
        attachmentName,
      },
    }),
  ]);

  revalidateReimbursementPaths(reimbursementId);
  return { success: true };
}

export async function withdrawReimbursement(reimbursementId: string): Promise<ActionResult> {
  const user = await requireUser();

  const reimbursement = await prisma.reimbursement.findUnique({
    where: { id: reimbursementId },
    select: { submitterUserId: true, status: true },
  });
  if (!reimbursement || reimbursement.submitterUserId !== user.id) {
    return { success: false, error: "Reimbursement not found." };
  }
  if (reimbursement.status !== "PENDING" && reimbursement.status !== "NEEDS_INFO") {
    return {
      success: false,
      error: "This reimbursement has already been reviewed and can no longer be withdrawn.",
    };
  }

  await prisma.$transaction([
    prisma.reimbursement.update({
      where: { id: reimbursementId },
      data: { status: "WITHDRAWN" },
    }),
    prisma.reimbursementStatusHistory.create({
      data: {
        reimbursementId,
        fromStatus: reimbursement.status,
        toStatus: "WITHDRAWN",
        changedByUserId: user.id,
        note: "Withdrawn by submitter",
      },
    }),
  ]);

  revalidateReimbursementPaths(reimbursementId);
  return { success: true };
}

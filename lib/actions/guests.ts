"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getDefaultOrg } from "@/lib/org";
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

const resolutionSchema = z.object({
  resolution: z.string().trim().max(500).optional().or(z.literal("")),
});

/** Sets the debate's resolution/topic — free text, shown on the guest
 * expense export sheets alongside the auto-computed expense breakdown. */
export async function updateGuestResolution(
  guestId: string,
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = resolutionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.guest.update({
    where: { id: guestId },
    data: { resolution: parsed.data.resolution || null },
  });

  revalidatePath(`/admin/guests/${guestId}`);
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

/** Links an already-existing reimbursement (submitted normally, or added any
 * other way) to a guest, straight from the guest's own page — no restriction
 * on its purchase date relative to the guest's debate date, since an expense
 * for a guest's visit (travel booked weeks ahead, a bill settled weeks after)
 * routinely falls outside that single day. Re-linking (moving an expense off
 * whatever guest it's currently attached to, if any) is allowed. */
export async function associateExpenseToGuest(
  guestId: string,
  reimbursementId: string,
): Promise<ActionResult> {
  await requireAdmin();
  const org = await getDefaultOrg();

  const [guest, reimbursement] = await Promise.all([
    prisma.guest.findUnique({ where: { id: guestId } }),
    prisma.reimbursement.findUnique({ where: { id: reimbursementId } }),
  ]);
  if (!guest || guest.orgId !== org.id) return { success: false, error: "Guest not found." };
  if (!reimbursement || reimbursement.orgId !== org.id) {
    return { success: false, error: "Reimbursement not found." };
  }

  await prisma.reimbursement.update({ where: { id: reimbursementId }, data: { guestId } });

  revalidatePath(`/admin/guests/${guestId}`);
  revalidatePath("/admin/guests");
  revalidatePath(`/admin/reimbursements/${reimbursementId}`);
  revalidatePath("/admin/reimbursements");
  return { success: true };
}

/** Removes an expense's link to this guest (doesn't touch the reimbursement
 * itself — just un-attaches it). */
export async function dissociateExpenseFromGuest(reimbursementId: string): Promise<ActionResult> {
  await requireAdmin();

  await prisma.reimbursement.update({ where: { id: reimbursementId }, data: { guestId: null } });

  revalidatePath("/admin/guests");
  revalidatePath(`/admin/reimbursements/${reimbursementId}`);
  revalidatePath("/admin/reimbursements");
  return { success: true };
}

export async function deleteGuest(guestId: string): Promise<ActionResult> {
  await requireAdmin();

  await prisma.guest.delete({ where: { id: guestId } }).catch(() => null);

  revalidatePath("/admin/guests");
  return { success: true };
}

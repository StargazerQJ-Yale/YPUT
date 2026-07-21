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

export async function deleteGuest(guestId: string): Promise<ActionResult> {
  await requireAdmin();

  await prisma.guest.delete({ where: { id: guestId } }).catch(() => null);

  revalidatePath("/admin/guests");
  return { success: true };
}

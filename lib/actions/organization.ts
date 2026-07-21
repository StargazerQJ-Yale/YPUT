"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { getDefaultOrg } from "@/lib/org";

export type ActionResult = { success: true } | { success: false; error: string };

export async function updateShowMemberNamesOnPublicLedger(show: boolean): Promise<ActionResult> {
  await requireSuperAdmin();
  const org = await getDefaultOrg();

  await prisma.organization.update({
    where: { id: org.id },
    data: { showMemberNamesOnPublicLedger: show },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/ledger");
  return { success: true };
}

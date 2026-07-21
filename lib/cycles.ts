import "server-only";

import { prisma } from "@/lib/prisma";

/** The reimbursement cycle whose date range contains `at` (defaults to now). */
export async function getActiveCycle(orgId: string, at: Date = new Date()) {
  return prisma.reimbursementCycle.findFirst({
    where: { orgId, startDate: { lte: at }, endDate: { gte: at } },
    orderBy: { startDate: "desc" },
  });
}

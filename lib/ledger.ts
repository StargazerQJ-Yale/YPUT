import "server-only";

import { prisma } from "@/lib/prisma";

/** Every automatically-recorded ledger transaction for a fiscal year, newest
 * first — the single query both the admin and public ledger pages (and the
 * ledger export) all need, just with different fields picked from the result. */
export async function getLedgerTransactions(orgId: string, fiscalYearId: string, take = 500) {
  return prisma.ledgerTransaction.findMany({
    where: { orgId, budgetItem: { budgetArea: { fiscalYearId } } },
    orderBy: { occurredAt: "desc" },
    include: {
      budgetItem: { include: { budgetArea: true } },
      reimbursement: { select: { id: true, fullName: true, description: true, eventName: true } },
    },
    take,
  });
}

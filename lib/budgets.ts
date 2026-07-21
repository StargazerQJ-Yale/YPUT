import "server-only";

import { prisma } from "@/lib/prisma";

export type BudgetItemSummary = {
  id: string;
  name: string;
  budgetedAmount: number;
  used: number;
  remaining: number;
  percentUsed: number;
};

export type BudgetAreaSummary = {
  id: string;
  name: string;
  budgetedAmount: number;
  used: number;
  remaining: number;
  percentUsed: number;
  items: BudgetItemSummary[];
};

function withDerived(id: string, name: string, budgetedAmount: number, used: number) {
  return {
    id,
    name,
    budgetedAmount,
    used,
    remaining: budgetedAmount - used,
    percentUsed: budgetedAmount > 0 ? (used / budgetedAmount) * 100 : 0,
  };
}

/** Per-area/per-item Used/Remaining/%Used for a fiscal year, driven by the
 * automatic ledger (LedgerTransaction rows, written when a reimbursement is
 * marked PAID) rather than by re-deriving it from Reimbursement statuses. */
export async function getBudgetSummary(fiscalYearId: string): Promise<BudgetAreaSummary[]> {
  const areas = await prisma.budgetArea.findMany({
    where: { fiscalYearId },
    orderBy: { name: "asc" },
    include: { budgetItems: { orderBy: { name: "asc" } } },
  });

  const usedByItem = await prisma.ledgerTransaction.groupBy({
    by: ["budgetItemId"],
    where: { budgetItem: { budgetArea: { fiscalYearId } } },
    _sum: { amount: true },
  });
  const usedMap = new Map(usedByItem.map((row) => [row.budgetItemId, Number(row._sum.amount ?? 0)]));

  return areas.map((area) => {
    const items = area.budgetItems.map((item) =>
      withDerived(item.id, item.name, Number(item.budgetedAmount), usedMap.get(item.id) ?? 0),
    );
    const budgetedAmount = items.reduce((sum, item) => sum + item.budgetedAmount, 0);
    const used = items.reduce((sum, item) => sum + item.used, 0);
    return { ...withDerived(area.id, area.name, budgetedAmount, used), items };
  });
}

/** Total money the org has actually received this fiscal year — the sum of
 * all FundDeposit rows, mirroring how budget "Used" is summed from the
 * ledger. This is the org's real income, separate from how it's allocated
 * across budget categories (which can add up to more or less than this). */
export async function getTotalFund(fiscalYearId: string): Promise<number> {
  const result = await prisma.fundDeposit.aggregate({
    where: { fiscalYearId },
    _sum: { amount: true },
  });
  return Number(result._sum.amount ?? 0);
}

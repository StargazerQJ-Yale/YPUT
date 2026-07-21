import "server-only";

import { prisma } from "@/lib/prisma";

export type MonthlySpendingPoint = { month: string; amount: number };

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

/** One point per month across the fiscal year (including $0 months, for a
 * continuous chart), summed from the automatic ledger. */
export async function getMonthlySpending(fiscalYear: {
  id: string;
  startDate: Date;
  endDate: Date;
}): Promise<MonthlySpendingPoint[]> {
  const transactions = await prisma.ledgerTransaction.findMany({
    where: { budgetItem: { budgetArea: { fiscalYearId: fiscalYear.id } } },
    select: { amount: true, occurredAt: true },
  });

  const totalsByMonth = new Map<string, number>();
  for (const t of transactions) {
    const key = monthKey(t.occurredAt);
    totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + Number(t.amount));
  }

  const points: MonthlySpendingPoint[] = [];
  const cursor = new Date(fiscalYear.startDate.getFullYear(), fiscalYear.startDate.getMonth(), 1);
  const end = new Date(fiscalYear.endDate.getFullYear(), fiscalYear.endDate.getMonth(), 1);
  while (cursor <= end) {
    points.push({ month: monthLabel(cursor), amount: totalsByMonth.get(monthKey(cursor)) ?? 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return points;
}

export type LargestExpense = {
  id: string;
  description: string;
  eventName: string | null;
  budgetAreaName: string;
  amount: number;
  purchaseDate: Date;
};

export async function getLargestExpenses(fiscalYearId: string, limit = 5): Promise<LargestExpense[]> {
  const reimbursements = await prisma.reimbursement.findMany({
    where: { fiscalYearId, status: "PAID" },
    orderBy: { amount: "desc" },
    take: limit,
    include: { budgetArea: { select: { name: true } } },
  });

  return reimbursements.map((r) => ({
    id: r.id,
    description: r.description,
    eventName: r.eventName,
    budgetAreaName: r.budgetArea.name,
    amount: Number(r.amount),
    purchaseDate: r.purchaseDate,
  }));
}

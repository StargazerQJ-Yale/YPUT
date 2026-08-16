import "server-only";

import { prisma } from "@/lib/prisma";

/** Every ledger transaction for a fiscal year, newest first — the single
 * query the admin and public ledger pages (and the ledger export) all need,
 * just with different fields picked from the result. Most rows come from a
 * paid reimbursement (`reimbursement` set); manual entries (money that never
 * went through a submission) have `reimbursement: null` and use their own
 * `description`/`recordedBy` instead.
 *
 * `recordedBy` is fetched as a full User for admin-side identity redaction
 * (see lib/identity.ts) — the public ledger page must never render it. */
export async function getLedgerTransactions(orgId: string, fiscalYearId: string, take = 500) {
  return prisma.ledgerTransaction.findMany({
    where: { orgId, budgetItem: { budgetArea: { fiscalYearId } } },
    orderBy: { occurredAt: "desc" },
    include: {
      budgetItem: { include: { budgetArea: true } },
      reimbursement: {
        select: { id: true, fullName: true, description: true, eventName: true, purchaseDate: true },
      },
      recordedBy: true,
    },
    take,
  });
}

export type LedgerTransactionWithRelations = Awaited<ReturnType<typeof getLedgerTransactions>>[number];

export type WeeklyLedgerGroup = {
  weekStart: Date;
  weekEnd: Date;
  transactions: LedgerTransactionWithRelations[];
  total: number;
};

/** The most recent Tuesday on/before `date` — the org's debates (and so its
 * expenses) run on a Tuesday-to-Tuesday cadence. */
function getWeekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const TUESDAY = 2;
  const diff = (d.getUTCDay() - TUESDAY + 7) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

/** Groups ledger transactions into Tuesday-to-Tuesday weeks, keyed by when
 * the money was actually spent — a reimbursement's purchaseDate (as the
 * submitter reported it), or a manual entry's occurredAt when there's no
 * reimbursement to pull that from. Newest week first. */
export function groupTransactionsByWeek(
  transactions: LedgerTransactionWithRelations[],
): WeeklyLedgerGroup[] {
  const groups = new Map<number, WeeklyLedgerGroup>();

  for (const t of transactions) {
    const spentDate = t.reimbursement?.purchaseDate ?? t.occurredAt;
    const weekStart = getWeekStart(spentDate);
    const key = weekStart.getTime();

    let group = groups.get(key);
    if (!group) {
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
      group = { weekStart, weekEnd, transactions: [], total: 0 };
      groups.set(key, group);
    }
    group.transactions.push(t);
    group.total += Number(t.amount);
  }

  return Array.from(groups.values()).sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
}

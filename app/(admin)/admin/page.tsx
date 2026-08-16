import Link from "next/link";
import { Clock, CheckCircle2, Banknote, XCircle, Wallet, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getDefaultOrg, getActiveFiscalYear } from "@/lib/org";
import { getTotalFund } from "@/lib/budgets";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const org = await getDefaultOrg();
  const fiscalYear = await getActiveFiscalYear();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    pendingCount,
    approvedCount,
    paidCount,
    rejectedCount,
    pendingSum,
    paidThisMonthSum,
    totalFund,
    paidSumThisFiscalYear,
    recent,
  ] = await Promise.all([
    prisma.reimbursement.count({ where: { orgId: org.id, status: "PENDING" } }),
    prisma.reimbursement.count({ where: { orgId: org.id, status: "APPROVED" } }),
    prisma.reimbursement.count({ where: { orgId: org.id, status: "PAID" } }),
    prisma.reimbursement.count({ where: { orgId: org.id, status: "REJECTED" } }),
    prisma.reimbursement.aggregate({
      where: { orgId: org.id, status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.reimbursement.aggregate({
      where: {
        orgId: org.id,
        status: "PAID",
        payment: { paidDate: { gte: monthStart } },
      },
      _sum: { amount: true },
    }),
    getTotalFund(fiscalYear.id),
    prisma.reimbursement.aggregate({
      where: { orgId: org.id, fiscalYearId: fiscalYear.id, status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.reimbursement.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { budgetArea: true },
    }),
  ]);

  // Against actual funds received this fiscal year, not the sum allocated
  // across budget categories — the org's real cash position.
  const remainingBudget = totalFund - Number(paidSumThisFiscalYear._sum.amount ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Treasury Overview</h1>
        <p className="text-sm text-muted-foreground">Fiscal year {fiscalYear.label}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending" value={String(pendingCount)} icon={Clock} tone="warning" />
        <StatCard label="Approved" value={String(approvedCount)} icon={CheckCircle2} />
        <StatCard label="Paid" value={String(paidCount)} icon={Banknote} tone="positive" />
        <StatCard label="Rejected" value={String(rejectedCount)} icon={XCircle} tone="negative" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Pending Amount"
          value={formatCurrency(pendingSum._sum.amount ?? 0)}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Spent This Month"
          value={formatCurrency(paidThisMonthSum._sum.amount ?? 0)}
          icon={TrendingDown}
        />
        <StatCard
          label="Remaining Annual Budget"
          value={formatCurrency(remainingBudget)}
          icon={Wallet}
          tone={remainingBudget < 0 ? "negative" : "positive"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {recent.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No reimbursements yet.</p>
          )}
          {recent.map((r) => (
            <Link
              key={r.id}
              href={`/admin/reimbursements/${r.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-2.5 -mx-3 hover:bg-muted/60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {r.budgetArea.name} · {formatDate(r.purchaseDate)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium tabular-nums">{formatCurrency(r.amount)}</span>
                <StatusBadge status={r.status} />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

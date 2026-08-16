import Link from "next/link";
import { Clock, Wallet, TrendingDown, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/admin/stat-card";
import { BudgetMeter } from "@/components/admin/budget-meter";
import { ChartCard } from "@/components/admin/chart-card";
import { MonthlySpendingChart } from "@/components/admin/monthly-spending-chart";
import { SpendingByCategoryChart } from "@/components/admin/spending-by-category-chart";
import { ExportMenu } from "@/components/admin/export-menu";
import { requireAdmin } from "@/lib/auth";
import { getDefaultOrg, getActiveFiscalYear } from "@/lib/org";
import { getBudgetSummary, getTotalFund } from "@/lib/budgets";
import { getMonthlySpending, getLargestExpenses } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function AnalyticsPage() {
  await requireAdmin();
  const org = await getDefaultOrg();
  const fiscalYear = await getActiveFiscalYear();

  const [budgetSummary, totalFund, monthlySpending, largestExpenses, pendingAgg] = await Promise.all([
    getBudgetSummary(fiscalYear.id),
    getTotalFund(fiscalYear.id),
    getMonthlySpending(fiscalYear),
    getLargestExpenses(fiscalYear.id, 5),
    prisma.reimbursement.aggregate({
      where: { orgId: org.id, status: "PENDING" },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalUsed = budgetSummary.reduce((sum, area) => sum + area.used, 0);
  const remaining = totalFund - totalUsed;
  const spendingByCategory = budgetSummary.map((area) => ({ name: area.name, used: area.used }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Fiscal year {fiscalYear.label}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportMenu href="/api/exports/monthly" label="Export Monthly Report" />
          <ExportMenu href="/api/exports/annual" label="Export Annual Report" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Remaining Annual Budget"
          value={formatCurrency(remaining)}
          icon={Wallet}
          tone={remaining < 0 ? "negative" : "positive"}
        />
        <StatCard label="Total Fund" value={formatCurrency(totalFund)} icon={Wallet} />
        <StatCard label="Total Spent" value={formatCurrency(totalUsed)} icon={TrendingDown} />
        <StatCard
          label="Pending Reimbursements"
          value={`${pendingAgg._count} · ${formatCurrency(pendingAgg._sum.amount ?? 0)}`}
          icon={Clock}
          tone="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly Spending">
          <MonthlySpendingChart data={monthlySpending} />
        </ChartCard>
        <ChartCard title="Spending by Category">
          <SpendingByCategoryChart data={spendingByCategory} />
        </ChartCard>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Largest Expenses</h2>
          </div>
          {largestExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No paid reimbursements yet.</p>
          ) : (
            <div className="divide-y">
              {largestExpenses.map((expense) => (
                <Link
                  key={expense.id}
                  href={`/admin/reimbursements/${expense.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {expense.eventName || expense.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {expense.budgetAreaName} · {formatDate(expense.purchaseDate)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {formatCurrency(expense.amount)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-base font-semibold">Budget Utilization</h2>
          <div className="space-y-4">
            {budgetSummary.flatMap((area) =>
              area.items.map((item) => (
                <div key={item.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>
                      {area.name} · {item.name}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatCurrency(item.used)} / {formatCurrency(item.budgetedAmount)}
                    </span>
                  </div>
                  <BudgetMeter percentUsed={item.percentUsed} />
                </div>
              )),
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

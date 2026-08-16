import { Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { BudgetAreaForm } from "@/components/admin/budget-area-form";
import { BudgetItemForm } from "@/components/admin/budget-item-form";
import { BudgetMeter } from "@/components/admin/budget-meter";
import { DeleteBudgetAreaButton } from "@/components/admin/delete-budget-area-button";
import { DeleteBudgetItemButton } from "@/components/admin/delete-budget-item-button";
import { EditBudgetAreaDialog } from "@/components/admin/edit-budget-area-dialog";
import { EditBudgetItemDialog } from "@/components/admin/edit-budget-item-dialog";
import { FundDepositForm } from "@/components/admin/fund-deposit-form";
import { DeleteFundDepositButton } from "@/components/admin/delete-fund-deposit-button";
import { MarkDepositReceivedButton } from "@/components/admin/mark-deposit-received-button";
import { FundDepositStatusBadge } from "@/components/admin/fund-deposit-status-badge";
import { ExportMenu } from "@/components/admin/export-menu";
import { requireAdminAreaAccess } from "@/lib/auth";
import { getDefaultOrg, getActiveFiscalYear } from "@/lib/org";
import { getBudgetSummary, getTotalFund, getPromisedFundTotal } from "@/lib/budgets";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";

export default async function BudgetsPage() {
  const viewer = await requireAdminAreaAccess();
  const canEdit = viewer.role !== "EBOARD";
  const org = await getDefaultOrg();
  const fiscalYear = await getActiveFiscalYear();

  const [budgetAreasList, budgetSummary, totalFund, promisedFund, fundDeposits] = await Promise.all([
    prisma.budgetArea.findMany({
      where: { orgId: org.id, fiscalYearId: fiscalYear.id },
      orderBy: { name: "asc" },
      include: { budgetItems: { orderBy: { name: "asc" } } },
    }),
    getBudgetSummary(fiscalYear.id),
    getTotalFund(fiscalYear.id),
    getPromisedFundTotal(fiscalYear.id),
    prisma.fundDeposit.findMany({
      where: { orgId: org.id, fiscalYearId: fiscalYear.id },
      orderBy: { depositDate: "desc" },
    }),
  ]);
  const summaryByAreaId = new Map(budgetSummary.map((area) => [area.id, area]));

  const totalBudgeted = budgetSummary.reduce((sum, area) => sum + area.budgetedAmount, 0);
  const totalUsed = budgetSummary.reduce((sum, area) => sum + area.used, 0);
  // "Remaining" is against actual funds received, not the sum allocated
  // across categories — the org's real cash position, since fund comes in
  // over the year and categories can be allocated more or less than that.
  const totalRemaining = totalFund - totalUsed;
  const totalPercentUsed = totalFund > 0 ? (totalUsed / totalFund) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground">Fiscal year {fiscalYear.label}</p>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <ExportMenu href="/api/exports/budgets" label="Export Report" />
          <div className="flex flex-wrap gap-6 text-right">
            <div>
              <p className="text-xs text-muted-foreground">Total Fund</p>
              <p className="text-xl font-semibold tabular-nums">{formatCurrency(totalFund)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Promised (not arrived)</p>
              <p className="text-xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                {formatCurrency(promisedFund)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Allocated</p>
              <p className="text-xl font-semibold tabular-nums">{formatCurrency(totalBudgeted)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Used</p>
              <p className="text-xl font-semibold tabular-nums">{formatCurrency(totalUsed)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-xl font-semibold tabular-nums">{formatCurrency(totalRemaining)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm">
        <BudgetMeter percentUsed={totalPercentUsed} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fund Deposits</CardTitle>
          <p className="text-sm text-muted-foreground">
            Record money as it comes in over the year — the total fund above is the sum of these.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {canEdit && <FundDepositForm />}
          {fundDeposits.length > 0 && (
            <div className="divide-y border-t pt-2">
              {fundDeposits.map((deposit) => (
                <div key={deposit.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{deposit.source}</p>
                      <FundDepositStatusBadge status={deposit.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(deposit.depositDate)}
                      {deposit.promisedBy ? ` · Promised by ${deposit.promisedBy}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(deposit.amount)}
                    </span>
                    {canEdit && (
                      <>
                        {deposit.status === "PROMISED" && (
                          <MarkDepositReceivedButton depositId={deposit.id} />
                        )}
                        <DeleteFundDepositButton depositId={deposit.id} source={deposit.source} />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Budget Area</CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetAreaForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Budget Category</CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetItemForm budgetAreas={budgetAreasList.map((a) => ({ id: a.id, name: a.name }))} />
            </CardContent>
          </Card>
        </>
      )}

      {budgetAreasList.length === 0 ? (
        <EmptyState icon={Wallet} title="No budget areas yet" description="Add one above to get started." />
      ) : (
        <div className="space-y-4">
          {budgetAreasList.map((area) => {
            const areaSummary = summaryByAreaId.get(area.id);
            const itemSummaryById = new Map(areaSummary?.items.map((item) => [item.id, item]));

            return (
              <Card key={area.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">{area.name}</CardTitle>
                    {areaSummary && areaSummary.budgetedAmount > 0 && (
                      <div className="mt-2 max-w-xs">
                        <BudgetMeter percentUsed={areaSummary.percentUsed} />
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex shrink-0 items-center gap-1">
                      <EditBudgetAreaDialog budgetAreaId={area.id} currentName={area.name} />
                      <DeleteBudgetAreaButton budgetAreaId={area.id} name={area.name} />
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {area.budgetItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No categories yet.</p>
                  ) : (
                    <div className="divide-y">
                      {area.budgetItems.map((item) => {
                        const itemSummary = itemSummaryById.get(item.id);
                        return (
                          <div key={item.id} className="flex items-center justify-between gap-4 py-2.5">
                            <div className="min-w-0 flex-1">
                              <span className="text-sm">{item.name}</span>
                              {itemSummary && (
                                <div className="mt-1.5 max-w-48">
                                  <BudgetMeter percentUsed={itemSummary.percentUsed} />
                                </div>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-4">
                              <div className="text-right text-xs">
                                <p className="font-medium tabular-nums">
                                  {formatCurrency(itemSummary?.used ?? 0)}{" "}
                                  <span className="text-muted-foreground">
                                    of {formatCurrency(item.budgetedAmount)}
                                  </span>
                                </p>
                                <p className="text-muted-foreground tabular-nums">
                                  {formatCurrency(itemSummary?.remaining ?? item.budgetedAmount)} left
                                </p>
                              </div>
                              {canEdit && (
                                <>
                                  <EditBudgetItemDialog
                                    budgetItemId={item.id}
                                    currentName={item.name}
                                    currentBudgetedAmount={Number(item.budgetedAmount)}
                                    currentBudgetAreaId={area.id}
                                    budgetAreas={budgetAreasList.map((a) => ({ id: a.id, name: a.name }))}
                                  />
                                  <DeleteBudgetItemButton budgetItemId={item.id} name={item.name} />
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

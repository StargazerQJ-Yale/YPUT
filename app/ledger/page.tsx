import { Landmark, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetMeter } from "@/components/admin/budget-meter";
import { getDefaultOrg, getActiveFiscalYear } from "@/lib/org";
import { getBudgetSummary } from "@/lib/budgets";
import { getLedgerTransactions } from "@/lib/ledger";
import { formatCurrency, formatDate } from "@/lib/format";

export const metadata = {
  title: "Public Ledger",
  description: "Transparent budget and spending record.",
};

export default async function PublicLedgerPage() {
  const org = await getDefaultOrg();
  const fiscalYear = await getActiveFiscalYear();

  const [budgetSummary, transactions] = await Promise.all([
    getBudgetSummary(fiscalYear.id),
    getLedgerTransactions(org.id, fiscalYear.id),
  ]);

  const transactionsByItemId = new Map<string, typeof transactions>();
  for (const t of transactions) {
    const list = transactionsByItemId.get(t.budgetItemId) ?? [];
    list.push(t);
    transactionsByItemId.set(t.budgetItemId, list);
  }

  const totalBudgeted = budgetSummary.reduce((sum, area) => sum + area.budgetedAmount, 0);
  const totalUsed = budgetSummary.reduce((sum, area) => sum + area.used, 0);

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-4 py-10 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Landmark className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
          <p className="text-sm text-muted-foreground">Public Finance Ledger — Fiscal Year {fiscalYear.label}</p>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 py-2 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Budgeted</p>
            <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalBudgeted)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Used</p>
            <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalUsed)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="text-lg font-semibold tabular-nums">{formatCurrency(totalBudgeted - totalUsed)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Transactions</p>
            <p className="text-lg font-semibold tabular-nums">{transactions.length}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {budgetSummary.map((area) => (
          <Card key={area.id}>
            <CardHeader>
              <CardTitle className="text-base">{area.name}</CardTitle>
              {area.budgetedAmount > 0 && (
                <div className="mt-2 max-w-xs">
                  <BudgetMeter percentUsed={area.percentUsed} />
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-1">
              {area.items.map((item) => {
                const itemTransactions = transactionsByItemId.get(item.id) ?? [];
                return (
                  <details key={item.id} className="group rounded-lg border px-3 py-2 open:pb-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="tabular-nums">
                          {formatCurrency(item.used)} of {formatCurrency(item.budgetedAmount)}
                        </span>
                        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
                      </div>
                    </summary>
                    {itemTransactions.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">No transactions yet.</p>
                    ) : (
                      <div className="mt-2 divide-y border-t">
                        {itemTransactions.map((t) => (
                          <div key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                            <div className="min-w-0">
                              <p className="truncate">
                                {t.reimbursement
                                  ? t.reimbursement.eventName || t.reimbursement.description
                                  : t.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(t.occurredAt)}
                                {t.reimbursement && org.showMemberNamesOnPublicLedger
                                  ? ` · ${t.reimbursement.fullName}`
                                  : ""}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                              <span className="font-medium tabular-nums">{formatCurrency(t.amount)}</span>
                              <span className="text-xs text-muted-foreground">Paid</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </details>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

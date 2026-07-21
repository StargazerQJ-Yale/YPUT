import { requireAdmin } from "@/lib/auth";
import { getDefaultOrg, getActiveFiscalYear } from "@/lib/org";
import { getBudgetSummary, getTotalFund } from "@/lib/budgets";
import { getLargestExpenses } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { buildExportResponse } from "@/lib/exports/response";
import { formatCurrency, formatDate } from "@/lib/format";

export async function GET(request: Request) {
  await requireAdmin();

  const org = await getDefaultOrg();
  const fiscalYear = await getActiveFiscalYear();

  const [areas, totalFund, largestExpenses, pendingAgg] = await Promise.all([
    getBudgetSummary(fiscalYear.id),
    getTotalFund(fiscalYear.id),
    getLargestExpenses(fiscalYear.id, 10),
    prisma.reimbursement.aggregate({
      where: { orgId: org.id, status: "PENDING" },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalBudgeted = areas.reduce((sum, area) => sum + area.budgetedAmount, 0);
  const totalUsed = areas.reduce((sum, area) => sum + area.used, 0);
  const remaining = totalFund - totalUsed;
  const pendingAmount = Number(pendingAgg._sum.amount ?? 0);

  const budgetHeaders = ["Budget Area", "Category", "Budgeted", "Used", "Remaining", "% Used"];
  const budgetRows: (string | number)[][] = [];
  const budgetPdfRows: (string | number)[][] = [];
  for (const area of areas) {
    for (const item of area.items) {
      budgetRows.push([area.name, item.name, item.budgetedAmount, item.used, item.remaining, item.percentUsed.toFixed(0)]);
      budgetPdfRows.push([
        area.name,
        item.name,
        formatCurrency(item.budgetedAmount),
        formatCurrency(item.used),
        formatCurrency(item.remaining),
        `${item.percentUsed.toFixed(0)}%`,
      ]);
    }
  }

  const expenseHeaders = ["Date", "Budget Area", "Description", "Amount"];
  const expenseRows = largestExpenses.map((e) => [
    formatDate(e.purchaseDate),
    e.budgetAreaName,
    e.eventName || e.description,
    e.amount,
  ]);
  const expensePdfRows = largestExpenses.map((e) => [
    formatDate(e.purchaseDate),
    e.budgetAreaName,
    e.eventName || e.description,
    formatCurrency(e.amount),
  ]);

  const summaryPairs: [string, string | number][] = [
    ["Total Fund", totalFund],
    ["Total Budgeted", totalBudgeted],
    ["Total Used", totalUsed],
    ["Remaining", remaining],
    ["Pending Reimbursements", pendingAgg._count],
    ["Pending Amount", pendingAmount],
  ];

  const format = new URL(request.url).searchParams.get("format");

  return buildExportResponse(format, `annual-report-${fiscalYear.label}`, {
    // CSV can't represent a multi-section document — the budget breakdown
    // table is the most useful single table for a spreadsheet import.
    csv: { headers: budgetHeaders, rows: budgetRows },
    excelSheets: [
      { name: "Summary", headers: ["Metric", "Value"], rows: summaryPairs },
      { name: "Budget Breakdown", headers: budgetHeaders, rows: budgetRows },
      { name: "Largest Expenses", headers: expenseHeaders, rows: expenseRows },
    ],
    pdf: {
      orgName: org.name,
      title: "Annual Report",
      subtitle: `${org.name} — Fiscal Year ${fiscalYear.label}`,
      summary: [
        { label: "Total Fund", value: formatCurrency(totalFund) },
        { label: "Total Used", value: formatCurrency(totalUsed) },
        { label: "Remaining", value: formatCurrency(remaining) },
        { label: "Pending", value: `${pendingAgg._count} · ${formatCurrency(pendingAmount)}` },
      ],
      sections: [
        { title: "Budget Breakdown", headers: budgetHeaders, rows: budgetPdfRows },
        { title: "Largest Expenses", headers: expenseHeaders, rows: expensePdfRows },
      ],
    },
  });
}

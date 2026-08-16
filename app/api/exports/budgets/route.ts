import { requireAdminAreaAccess } from "@/lib/auth";
import { getDefaultOrg, getActiveFiscalYear } from "@/lib/org";
import { getBudgetSummary } from "@/lib/budgets";
import { buildExportResponse } from "@/lib/exports/response";
import { formatCurrency } from "@/lib/format";

export async function GET(request: Request) {
  await requireAdminAreaAccess();

  const org = await getDefaultOrg();
  const fiscalYear = await getActiveFiscalYear();
  const areas = await getBudgetSummary(fiscalYear.id);

  const headers = ["Budget Area", "Category", "Budgeted", "Used", "Remaining", "% Used"];

  const csvRows: (string | number)[][] = [];
  const pdfRows: (string | number)[][] = [];
  let totalBudgeted = 0;
  let totalUsed = 0;

  for (const area of areas) {
    for (const item of area.items) {
      csvRows.push([area.name, item.name, item.budgetedAmount, item.used, item.remaining, item.percentUsed.toFixed(0)]);
      pdfRows.push([
        area.name,
        item.name,
        formatCurrency(item.budgetedAmount),
        formatCurrency(item.used),
        formatCurrency(item.remaining),
        `${item.percentUsed.toFixed(0)}%`,
      ]);
      totalBudgeted += item.budgetedAmount;
      totalUsed += item.used;
    }
  }
  const totalRow = (fmt: (n: number) => string | number) => [
    "",
    "TOTAL",
    fmt(totalBudgeted),
    fmt(totalUsed),
    fmt(totalBudgeted - totalUsed),
    totalBudgeted > 0 ? `${((totalUsed / totalBudgeted) * 100).toFixed(0)}%` : "0%",
  ];
  csvRows.push(totalRow((n) => n));
  pdfRows.push(totalRow(formatCurrency));

  const format = new URL(request.url).searchParams.get("format");

  return buildExportResponse(format, `budget-report-${fiscalYear.label}`, {
    csv: { headers, rows: csvRows },
    excelSheets: [{ name: "Budget Report", headers, rows: csvRows }],
    pdf: {
      orgName: org.name,
      title: "Budget Report",
      subtitle: `${org.name} — Fiscal Year ${fiscalYear.label}`,
      sections: [{ headers, rows: pdfRows }],
    },
  });
}

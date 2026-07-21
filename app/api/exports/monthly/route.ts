import { requireAdmin } from "@/lib/auth";
import { getDefaultOrg, getActiveFiscalYear } from "@/lib/org";
import { getMonthlySpending } from "@/lib/analytics";
import { buildExportResponse } from "@/lib/exports/response";
import { formatCurrency } from "@/lib/format";

export async function GET(request: Request) {
  await requireAdmin();

  const org = await getDefaultOrg();
  const fiscalYear = await getActiveFiscalYear();
  const points = await getMonthlySpending(fiscalYear);

  const headers = ["Month", "Amount Spent"];
  const csvRows = points.map((p) => [p.month, p.amount]);
  const pdfRows = points.map((p) => [p.month, formatCurrency(p.amount)]);

  const format = new URL(request.url).searchParams.get("format");

  return buildExportResponse(format, `monthly-report-${fiscalYear.label}`, {
    csv: { headers, rows: csvRows },
    excelSheets: [{ name: "Monthly Spending", headers, rows: csvRows }],
    pdf: {
      orgName: org.name,
      title: "Monthly Spending Report",
      subtitle: `${org.name} — Fiscal Year ${fiscalYear.label}`,
      sections: [{ headers, rows: pdfRows }],
    },
  });
}

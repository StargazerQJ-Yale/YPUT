import { requireAdminAreaAccess } from "@/lib/auth";
import { getDefaultOrg, getActiveFiscalYear } from "@/lib/org";
import { getLedgerTransactions } from "@/lib/ledger";
import { buildExportResponse } from "@/lib/exports/response";
import { formatCurrency, formatDate } from "@/lib/format";

export async function GET(request: Request) {
  await requireAdminAreaAccess();

  const org = await getDefaultOrg();
  const fiscalYear = await getActiveFiscalYear();
  const transactions = await getLedgerTransactions(org.id, fiscalYear.id);

  const headers = ["Date", "Budget Area", "Category", "Description", "Submitter", "Amount"];
  const describe = (t: (typeof transactions)[number]) =>
    t.reimbursement ? t.reimbursement.eventName || t.reimbursement.description : (t.description ?? "");
  const who = (t: (typeof transactions)[number]) => t.reimbursement?.fullName ?? "Manual entry";

  const csvRows = transactions.map((t) => [
    formatDate(t.occurredAt),
    t.budgetItem.budgetArea.name,
    t.budgetItem.name,
    describe(t),
    who(t),
    Number(t.amount),
  ]);
  const pdfRows = transactions.map((t) => [
    formatDate(t.occurredAt),
    t.budgetItem.budgetArea.name,
    t.budgetItem.name,
    describe(t),
    who(t),
    formatCurrency(t.amount),
  ]);

  const format = new URL(request.url).searchParams.get("format");

  return buildExportResponse(format, `ledger-${fiscalYear.label}`, {
    csv: { headers, rows: csvRows },
    excelSheets: [{ name: "Ledger", headers, rows: csvRows }],
    pdf: {
      orgName: org.name,
      title: "Ledger",
      subtitle: `${org.name} — Fiscal Year ${fiscalYear.label}`,
      sections: [{ headers, rows: pdfRows }],
    },
  });
}

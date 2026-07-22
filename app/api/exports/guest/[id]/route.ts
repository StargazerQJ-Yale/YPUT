import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getDefaultOrg } from "@/lib/org";
import { downloadReceiptBuffer } from "@/lib/storage";
import { buildWorkbook } from "@/lib/exports/excel";
import { formatDate } from "@/lib/format";

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "-").trim() || "file";
}

// Bundles a guest's linked expenses into a ZIP (an Excel breakdown + every
// receipt file) — the paper trail a treasurer sends along with the actual
// Yale lectureship fund application after a debate.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const org = await getDefaultOrg();

  const guest = await prisma.guest.findUnique({ where: { id } });
  if (!guest || guest.orgId !== org.id) {
    return new Response("Guest not found", { status: 404 });
  }

  const expenses = await prisma.reimbursement.findMany({
    where: { guestId: id },
    orderBy: { purchaseDate: "asc" },
    include: { budgetArea: true, budgetItem: true },
  });

  const zip = new JSZip();
  const receiptsFolder = zip.folder("receipts");

  const rows: (string | number)[][] = [];
  for (let i = 0; i < expenses.length; i++) {
    const expense = expenses[i];
    const ext = expense.receiptName.includes(".") ? expense.receiptName.split(".").pop() : "";
    const receiptFilename = `${String(i + 1).padStart(2, "0")} - ${sanitizeFilename(
      expense.eventName || expense.description,
    ).slice(0, 40)}${ext ? `.${ext}` : ""}`;

    const buffer = await downloadReceiptBuffer(expense.receiptPath);
    if (buffer) {
      receiptsFolder?.file(receiptFilename, buffer);
    }

    rows.push([
      formatDate(expense.purchaseDate),
      expense.eventName || expense.description,
      expense.budgetArea.name,
      expense.budgetItem.name,
      expense.status,
      Number(expense.amount),
      buffer ? receiptFilename : "(receipt unavailable)",
    ]);
  }

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  rows.push(["", "", "", "", "Total", total, ""]);

  const workbookBuffer = await buildWorkbook([
    {
      name: "Expenses",
      headers: [
        "Date",
        "Description",
        "Budget Area",
        "Budget Category",
        "Status",
        "Amount",
        "Receipt File",
      ],
      rows,
    },
  ]);

  const guestFileBase = sanitizeFilename(guest.name);
  zip.file(`${guestFileBase} - Expense Report.xlsx`, workbookBuffer);

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${guestFileBase}-expenses.zip"`,
    },
  });
}

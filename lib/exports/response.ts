import "server-only";

import { toCsv } from "@/lib/exports/csv";
import { buildWorkbook, type ExcelSheet } from "@/lib/exports/excel";
import { renderReportPdf, type ReportDocumentProps } from "@/lib/exports/pdf/report-document";

export async function buildExportResponse(
  format: string | null,
  filenameBase: string,
  data: {
    csv: { headers: string[]; rows: (string | number)[][] };
    excelSheets: ExcelSheet[];
    pdf: ReportDocumentProps;
  },
): Promise<Response> {
  if (format === "xlsx") {
    const buffer = await buildWorkbook(data.excelSheets);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filenameBase}.xlsx"`,
      },
    });
  }

  if (format === "pdf") {
    const buffer = await renderReportPdf(data.pdf);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filenameBase}.pdf"`,
      },
    });
  }

  const csv = toCsv(data.csv.headers, data.csv.rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
    },
  });
}

import "server-only";

import ExcelJS from "exceljs";

export type ExcelSheet = {
  name: string;
  headers: string[];
  rows: (string | number)[][];
  // 0-indexed columns that hold multi-line text (e.g. an itemized list
  // packed into one cell) — wrapped and top-aligned instead of truncated.
  wrapColumns?: number[];
};

export async function buildWorkbook(sheets: ExcelSheet[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name);
    worksheet.columns = sheet.headers.map((header) => ({
      header,
      width: Math.max(header.length + 2, 14),
    }));
    worksheet.getRow(1).font = { bold: true };
    sheet.rows.forEach((row) => {
      const addedRow = worksheet.addRow(row);
      for (const colIndex of sheet.wrapColumns ?? []) {
        addedRow.getCell(colIndex + 1).alignment = { wrapText: true, vertical: "top" };
      }
    });
    if (sheet.wrapColumns?.length) {
      for (const colIndex of sheet.wrapColumns) {
        worksheet.getColumn(colIndex + 1).width = 40;
      }
    }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

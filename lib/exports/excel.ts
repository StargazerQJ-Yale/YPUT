import "server-only";

import ExcelJS from "exceljs";

export type ExcelSheet = {
  name: string;
  headers: string[];
  rows: (string | number)[][];
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
    sheet.rows.forEach((row) => worksheet.addRow(row));
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

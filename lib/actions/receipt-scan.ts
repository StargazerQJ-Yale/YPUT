"use server";

import { requireUser } from "@/lib/auth";
import { scanReceiptImage, type ReceiptScanResult } from "@/lib/receipt-scan";
import { pdfFirstPageToPng } from "@/lib/pdf-to-image";

export type ScanReceiptResult =
  | ({ success: true } & ReceiptScanResult)
  | { success: false; error: string };

/** Manual click only (never automatic on upload), so API usage stays under
 * the member's control, matching the guest-research feature's pattern. */
export async function scanReceipt(formData: FormData): Promise<ScanReceiptResult> {
  await requireUser();

  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "No receipt file provided." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let imageBase64: string;
    let mimeType: string;

    if (file.type === "application/pdf") {
      const png = await pdfFirstPageToPng(buffer);
      imageBase64 = png.toString("base64");
      mimeType = "image/png";
    } else {
      imageBase64 = buffer.toString("base64");
      mimeType = file.type;
    }

    const result = await scanReceiptImage(imageBase64, mimeType);
    return { success: true, ...result };
  } catch (error) {
    console.error("Receipt scan failed:", error);
    return {
      success: false,
      error: "Couldn't read this receipt automatically. Please fill in the details manually.",
    };
  }
}

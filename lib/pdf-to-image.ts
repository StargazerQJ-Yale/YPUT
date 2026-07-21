import "server-only";

import { configureUnPDF, renderPageAsImage } from "unpdf";

let configured = false;

/** Renders a PDF's first page to a PNG buffer, so PDF receipts can go
 * through the same Groq vision scan as photographed/screenshotted receipts.
 * Uses @napi-rs/canvas (prebuilt native bindings) instead of the `canvas`
 * package, since `canvas` needs system Cairo libraries that are unreliable
 * to build on serverless hosts like Vercel. */
export async function pdfFirstPageToPng(pdfBuffer: Buffer): Promise<Buffer> {
  if (!configured) {
    await configureUnPDF({ pdfjs: () => import("unpdf/pdfjs") });
    configured = true;
  }

  const result = await renderPageAsImage(new Uint8Array(pdfBuffer), 1, {
    canvasImport: () => import("@napi-rs/canvas"),
    scale: 2,
  });

  return Buffer.from(result);
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = process.env.SUPABASE_RECEIPTS_BUCKET || "receipts";
const SIGNED_URL_TTL_SECONDS = 60 * 5;

/** Short-lived signed URL for previewing/downloading a private receipt object. */
export async function getSignedReceiptUrl(path: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data) return null;
  return data.signedUrl;
}

/** Downloads a receipt's raw bytes (e.g. to bundle into a ZIP export) —
 * distinct from getSignedReceiptUrl, which just hands out a link for the
 * browser to fetch directly. Returns null if the object can't be read
 * rather than throwing, so one missing/corrupt receipt doesn't fail an
 * entire export. */
export async function downloadReceiptBuffer(path: string): Promise<Buffer | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export function isImagePath(nameOrPath: string) {
  // Excludes TIFF: accepted for upload, but not natively renderable in <img>
  // by most browsers, so it's shown as a generic file link instead (like PDF).
  return /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(nameOrPath);
}

/** Resolves a signed URL for each status-history entry that has an attachment
 * (e.g. a file a member attached when responding to a Needs Info request). */
export async function withHistoryAttachmentUrls<
  T extends { attachmentPath: string | null },
>(history: T[]): Promise<(T & { attachmentUrl: string | null })[]> {
  return Promise.all(
    history.map(async (entry) => ({
      ...entry,
      attachmentUrl: entry.attachmentPath ? await getSignedReceiptUrl(entry.attachmentPath) : null,
    })),
  );
}

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

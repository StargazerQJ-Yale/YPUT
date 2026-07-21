"use server";

import { randomUUID } from "crypto";
import { requireUser } from "@/lib/auth";
import { getDefaultOrg } from "@/lib/org";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateReceiptUploadUrlResult =
  | { success: true; path: string; token: string; bucket: string }
  | { success: false; error: string };

/** Vercel Functions cap request bodies at ~4.5MB regardless of Next.js's own
 * bodySizeLimit config, so a phone-camera receipt photo routed through a
 * Server Action can 413 before it even reaches our code. This hands the
 * browser a short-lived signed upload URL/token instead, so the file bytes
 * go straight from the browser to Supabase Storage — only this tiny
 * path/token pair (not the file) ever passes through our server. */
export async function createReceiptUploadUrl(fileName: string): Promise<CreateReceiptUploadUrlResult> {
  const user = await requireUser();
  const org = await getDefaultOrg();

  const ext = fileName.includes(".") ? fileName.split(".").pop() : undefined;
  const objectPath = `${org.id}/${user.id}/${randomUUID()}${ext ? `.${ext}` : ""}`;
  const bucket = process.env.SUPABASE_RECEIPTS_BUCKET || "receipts";

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(objectPath);

  if (error || !data) {
    console.error("Failed to create signed upload URL:", error);
    return { success: false, error: "Couldn't prepare the upload. Please try again." };
  }

  return { success: true, path: data.path, token: data.token, bucket };
}

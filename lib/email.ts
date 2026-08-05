import "server-only";

import { Resend } from "resend";
import { formatCurrency } from "@/lib/format";
import type { Prisma, ReimbursementStatus } from "@/lib/generated/prisma/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const FROM = process.env.RESEND_FROM_EMAIL || "Treasury Portal <onboarding@resend.dev>";

let client: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Resend(apiKey);
  return client;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapEmail(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111827; max-width: 560px; margin: 0 auto; padding: 24px;">
    <h2 style="margin: 0 0 16px; font-size: 18px;">${title}</h2>
    ${bodyHtml}
    <p style="margin-top: 32px; font-size: 12px; color: #6b7280;">Treasury Portal — automated notification</p>
  </body>
</html>`;
}

// Never throws — a failed/unconfigured email must not break the reimbursement
// action that triggered it. Silently no-ops (with a log) if RESEND_API_KEY
// isn't set, so the app works before email is configured.
async function sendEmail(to: string | string[], subject: string, html: string) {
  const resend = getClient();
  if (!resend) {
    console.warn(`RESEND_API_KEY not set — skipping email "${subject}"`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

const STATUS_LABELS: Record<ReimbursementStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  NEEDS_INFO: "Needs Info",
  PAID: "Paid",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

type ReimbursementSummary = {
  id: string;
  fullName: string;
  amount: Prisma.Decimal | number | string;
  description: string;
  eventName: string | null;
};

/** Notifies the treasury staff (Treasurer/Admin/Super Admin) that a new
 * reimbursement needs review. */
export async function sendReimbursementSubmittedEmail(
  reimbursement: ReimbursementSummary,
  recipients: string[],
) {
  if (recipients.length === 0) return;

  const link = `${APP_URL}/admin/reimbursements/${reimbursement.id}`;
  const amount = formatCurrency(reimbursement.amount);
  const html = wrapEmail(
    "New Reimbursement Submitted",
    `<p><strong>${escapeHtml(reimbursement.fullName)}</strong> submitted a reimbursement request${
      reimbursement.eventName ? ` for "${escapeHtml(reimbursement.eventName)}"` : ""
    }.</p>
    <p>Amount: <strong>${amount}</strong></p>
    <p style="color: #4b5563;">${escapeHtml(reimbursement.description)}</p>
    <p><a href="${link}" style="color: #2563eb;">Review it in the Treasury Portal</a></p>`,
  );

  await sendEmail(recipients, `New reimbursement: ${reimbursement.fullName} — ${amount}`, html);
}

/** Notifies the submitter that their reimbursement's status changed
 * (approved/rejected/needs info/paid). */
export async function sendReimbursementStatusChangedEmail(
  reimbursement: ReimbursementSummary & { email: string },
  status: ReimbursementStatus,
  note?: string | null,
) {
  const link = `${APP_URL}/reimbursements/${reimbursement.id}`;
  const amount = formatCurrency(reimbursement.amount);
  const statusLabel = STATUS_LABELS[status];
  const html = wrapEmail(
    `Your reimbursement was marked ${statusLabel}`,
    `<p>Hi ${escapeHtml(reimbursement.fullName)},</p>
    <p>Your reimbursement request${
      reimbursement.eventName ? ` for "${escapeHtml(reimbursement.eventName)}"` : ""
    } (${amount}) is now <strong>${statusLabel}</strong>.</p>
    ${note ? `<p style="color: #4b5563;">Note: ${escapeHtml(note)}</p>` : ""}
    <p><a href="${link}" style="color: #2563eb;">View it in the Treasury Portal</a></p>`,
  );

  await sendEmail(reimbursement.email, `Reimbursement ${statusLabel.toLowerCase()} — ${amount}`, html);
}

import "server-only";

import { formatCurrency } from "@/lib/format";
import type { Prisma, ReimbursementStatus } from "@/lib/generated/prisma/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "Treasury Portal";

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
// action that triggered it. Silently no-ops (with a log) if BREVO_API_KEY or
// BREVO_SENDER_EMAIL isn't set, so the app works before email is configured.
async function sendEmail(to: string | string[], subject: string, html: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || !SENDER_EMAIL) {
    console.warn(`BREVO_API_KEY or BREVO_SENDER_EMAIL not set — skipping email "${subject}"`);
    return;
  }

  const recipients = Array.isArray(to) ? to : [to];
  if (recipients.length === 0) return;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: recipients.map((email) => ({ email })),
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      console.error(`Brevo email send failed (${response.status}):`, await response.text());
    }
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

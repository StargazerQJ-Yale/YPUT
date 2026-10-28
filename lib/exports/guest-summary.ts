import "server-only";

import { draftGuestExportNotes } from "@/lib/exports/guest-notes-ai";
import { formatDate } from "@/lib/format";

export const GUEST_SUMMARY_HEADERS = [
  "Guest",
  "Date",
  "Expenses",
  "Total",
  "Resolution",
  "Notes",
  "Notes for ST",
];

export type GuestForSummary = {
  name: string;
  debateDate: Date;
  resolution: string | null;
  reimbursements: {
    description: string;
    eventName: string | null;
    amount: number;
    status: string;
  }[];
};

/** Builds one spreadsheet row per guest: a code-computed itemized breakdown
 * and total, plus an AI-drafted "Notes" / "Notes for ST" pair (the only
 * cells that need natural-language synthesis rather than a database value). */
export async function buildGuestSummaryRow(guest: GuestForSummary): Promise<(string | number)[]> {
  const items = guest.reimbursements.map((r) => ({
    label: r.eventName || r.description,
    amount: r.amount,
    status: r.status,
  }));
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const expensesText =
    items.map((item) => `${item.label}: $${item.amount.toFixed(2)}`).join("\n") || "(none)";

  const { notes, notesForSt } = await draftGuestExportNotes(guest.name, guest.resolution, items);

  return [
    guest.name,
    formatDate(guest.debateDate),
    expensesText,
    total,
    guest.resolution ?? "",
    notes,
    notesForSt,
  ];
}

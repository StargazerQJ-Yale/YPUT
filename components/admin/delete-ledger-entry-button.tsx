"use client";

import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { deleteLedgerEntry } from "@/lib/actions/ledger";

export function DeleteLedgerEntryButton({
  entryId,
  description,
}: {
  entryId: string;
  description: string;
}) {
  return (
    <ConfirmDeleteButton
      title={`Delete "${description}"?`}
      description="This removes it from the ledger and the budget's Used total permanently. This can't be undone."
      onDelete={() => deleteLedgerEntry(entryId)}
      successMessage="Ledger entry deleted"
    />
  );
}

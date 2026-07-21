"use client";

import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { deleteFundDeposit } from "@/lib/actions/funding";

export function DeleteFundDepositButton({ depositId, source }: { depositId: string; source: string }) {
  return (
    <ConfirmDeleteButton
      title={`Delete "${source}" deposit?`}
      description="This removes it from the total fund permanently. This can't be undone."
      onDelete={() => deleteFundDeposit(depositId)}
      successMessage="Deposit deleted"
    />
  );
}

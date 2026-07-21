"use client";

import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { deleteCycle } from "@/lib/actions/cycles";

export function DeleteCycleButton({ cycleId }: { cycleId: string }) {
  return (
    <ConfirmDeleteButton
      title="Delete this cycle?"
      description="Reimbursements already assigned to this cycle will keep their history but show as unassigned going forward. This can't be undone."
      onDelete={() => deleteCycle(cycleId)}
      successMessage="Cycle deleted"
    />
  );
}

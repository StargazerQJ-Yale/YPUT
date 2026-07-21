"use client";

import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { deleteBudgetArea } from "@/lib/actions/budgets";

export function DeleteBudgetAreaButton({ budgetAreaId, name }: { budgetAreaId: string; name: string }) {
  return (
    <ConfirmDeleteButton
      title={`Delete "${name}"?`}
      description="This only works if the area has no categories or reimbursements linked to it."
      onDelete={() => deleteBudgetArea(budgetAreaId)}
      successMessage="Budget area deleted"
    />
  );
}

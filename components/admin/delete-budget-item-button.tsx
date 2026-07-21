"use client";

import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { deleteBudgetItem } from "@/lib/actions/budgets";

export function DeleteBudgetItemButton({ budgetItemId, name }: { budgetItemId: string; name: string }) {
  return (
    <ConfirmDeleteButton
      title={`Delete "${name}"?`}
      description="This only works if the category has no reimbursements linked to it."
      onDelete={() => deleteBudgetItem(budgetItemId)}
      successMessage="Budget category deleted"
    />
  );
}

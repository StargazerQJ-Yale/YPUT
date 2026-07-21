"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateBudgetItem } from "@/lib/actions/budgets";

export function EditBudgetItemDialog({
  budgetItemId,
  currentName,
  currentBudgetedAmount,
  currentBudgetAreaId,
  budgetAreas,
}: {
  budgetItemId: string;
  currentName: string;
  currentBudgetedAmount: number;
  currentBudgetAreaId: string;
  budgetAreas: { id: string; name: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(updateBudgetItem.bind(null, budgetItemId), null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Budget category updated");
      setOpen(false);
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Edit" />}>
        <Pencil className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Budget Category</DialogTitle>
          <DialogDescription>Update this category&apos;s name, amount, or area.</DialogDescription>
        </DialogHeader>
        <form id={`edit-item-${budgetItemId}`} action={formAction} className="space-y-4">
          <div>
            <Label htmlFor={`edit-item-area-${budgetItemId}`}>Budget Area</Label>
            <Select
              name="budgetAreaId"
              defaultValue={currentBudgetAreaId}
              items={budgetAreas.map((a) => ({ value: a.id, label: a.name }))}
            >
              <SelectTrigger id={`edit-item-area-${budgetItemId}`} className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {budgetAreas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={`edit-item-name-${budgetItemId}`}>Name</Label>
            <Input
              id={`edit-item-name-${budgetItemId}`}
              name="name"
              defaultValue={currentName}
              className="mt-1.5"
              required
            />
          </div>
          <div>
            <Label htmlFor={`edit-item-amount-${budgetItemId}`}>Budgeted Amount</Label>
            <Input
              id={`edit-item-amount-${budgetItemId}`}
              name="budgetedAmount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={currentBudgetedAmount}
              className="mt-1.5"
              required
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form={`edit-item-${budgetItemId}`} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

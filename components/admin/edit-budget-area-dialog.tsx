"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateBudgetArea } from "@/lib/actions/budgets";

export function EditBudgetAreaDialog({
  budgetAreaId,
  currentName,
}: {
  budgetAreaId: string;
  currentName: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(updateBudgetArea.bind(null, budgetAreaId), null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Budget area updated");
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
          <DialogTitle>Edit Budget Area</DialogTitle>
          <DialogDescription>Rename this budget area.</DialogDescription>
        </DialogHeader>
        <form id={`edit-area-${budgetAreaId}`} action={formAction}>
          <Label htmlFor={`edit-area-name-${budgetAreaId}`}>Name</Label>
          <Input
            id={`edit-area-name-${budgetAreaId}`}
            name="name"
            defaultValue={currentName}
            className="mt-1.5"
            required
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form={`edit-area-${budgetAreaId}`} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

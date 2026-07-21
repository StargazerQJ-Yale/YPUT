"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { PAYMENT_METHOD_OPTIONS } from "@/lib/validations/reimbursement";
import { updateReimbursement } from "@/lib/actions/admin-reimbursements";

type BudgetArea = {
  id: string;
  name: string;
  budgetItems: { id: string; name: string }[];
};

type CurrentValues = {
  fullName: string;
  email: string;
  amount: number;
  budgetAreaId: string;
  budgetItemId: string;
  description: string;
  eventName: string | null;
  purchaseDate: string; // yyyy-mm-dd
  paymentMethod: string;
  paymentHandle: string;
  notes: string | null;
};

export function EditReimbursementDialog({
  reimbursementId,
  current,
  budgetAreas,
}: {
  reimbursementId: string;
  current: CurrentValues;
  budgetAreas: BudgetArea[];
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedAreaId, setSelectedAreaId] = React.useState(current.budgetAreaId);
  const [state, formAction, pending] = useActionState(
    updateReimbursement.bind(null, reimbursementId),
    null,
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Reimbursement updated");
      setOpen(false);
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state]);

  const selectedArea = budgetAreas.find((a) => a.id === selectedAreaId);
  const formId = `edit-reimbursement-${reimbursementId}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Pencil className="size-4" />
        Edit
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Reimbursement</DialogTitle>
          <DialogDescription>
            Correct any field the submitter got wrong. This is logged in the approval history.
          </DialogDescription>
        </DialogHeader>
        <form id={formId} action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`${formId}-fullName`}>Full Name</Label>
              <Input
                id={`${formId}-fullName`}
                name="fullName"
                defaultValue={current.fullName}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor={`${formId}-email`}>Email</Label>
              <Input
                id={`${formId}-email`}
                name="email"
                type="email"
                defaultValue={current.email}
                className="mt-1.5"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`${formId}-amount`}>Amount</Label>
              <Input
                id={`${formId}-amount`}
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={current.amount}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor={`${formId}-purchaseDate`}>Date of Purchase</Label>
              <Input
                id={`${formId}-purchaseDate`}
                name="purchaseDate"
                type="date"
                defaultValue={current.purchaseDate}
                className="mt-1.5"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`${formId}-budgetAreaId`}>Budget Area</Label>
              <Select
                name="budgetAreaId"
                value={selectedAreaId}
                onValueChange={(value) => setSelectedAreaId(value ?? "")}
                items={budgetAreas.map((area) => ({ value: area.id, label: area.name }))}
              >
                <SelectTrigger id={`${formId}-budgetAreaId`} className="mt-1.5 w-full">
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
              <Label htmlFor={`${formId}-budgetItemId`}>Specific Budget Category</Label>
              <Select
                name="budgetItemId"
                key={selectedAreaId}
                defaultValue={current.budgetItemId}
                items={selectedArea?.budgetItems.map((item) => ({ value: item.id, label: item.name })) ?? []}
              >
                <SelectTrigger id={`${formId}-budgetItemId`} className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedArea?.budgetItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor={`${formId}-eventName`}>Event Name (optional)</Label>
            <Input
              id={`${formId}-eventName`}
              name="eventName"
              defaultValue={current.eventName ?? ""}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor={`${formId}-description`}>Description</Label>
            <Textarea
              id={`${formId}-description`}
              name="description"
              defaultValue={current.description}
              className="mt-1.5"
              rows={3}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`${formId}-paymentMethod`}>Payment Method</Label>
              <Select
                name="paymentMethod"
                defaultValue={current.paymentMethod}
                items={PAYMENT_METHOD_OPTIONS}
              >
                <SelectTrigger id={`${formId}-paymentMethod`} className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor={`${formId}-paymentHandle`}>Payment Handle</Label>
              <Input
                id={`${formId}-paymentHandle`}
                name="paymentHandle"
                defaultValue={current.paymentHandle}
                className="mt-1.5"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor={`${formId}-notes`}>Additional Notes (optional)</Label>
            <Textarea
              id={`${formId}-notes`}
              name="notes"
              defaultValue={current.notes ?? ""}
              className="mt-1.5"
              rows={2}
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

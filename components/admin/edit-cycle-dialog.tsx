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
import { updateCycle } from "@/lib/actions/cycles";

export function EditCycleDialog({
  cycleId,
  currentLabel,
  currentStartDate,
  currentEndDate,
  currentTreasurerUserId,
  treasurers,
}: {
  cycleId: string;
  currentLabel: string;
  currentStartDate: string;
  currentEndDate: string;
  currentTreasurerUserId: string;
  treasurers: { id: string; fullName: string | null; email: string }[];
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(updateCycle.bind(null, cycleId), null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Cycle updated");
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
          <DialogTitle>Edit Cycle</DialogTitle>
          <DialogDescription>
            Update this reimbursement cycle&apos;s dates, label, or treasurer.
          </DialogDescription>
        </DialogHeader>
        <form id={`edit-cycle-${cycleId}`} action={formAction} className="space-y-4">
          <div>
            <Label htmlFor={`edit-cycle-label-${cycleId}`}>Label</Label>
            <Input
              id={`edit-cycle-label-${cycleId}`}
              name="label"
              defaultValue={currentLabel}
              className="mt-1.5"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`edit-cycle-start-${cycleId}`}>Start Date</Label>
              <Input
                id={`edit-cycle-start-${cycleId}`}
                name="startDate"
                type="date"
                defaultValue={currentStartDate}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor={`edit-cycle-end-${cycleId}`}>End Date</Label>
              <Input
                id={`edit-cycle-end-${cycleId}`}
                name="endDate"
                type="date"
                defaultValue={currentEndDate}
                className="mt-1.5"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor={`edit-cycle-treasurer-${cycleId}`}>Treasurer</Label>
            <Select
              name="treasurerUserId"
              defaultValue={currentTreasurerUserId}
              items={treasurers.map((t) => ({ value: t.id, label: t.fullName ?? t.email }))}
            >
              <SelectTrigger id={`edit-cycle-treasurer-${cycleId}`} className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {treasurers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.fullName ?? t.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form={`edit-cycle-${cycleId}`} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

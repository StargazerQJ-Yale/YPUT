"use client";

import * as React from "react";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
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
import { createManualLedgerEntry } from "@/lib/actions/ledger";

type BudgetArea = {
  id: string;
  name: string;
  budgetItems: { id: string; name: string }[];
};

export function ManualLedgerEntryForm({ budgetAreas }: { budgetAreas: BudgetArea[] }) {
  const [state, formAction, pending] = useActionState(createManualLedgerEntry, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedAreaId, setSelectedAreaId] = React.useState("");

  useEffect(() => {
    if (state?.success) {
      toast.success("Ledger entry added");
      formRef.current?.reset();
      setSelectedAreaId("");
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state]);

  const selectedArea = budgetAreas.find((a) => a.id === selectedAreaId);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">
        For spending that didn&apos;t go through a reimbursement submission on the site.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="manual-ledger-area">Budget Area</Label>
          <Select
            value={selectedAreaId}
            onValueChange={(value) => setSelectedAreaId(value ?? "")}
            items={budgetAreas.map((area) => ({ value: area.id, label: area.name }))}
          >
            <SelectTrigger id="manual-ledger-area" className="mt-1.5 w-full">
              <SelectValue placeholder="Select a budget area" />
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
          <Label htmlFor="manual-ledger-item">Budget Category</Label>
          <Select
            name="budgetItemId"
            disabled={!selectedArea}
            key={selectedAreaId}
            items={selectedArea?.budgetItems.map((item) => ({ value: item.id, label: item.name })) ?? []}
          >
            <SelectTrigger id="manual-ledger-item" className="mt-1.5 w-full">
              <SelectValue placeholder={selectedArea ? "Select a category" : "Select a budget area first"} />
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="manual-ledger-amount">Amount</Label>
          <Input id="manual-ledger-amount" name="amount" type="number" step="0.01" min="0.01" className="mt-1.5" required />
        </div>
        <div>
          <Label htmlFor="manual-ledger-date">Date</Label>
          <Input
            id="manual-ledger-date"
            name="occurredAt"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="mt-1.5"
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="manual-ledger-description">Description</Label>
        <Input
          id="manual-ledger-description"
          name="description"
          placeholder="What was this for?"
          className="mt-1.5"
          required
        />
      </div>
      <Button type="submit" disabled={pending || !selectedArea} size="sm">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Add Ledger Entry
      </Button>
    </form>
  );
}

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
import { createFundDeposit } from "@/lib/actions/funding";

const STATUS_OPTIONS = [
  { value: "RECEIVED", label: "Received — already arrived" },
  { value: "PROMISED", label: "Promised — not arrived yet" },
] as const;

export function FundDepositForm() {
  const [state, formAction, pending] = useActionState(createFundDeposit, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = React.useState<"RECEIVED" | "PROMISED">("RECEIVED");

  useEffect(() => {
    if (state?.success) {
      toast.success("Deposit recorded");
      formRef.current?.reset();
      setStatus("RECEIVED");
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2 rounded-lg border p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label htmlFor="deposit-source" className="sr-only">
            Source
          </Label>
          <Input id="deposit-source" name="source" placeholder="e.g. Fall allocation" required />
        </div>
        <div>
          <Label htmlFor="deposit-promisedBy" className="sr-only">
            Promised by
          </Label>
          <Input
            id="deposit-promisedBy"
            name="promisedBy"
            placeholder="Who promised this? (optional)"
          />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <div>
          <Label htmlFor="deposit-amount" className="sr-only">
            Amount
          </Label>
          <Input
            id="deposit-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Amount $"
            required
          />
        </div>
        <div>
          <Label htmlFor="deposit-status" className="sr-only">
            Status
          </Label>
          <Select
            name="status"
            value={status}
            onValueChange={(value) => value && setStatus(value as "RECEIVED" | "PROMISED")}
            items={STATUS_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
          >
            <SelectTrigger id="deposit-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="deposit-date" className="sr-only">
            Date
          </Label>
          <Input
            id="deposit-date"
            name="depositDate"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add Deposit
        </Button>
      </div>
    </form>
  );
}

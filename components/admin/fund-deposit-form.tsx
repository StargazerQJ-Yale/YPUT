"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFundDeposit } from "@/lib/actions/funding";

export function FundDepositForm() {
  const [state, formAction, pending] = useActionState(createFundDeposit, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Deposit recorded");
      formRef.current?.reset();
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]"
    >
      <div>
        <Label htmlFor="deposit-source" className="sr-only">
          Source
        </Label>
        <Input id="deposit-source" name="source" placeholder="e.g. Fall allocation" required />
      </div>
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
    </form>
  );
}

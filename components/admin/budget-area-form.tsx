"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBudgetArea } from "@/lib/actions/budgets";

export function BudgetAreaForm() {
  const [state, formAction, pending] = useActionState(createBudgetArea, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Budget area created");
      formRef.current?.reset();
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex gap-2">
      <Input name="name" placeholder="e.g. Guest Expenses" required />
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Add Area
      </Button>
    </form>
  );
}

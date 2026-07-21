"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBudgetItem } from "@/lib/actions/budgets";

export function BudgetItemForm({ budgetAreas }: { budgetAreas: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createBudgetItem, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Budget category created");
      formRef.current?.reset();
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
      <Select
        name="budgetAreaId"
        items={budgetAreas.map((area) => ({ value: area.id, label: area.name }))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Budget area" />
        </SelectTrigger>
        <SelectContent>
          {budgetAreas.map((area) => (
            <SelectItem key={area.id} value={area.id}>
              {area.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input name="name" placeholder="e.g. Debate Travel" required />
      <Input name="budgetedAmount" type="number" step="0.01" min="0" placeholder="Budgeted $" required className="w-32" />
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Add
      </Button>
    </form>
  );
}

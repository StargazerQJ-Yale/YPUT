"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGuest, type ActionResult } from "@/lib/actions/guests";

function nextTuesday(): string {
  const date = new Date();
  const day = date.getDay(); // 0 = Sunday, 2 = Tuesday
  const daysUntilTuesday = (2 - day + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntilTuesday);
  return date.toISOString().slice(0, 10);
}

export function GuestForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    createGuest,
    null,
  );

  useEffect(() => {
    if (state && !state.success) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
      <Input name="name" placeholder="Guest name" required />
      <Input name="debateDate" type="date" defaultValue={nextTuesday()} required className="sm:w-44" />
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Add Guest
      </Button>
    </form>
  );
}

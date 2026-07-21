"use client";

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
import { createCycle } from "@/lib/actions/cycles";

export function CycleForm({
  treasurers,
}: {
  treasurers: { id: string; fullName: string | null; email: string }[];
}) {
  const [state, formAction, pending] = useActionState(createCycle, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Cycle created");
      formRef.current?.reset();
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Label htmlFor="label">Label</Label>
        <Input id="label" name="label" placeholder="July 1 – July 8" className="mt-1.5" required />
      </div>
      <div>
        <Label htmlFor="startDate">Start Date</Label>
        <Input id="startDate" name="startDate" type="date" className="mt-1.5" required />
      </div>
      <div>
        <Label htmlFor="endDate">End Date</Label>
        <Input id="endDate" name="endDate" type="date" className="mt-1.5" required />
      </div>
      <div>
        <Label htmlFor="treasurerUserId">Treasurer</Label>
        <Select
          name="treasurerUserId"
          items={treasurers.map((t) => ({ value: t.id, label: t.fullName ?? t.email }))}
        >
          <SelectTrigger id="treasurerUserId" className="mt-1.5 w-full">
            <SelectValue placeholder="Select treasurer" />
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
      <div className="lg:col-span-5">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Create Cycle
        </Button>
      </div>
    </form>
  );
}

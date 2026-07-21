"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { updateShowMemberNamesOnPublicLedger } from "@/lib/actions/organization";

export function ShowNamesToggle({ initialValue }: { initialValue: boolean }) {
  const [checked, setChecked] = useState(initialValue);
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      const result = await updateShowMemberNamesOnPublicLedger(next);
      if (result.success) {
        toast.success(next ? "Names are now shown publicly" : "Names are now hidden publicly");
      } else {
        toast.error(result.error);
        setChecked(!next);
      }
    });
  }

  return (
    <Switch id="show-names" checked={checked} onCheckedChange={handleChange} disabled={pending} />
  );
}

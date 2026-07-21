"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { toggleTestAccount } from "@/lib/actions/users";

export function TestAccountToggle({
  userId,
  initialValue,
}: {
  userId: string;
  initialValue: boolean;
}) {
  const [checked, setChecked] = useState(initialValue);
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      const result = await toggleTestAccount(userId, next);
      if (result.success) {
        toast.success(
          next ? "Marked as a test account — hidden from other admins" : "No longer a test account",
        );
      } else {
        toast.error(result.error);
        setChecked(!next);
      }
    });
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={handleChange}
      disabled={pending}
      aria-label="Test account"
    />
  );
}

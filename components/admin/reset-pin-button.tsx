"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { resetAdminPinToDefault } from "@/lib/actions/admin-pin";

export function ResetPinButton({ userId, name }: { userId: string; name: string }) {
  const [pending, startTransition] = useTransition();

  function handleReset() {
    startTransition(async () => {
      const result = await resetAdminPinToDefault(userId);
      if (result.success) toast.success(`${name}'s PIN was reset to the default`);
      else toast.error(result.error);
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="icon" aria-label="Reset PIN" />}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset {name}&apos;s admin PIN?</AlertDialogTitle>
          <AlertDialogDescription>
            This resets their PIN back to the default. They&apos;ll need to change it again next time
            they sign in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset} disabled={pending}>
            Reset PIN
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

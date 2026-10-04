"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dissociateExpenseFromGuest } from "@/lib/actions/guests";

export function UnlinkGuestExpenseButton({ reimbursementId }: { reimbursementId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await dissociateExpenseFromGuest(reimbursementId);
      if (result.success) {
        toast.success("Expense unlinked");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Unlink from this guest"
      disabled={pending}
      onClick={handleClick}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Unlink className="size-4" />}
    </Button>
  );
}

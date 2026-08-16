"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markFundDepositReceived } from "@/lib/actions/funding";

export function MarkDepositReceivedButton({ depositId }: { depositId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const today = new Date().toISOString().slice(0, 10);
      const result = await markFundDepositReceived(depositId, today);
      if (result.success) toast.success("Marked as received");
      else toast.error(result.error);
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
      Mark Received
    </Button>
  );
}

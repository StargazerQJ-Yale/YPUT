"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateGuestResolution, type ActionResult } from "@/lib/actions/guests";

export function GuestResolutionForm({
  guestId,
  resolution,
}: {
  guestId: string;
  resolution: string | null;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    updateGuestResolution.bind(null, guestId),
    null,
  );

  useEffect(() => {
    if (state?.success) toast.success("Resolution saved");
    else if (state && !state.success) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex-1">
        <Label htmlFor="resolution">Debate Resolution</Label>
        <Input
          id="resolution"
          name="resolution"
          defaultValue={resolution ?? ""}
          placeholder="e.g. Resolved: ..."
          className="mt-1.5"
        />
      </div>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Save
      </Button>
    </form>
  );
}

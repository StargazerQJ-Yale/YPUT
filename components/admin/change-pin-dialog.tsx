"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { changeAdminPin, type ActionResult } from "@/lib/actions/admin-pin";

const initialState: ActionResult | null = null;

export function ChangePinDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(changeAdminPin, initialState);

  useEffect(() => {
    if (state?.success) {
      toast.success("PIN updated");
      onOpenChange(false);
    } else if (state && !state.success) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to state changes, not onOpenChange identity
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Admin PIN</DialogTitle>
          <DialogDescription>
            This PIN gates access to the admin area on top of your Google sign-in.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="currentPin">Current PIN</Label>
            <Input id="currentPin" name="currentPin" type="password" required className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="newPin">New PIN</Label>
            <Input
              id="newPin"
              name="newPin"
              type="password"
              minLength={6}
              required
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

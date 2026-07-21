"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateUserProfile } from "@/lib/actions/users";

export function EditUserDialog({
  userId,
  currentFullName,
  currentEmail,
}: {
  userId: string;
  currentFullName: string | null;
  currentEmail: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(updateUserProfile.bind(null, userId), null);

  useEffect(() => {
    if (state?.success) {
      toast.success("Profile updated");
      setOpen(false);
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" aria-label="Edit" />}>
        <Pencil className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Changes what&apos;s shown in the app only — this doesn&apos;t change what they use to sign
            in with Google.
          </DialogDescription>
        </DialogHeader>
        <form id={`edit-user-${userId}`} action={formAction} className="space-y-4">
          <div>
            <Label htmlFor={`edit-user-name-${userId}`}>Full Name</Label>
            <Input
              id={`edit-user-name-${userId}`}
              name="fullName"
              defaultValue={currentFullName ?? ""}
              className="mt-1.5"
              required
            />
          </div>
          <div>
            <Label htmlFor={`edit-user-email-${userId}`}>Email</Label>
            <Input
              id={`edit-user-email-${userId}`}
              name="email"
              type="email"
              defaultValue={currentEmail}
              className="mt-1.5"
              required
            />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form={`edit-user-${userId}`} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

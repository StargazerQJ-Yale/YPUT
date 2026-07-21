"use client";

import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { deleteGuest } from "@/lib/actions/guests";

export function DeleteGuestButton({ guestId, name }: { guestId: string; name: string }) {
  return (
    <ConfirmDeleteButton
      title={`Delete "${name}"?`}
      description="This removes the guest record and any research done for them. This can't be undone."
      onDelete={() => deleteGuest(guestId)}
      successMessage="Guest deleted"
    />
  );
}

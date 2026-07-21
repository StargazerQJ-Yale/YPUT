"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, MessageCircleReply } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileDropzone } from "@/components/shared/file-dropzone";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import {
  respondToNeedsInfo,
  withdrawReimbursement,
} from "@/lib/actions/member-reimbursements";
import type { ReimbursementStatus } from "@/lib/generated/prisma/client";

function RespondDialog({ reimbursementId }: { reimbursementId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    const formData = new FormData();
    formData.set("note", note);
    if (file) formData.set("receipt", file);

    startTransition(async () => {
      const result = await respondToNeedsInfo(reimbursementId, formData);
      if (result.success) {
        toast.success("Response sent");
        setOpen(false);
        setNote("");
        setFile(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <MessageCircleReply className="size-4" />
            Respond
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Respond to Treasurer</DialogTitle>
          <DialogDescription>
            Answer what was asked in the approval history below. This sends your request back for
            review.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="response-note">Your Response</Label>
            <Textarea
              id="response-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1.5"
              rows={4}
              required
            />
          </div>
          <div>
            <Label>Attach a File (optional)</Label>
            <div className="mt-1.5">
              <FileDropzone name="receipt" onFileChange={setFile} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Your original receipt stays as-is — this attaches an extra file to this response only.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={pending || !note.trim()} onClick={submit}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Send Response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MemberActions({
  reimbursementId,
  status,
}: {
  reimbursementId: string;
  status: ReimbursementStatus;
}) {
  const canRespond = status === "NEEDS_INFO";
  const canWithdraw = status === "PENDING" || status === "NEEDS_INFO";

  if (!canRespond && !canWithdraw) return null;

  return (
    <div className="flex flex-wrap gap-2 rounded-xl border bg-background p-3">
      {canRespond && <RespondDialog reimbursementId={reimbursementId} />}
      {canWithdraw && (
        <ConfirmDeleteButton
          title="Withdraw this request?"
          description="This can't be undone. Your treasurer will still be able to see it, marked as withdrawn."
          onDelete={() => withdrawReimbursement(reimbursementId)}
          successMessage="Request withdrawn"
        />
      )}
    </div>
  );
}

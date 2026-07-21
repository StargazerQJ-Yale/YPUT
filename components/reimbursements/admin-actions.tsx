"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, HelpCircle, Banknote, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Trash2 } from "lucide-react";
import {
  approveReimbursement,
  rejectReimbursement,
  requestInfo,
  markPaid,
  deleteReimbursement,
  type ActionResult,
} from "@/lib/actions/admin-reimbursements";
import type { ReimbursementStatus } from "@/lib/generated/prisma/client";

function useRunAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(promise: Promise<ActionResult>, successMessage: string, onDone?: () => void) {
    startTransition(async () => {
      const result = await promise;
      if (result.success) {
        toast.success(successMessage);
        onDone?.();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return { run, pending };
}

function NoteDialog({
  trigger,
  title,
  description,
  actionLabel,
  successMessage,
  requireNote,
  onConfirm,
}: {
  trigger: React.ReactElement;
  title: string;
  description: string;
  actionLabel: string;
  successMessage: string;
  requireNote?: boolean;
  onConfirm: (note: string) => Promise<ActionResult>;
}) {
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState("");
  const { run, pending } = useRunAction();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor="note">Note {requireNote ? "" : "(optional)"}</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1.5"
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending || (requireNote && !note.trim())}
            onClick={() => run(onConfirm(note), successMessage, () => setOpen(false))}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MarkPaidDialog({ reimbursementId }: { reimbursementId: string }) {
  const [open, setOpen] = React.useState(false);
  const [paidDate, setPaidDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [transactionId, setTransactionId] = React.useState("");
  const { run, pending } = useRunAction();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Banknote className="size-4" />
            Mark Paid
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record the payment date and transaction ID to mark this reimbursement as paid.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="paidDate">Payment Date</Label>
            <Input
              id="paidDate"
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="transactionId">Transaction ID</Label>
            <Input
              id="transactionId"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Venmo/Zelle/bank reference"
              className="mt-1.5"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending || !transactionId.trim()}
            onClick={() =>
              run(markPaid(reimbursementId, paidDate, transactionId), "Marked as paid", () =>
                setOpen(false),
              )
            }
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteReimbursementDialog({
  reimbursementId,
  isPaid,
}: {
  reimbursementId: string;
  isPaid: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteReimbursement(reimbursementId);
      if (result.success) {
        toast.success("Reimbursement deleted");
        router.push("/admin/reimbursements");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this reimbursement?</AlertDialogTitle>
          <AlertDialogDescription>
            {isPaid
              ? "This is PAID and part of the permanent ledger — deleting it also removes its ledger entry and payment record, permanently reducing your recorded budget/ledger totals. Only use this for correcting test or mistaken data."
              : "This permanently removes the submission, its receipt, and its approval history. This can't be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function AdminActions({
  reimbursementId,
  status,
  editDialog,
  viewerRole,
}: {
  reimbursementId: string;
  status: ReimbursementStatus;
  editDialog?: React.ReactNode;
  viewerRole: "TREASURER" | "SUPER_ADMIN";
}) {
  const canApprove = status === "PENDING" || status === "NEEDS_INFO";
  const canReject = status === "PENDING" || status === "NEEDS_INFO" || status === "APPROVED";
  const canRequestInfo = status === "PENDING";
  const canMarkPaid = status === "APPROVED";
  const canEdit = status !== "PAID";
  // A Super Admin can override the paid-lock to clean up test/mistaken data;
  // a regular Treasurer can't delete a paid entry (see deleteReimbursement).
  const canDelete = status !== "PAID" || viewerRole === "SUPER_ADMIN";

  if (!canApprove && !canReject && !canRequestInfo && !canMarkPaid && !canEdit && !canDelete) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-xl border bg-background p-3">
      {canEdit && editDialog}
      {canApprove && (
        <NoteDialog
          trigger={
            <Button variant="default">
              <CheckCircle2 className="size-4" />
              Approve
            </Button>
          }
          title="Approve Reimbursement"
          description="Optionally add a note visible in the approval history."
          actionLabel="Approve"
          successMessage="Reimbursement approved"
          onConfirm={(note) => approveReimbursement(reimbursementId, note || undefined)}
        />
      )}
      {canRequestInfo && (
        <NoteDialog
          trigger={
            <Button variant="outline">
              <HelpCircle className="size-4" />
              Request Info
            </Button>
          }
          title="Request Additional Information"
          description="Explain what's missing — the submitter will see this note."
          actionLabel="Request Info"
          successMessage="Requested more info"
          requireNote
          onConfirm={(note) => requestInfo(reimbursementId, note)}
        />
      )}
      {canMarkPaid && <MarkPaidDialog reimbursementId={reimbursementId} />}
      {canReject && (
        <NoteDialog
          trigger={
            <Button variant="destructive">
              <XCircle className="size-4" />
              Reject
            </Button>
          }
          title="Reject Reimbursement"
          description="Let the submitter know why this was rejected."
          actionLabel="Reject"
          successMessage="Reimbursement rejected"
          requireNote
          onConfirm={(note) => rejectReimbursement(reimbursementId, note)}
        />
      )}
      {canDelete && (
        <DeleteReimbursementDialog reimbursementId={reimbursementId} isPaid={status === "PAID"} />
      )}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { ReceiptPreview } from "@/components/reimbursements/receipt-preview";
import { StatusHistoryTimeline } from "@/components/reimbursements/status-history-timeline";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { isImagePath } from "@/lib/storage";
import type {
  Reimbursement,
  ReimbursementStatusHistory,
  Payment,
  BudgetArea,
  BudgetItem,
  ReimbursementCycle,
} from "@/lib/generated/prisma/client";

// fullName/email here are already redacted server-side (see lib/identity.ts)
// where the viewer isn't allowed to see the real identity — never the raw
// User record, so a Super Admin's or test account's real info can't leak.
type PublicIdentity = { fullName: string | null; email: string };

export type ReimbursementDetailData = Reimbursement & {
  budgetArea: BudgetArea;
  budgetItem: BudgetItem;
  cycle: ReimbursementCycle | null;
  submitter: PublicIdentity;
  statusHistory: (ReimbursementStatusHistory & {
    changedBy: PublicIdentity;
    attachmentUrl?: string | null;
  })[];
  payment: (Payment & { recordedBy: PublicIdentity }) | null;
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  VENMO: "Venmo",
  ZELLE: "Zelle",
  BANK_TRANSFER: "Bank Transfer",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}

export function ReimbursementDetail({
  reimbursement,
  receiptUrl,
  showSubmitter = false,
  actions,
}: {
  reimbursement: ReimbursementDetailData;
  receiptUrl: string | null;
  showSubmitter?: boolean;
  actions?: React.ReactNode;
}) {
  const r = reimbursement;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {r.eventName || r.description.slice(0, 60)}
            </h1>
            <StatusBadge status={r.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted {formatDateTime(r.createdAt)}
            {r.cycle ? ` · Cycle: ${r.cycle.label}` : " · Unassigned cycle"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-semibold tabular-nums">{formatCurrency(r.amount)}</span>
        </div>
      </div>

      {actions}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Submission Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              {showSubmitter && (
                <Field label="Submitted By">
                  {r.submitter.fullName ?? r.submitter.email}
                </Field>
              )}
              <Field label="Name">{r.fullName}</Field>
              <Field label="Email">{r.email}</Field>
              <Field label="Budget Area">{r.budgetArea.name}</Field>
              <Field label="Budget Category">{r.budgetItem.name}</Field>
              <Field label="Date of Purchase">{formatDate(r.purchaseDate)}</Field>
              <Field label="Payment Method">{PAYMENT_METHOD_LABELS[r.paymentMethod]}</Field>
              <Field label="Payment Handle">{r.paymentHandle}</Field>
              {r.eventName && <Field label="Event">{r.eventName}</Field>}
            </dl>
            <Separator className="my-4" />
            <Field label="Description">
              <p className="whitespace-pre-wrap">{r.description}</p>
            </Field>
            {r.notes && (
              <>
                <Separator className="my-4" />
                <Field label="Additional Notes">
                  <p className="whitespace-pre-wrap">{r.notes}</p>
                </Field>
              </>
            )}

            {r.payment && (
              <>
                <Separator className="my-4" />
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Payment
                </p>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Field label="Paid Date">{formatDate(r.payment.paidDate)}</Field>
                  <Field label="Transaction ID">{r.payment.transactionId}</Field>
                  <Field label="Recorded By">
                    {r.payment.recordedBy.fullName ?? r.payment.recordedBy.email}
                  </Field>
                </dl>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            <ReceiptPreview
              receiptUrl={receiptUrl}
              receiptName={r.receiptName}
              isImage={isImagePath(r.receiptName)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approval History</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusHistoryTimeline history={r.statusHistory} />
        </CardContent>
      </Card>
    </div>
  );
}

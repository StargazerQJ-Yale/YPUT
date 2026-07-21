import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getSignedReceiptUrl, withHistoryAttachmentUrls } from "@/lib/storage";
import { getPublicIdentity } from "@/lib/identity";
import { ReimbursementDetail } from "@/components/reimbursements/reimbursement-detail";
import { AdminActions } from "@/components/reimbursements/admin-actions";
import { EditReimbursementDialog } from "@/components/reimbursements/edit-reimbursement-dialog";

export default async function AdminReimbursementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await requireAdmin();

  const reimbursement = await prisma.reimbursement.findUnique({
    where: { id },
    include: {
      budgetArea: true,
      budgetItem: true,
      cycle: true,
      submitter: true,
      statusHistory: { orderBy: { createdAt: "asc" }, include: { changedBy: true } },
      payment: { include: { recordedBy: true } },
    },
  });

  if (!reimbursement) notFound();

  // Scoped to the reimbursement's own fiscal year (not necessarily the
  // currently-active one), since edits should only re-categorize within the
  // budget structure that existed when it was submitted.
  const budgetAreas = await prisma.budgetArea.findMany({
    where: { fiscalYearId: reimbursement.fiscalYearId },
    orderBy: { name: "asc" },
    include: { budgetItems: { orderBy: { name: "asc" }, select: { id: true, name: true } } },
  });

  const receiptUrl = await getSignedReceiptUrl(reimbursement.receiptPath);
  const statusHistoryWithAttachments = await withHistoryAttachmentUrls(reimbursement.statusHistory);
  const statusHistory = statusHistoryWithAttachments.map((entry) => ({
    ...entry,
    changedBy: getPublicIdentity(entry.changedBy, viewer),
  }));
  const payment = reimbursement.payment
    ? { ...reimbursement.payment, recordedBy: getPublicIdentity(reimbursement.payment.recordedBy, viewer) }
    : null;
  const submitter = getPublicIdentity(reimbursement.submitter, viewer);

  return (
    <ReimbursementDetail
      reimbursement={{ ...reimbursement, submitter, statusHistory, payment }}
      receiptUrl={receiptUrl}
      showSubmitter
      actions={
        <AdminActions
          reimbursementId={reimbursement.id}
          status={reimbursement.status}
          viewerRole={viewer.role}
          editDialog={
            <EditReimbursementDialog
              reimbursementId={reimbursement.id}
              budgetAreas={budgetAreas}
              current={{
                fullName: reimbursement.fullName,
                email: reimbursement.email,
                amount: Number(reimbursement.amount),
                budgetAreaId: reimbursement.budgetAreaId,
                budgetItemId: reimbursement.budgetItemId,
                description: reimbursement.description,
                eventName: reimbursement.eventName,
                purchaseDate: reimbursement.purchaseDate.toISOString().slice(0, 10),
                paymentMethod: reimbursement.paymentMethod,
                paymentHandle: reimbursement.paymentHandle,
                notes: reimbursement.notes,
              }}
            />
          }
        />
      }
    />
  );
}

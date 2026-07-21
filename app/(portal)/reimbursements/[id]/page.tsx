import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedReceiptUrl, withHistoryAttachmentUrls } from "@/lib/storage";
import { ReimbursementDetail } from "@/components/reimbursements/reimbursement-detail";
import { MemberActions } from "@/components/reimbursements/member-actions";

export default async function MemberReimbursementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

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

  if (!reimbursement || reimbursement.submitterUserId !== user.id) {
    notFound();
  }

  const receiptUrl = await getSignedReceiptUrl(reimbursement.receiptPath);
  const statusHistory = await withHistoryAttachmentUrls(reimbursement.statusHistory);

  return (
    <ReimbursementDetail
      reimbursement={{ ...reimbursement, statusHistory }}
      receiptUrl={receiptUrl}
      actions={<MemberActions reimbursementId={reimbursement.id} status={reimbursement.status} />}
    />
  );
}

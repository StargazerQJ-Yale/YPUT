-- AlterTable
ALTER TABLE "Reimbursement" ADD COLUMN     "guestId" TEXT;

-- CreateIndex
CREATE INDEX "Reimbursement_guestId_idx" ON "Reimbursement"("guestId");

-- AddForeignKey
ALTER TABLE "Reimbursement" ADD CONSTRAINT "Reimbursement_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

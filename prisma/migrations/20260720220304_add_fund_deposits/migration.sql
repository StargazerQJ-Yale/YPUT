-- CreateTable
CREATE TABLE "FundDeposit" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "source" TEXT NOT NULL,
    "depositDate" TIMESTAMP(3) NOT NULL,
    "recordedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FundDeposit_orgId_fiscalYearId_idx" ON "FundDeposit"("orgId", "fiscalYearId");

-- AddForeignKey
ALTER TABLE "FundDeposit" ADD CONSTRAINT "FundDeposit_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundDeposit" ADD CONSTRAINT "FundDeposit_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FundDeposit" ADD CONSTRAINT "FundDeposit_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

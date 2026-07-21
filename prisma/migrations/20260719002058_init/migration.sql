-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'TREASURER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('VENMO', 'ZELLE', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "ReimbursementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_INFO', 'PAID');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalYear" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReimbursementCycle" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "treasurerUserId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReimbursementCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetArea" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetItem" (
    "id" TEXT NOT NULL,
    "budgetAreaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budgetedAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reimbursement" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "submitterUserId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "receiptPath" TEXT NOT NULL,
    "receiptName" TEXT NOT NULL,
    "budgetAreaId" TEXT NOT NULL,
    "budgetItemId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventName" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentHandle" TEXT NOT NULL,
    "notes" TEXT,
    "status" "ReimbursementStatus" NOT NULL DEFAULT 'PENDING',
    "cycleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reimbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReimbursementStatusHistory" (
    "id" TEXT NOT NULL,
    "reimbursementId" TEXT NOT NULL,
    "fromStatus" "ReimbursementStatus",
    "toStatus" "ReimbursementStatus" NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReimbursementStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "reimbursementId" TEXT NOT NULL,
    "paidDate" TIMESTAMP(3) NOT NULL,
    "transactionId" TEXT NOT NULL,
    "recordedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerTransaction" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "reimbursementId" TEXT NOT NULL,
    "budgetItemId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "FiscalYear_orgId_idx" ON "FiscalYear"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalYear_orgId_label_key" ON "FiscalYear"("orgId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- CreateIndex
CREATE INDEX "ReimbursementCycle_orgId_startDate_endDate_idx" ON "ReimbursementCycle"("orgId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "BudgetArea_orgId_idx" ON "BudgetArea"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetArea_fiscalYearId_name_key" ON "BudgetArea"("fiscalYearId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetItem_budgetAreaId_name_key" ON "BudgetItem"("budgetAreaId", "name");

-- CreateIndex
CREATE INDEX "Reimbursement_orgId_status_idx" ON "Reimbursement"("orgId", "status");

-- CreateIndex
CREATE INDEX "Reimbursement_submitterUserId_idx" ON "Reimbursement"("submitterUserId");

-- CreateIndex
CREATE INDEX "Reimbursement_cycleId_idx" ON "Reimbursement"("cycleId");

-- CreateIndex
CREATE INDEX "ReimbursementStatusHistory_reimbursementId_idx" ON "ReimbursementStatusHistory"("reimbursementId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reimbursementId_key" ON "Payment"("reimbursementId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerTransaction_reimbursementId_key" ON "LedgerTransaction"("reimbursementId");

-- CreateIndex
CREATE INDEX "LedgerTransaction_orgId_occurredAt_idx" ON "LedgerTransaction"("orgId", "occurredAt");

-- AddForeignKey
ALTER TABLE "FiscalYear" ADD CONSTRAINT "FiscalYear_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReimbursementCycle" ADD CONSTRAINT "ReimbursementCycle_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReimbursementCycle" ADD CONSTRAINT "ReimbursementCycle_treasurerUserId_fkey" FOREIGN KEY ("treasurerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetArea" ADD CONSTRAINT "BudgetArea_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetArea" ADD CONSTRAINT "BudgetArea_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_budgetAreaId_fkey" FOREIGN KEY ("budgetAreaId") REFERENCES "BudgetArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reimbursement" ADD CONSTRAINT "Reimbursement_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reimbursement" ADD CONSTRAINT "Reimbursement_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FiscalYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reimbursement" ADD CONSTRAINT "Reimbursement_submitterUserId_fkey" FOREIGN KEY ("submitterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reimbursement" ADD CONSTRAINT "Reimbursement_budgetAreaId_fkey" FOREIGN KEY ("budgetAreaId") REFERENCES "BudgetArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reimbursement" ADD CONSTRAINT "Reimbursement_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "BudgetItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reimbursement" ADD CONSTRAINT "Reimbursement_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ReimbursementCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReimbursementStatusHistory" ADD CONSTRAINT "ReimbursementStatusHistory_reimbursementId_fkey" FOREIGN KEY ("reimbursementId") REFERENCES "Reimbursement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReimbursementStatusHistory" ADD CONSTRAINT "ReimbursementStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reimbursementId_fkey" FOREIGN KEY ("reimbursementId") REFERENCES "Reimbursement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_reimbursementId_fkey" FOREIGN KEY ("reimbursementId") REFERENCES "Reimbursement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_budgetItemId_fkey" FOREIGN KEY ("budgetItemId") REFERENCES "BudgetItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "GuestStatus" AS ENUM ('PENDING', 'RESEARCHED', 'CONFIRMED');

-- CreateTable
CREATE TABLE "LectureshipFund" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "isCommonlyUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LectureshipFund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "debateDate" TIMESTAMP(3) NOT NULL,
    "status" "GuestStatus" NOT NULL DEFAULT 'PENDING',
    "researchSummary" TEXT,
    "matchedLectureshipId" TEXT,
    "matchReasoning" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LectureshipFund_orgId_idx" ON "LectureshipFund"("orgId");

-- CreateIndex
CREATE INDEX "Guest_orgId_debateDate_idx" ON "Guest"("orgId", "debateDate");

-- AddForeignKey
ALTER TABLE "LectureshipFund" ADD CONSTRAINT "LectureshipFund_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_matchedLectureshipId_fkey" FOREIGN KEY ("matchedLectureshipId") REFERENCES "LectureshipFund"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

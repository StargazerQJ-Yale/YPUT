-- CreateEnum
CREATE TYPE "FundDepositStatus" AS ENUM ('PROMISED', 'RECEIVED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'EBOARD';

-- AlterTable
ALTER TABLE "FundDeposit" ADD COLUMN     "promisedBy" TEXT,
ADD COLUMN     "status" "FundDepositStatus" NOT NULL DEFAULT 'RECEIVED';

-- AlterTable
ALTER TABLE "LedgerTransaction" ADD COLUMN     "description" TEXT,
ADD COLUMN     "recordedByUserId" TEXT,
ALTER COLUMN "reimbursementId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

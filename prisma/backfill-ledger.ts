import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

// Run standalone (`npx tsx prisma/backfill-ledger.ts`), not through the Prisma
// CLI, so — unlike seed.ts — it needs to load .env.local itself.
loadEnv({ path: ".env.local", quiet: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// One-off, idempotent: creates LedgerTransaction rows for reimbursements that
// were marked PAID before the automatic ledger existed. Safe to re-run.
async function main() {
  const paidWithoutLedger = await prisma.reimbursement.findMany({
    where: { status: "PAID", ledgerTransaction: null },
    include: { payment: true },
  });

  if (paidWithoutLedger.length === 0) {
    console.log("Nothing to backfill — every PAID reimbursement already has a ledger entry.");
    return;
  }

  for (const r of paidWithoutLedger) {
    await prisma.ledgerTransaction.create({
      data: {
        reimbursementId: r.id,
        orgId: r.orgId,
        budgetItemId: r.budgetItemId,
        amount: r.amount,
        occurredAt: r.payment?.paidDate ?? r.updatedAt,
      },
    });
    console.log(`Backfilled ledger entry for reimbursement ${r.id} (${r.fullName}, $${r.amount}).`);
  }

  console.log(`Done — backfilled ${paidWithoutLedger.length} ledger entr${paidWithoutLedger.length === 1 ? "y" : "ies"}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { config as loadEnv } from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

// Run standalone (`npx tsx prisma/backfill-admin-pins.ts`) — needs .env.local
// loaded itself, same as prisma/backfill-ledger.ts. Can't import lib/pin.ts
// here: it has `import "server-only"`, which throws outside Next's bundler.
loadEnv({ path: ".env.local", quiet: true });

const DEFAULT_ADMIN_PIN = "YPUofPOR"; // kept in sync with lib/pin.ts

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// One-off, idempotent: sets the default admin PIN for any E-Board/Treasurer/
// Admin/Super Admin promoted before this feature (or that role) existed. Safe
// to re-run.
async function main() {
  const adminsWithoutPin = await prisma.user.findMany({
    where: { role: { in: ["EBOARD", "TREASURER", "ADMIN", "SUPER_ADMIN"] }, passwordHash: null },
  });

  if (adminsWithoutPin.length === 0) {
    console.log("Nothing to backfill — every E-Board/Treasurer/Admin/Super Admin already has a PIN.");
    return;
  }

  const hash = await bcrypt.hash(DEFAULT_ADMIN_PIN, 10);
  for (const user of adminsWithoutPin) {
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
    console.log(`Set default PIN for ${user.email} (${user.role}).`);
  }

  console.log(`Done — backfilled ${adminsWithoutPin.length} account(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads .env.local automatically at runtime; load the same file here
// so the Prisma CLI (migrate/seed/studio) uses one source of truth for secrets.
loadEnv({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // The CLI (migrate/db push/studio) needs a direct, non-pooled connection —
    // PgBouncer's transaction-mode pooler (used by DATABASE_URL at runtime)
    // doesn't support the schema commands migrations issue.
    url: process.env["DIRECT_URL"],
  },
});

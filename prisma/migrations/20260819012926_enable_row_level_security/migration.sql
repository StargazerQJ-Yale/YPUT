-- Supabase auto-exposes every table in the "public" schema over its
-- PostgREST REST API to anyone holding the public anon key (shipped in the
-- browser bundle as NEXT_PUBLIC_SUPABASE_ANON_KEY), unless RLS blocks it.
-- This app never queries these tables through that API — everything goes
-- through Prisma using the Postgres superuser connection (DATABASE_URL),
-- which bypasses RLS entirely — so enabling RLS with zero policies fully
-- closes the public REST hole without affecting the app's own access.

ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."FiscalYear" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."FundDeposit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ReimbursementCycle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."BudgetArea" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."BudgetItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Reimbursement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ReimbursementStatusHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."LedgerTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."LectureshipFund" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Guest" ENABLE ROW LEVEL SECURITY;

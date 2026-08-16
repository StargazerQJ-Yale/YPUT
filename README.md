# Treasury Portal

Replaces Google Forms + Excel for the Yale Political Union's treasury workflow:
members submit reimbursements, treasurers review and pay them, and (in later
phases) the org gets a public ledger and analytics.

This is **Phase 1**: authentication, reimbursement submission, and admin review.
The database schema already models budgets, ledger transactions, fiscal years,
and multi-org support so Phases 2-4 are additive, not migrations.

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + shadcn/ui, next-themes (dark mode)
- Supabase: Auth (Google OAuth) + Storage (private receipts bucket)
- Prisma ORM against Supabase Postgres
- Server Actions for all mutations

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (GitHub or Google — no separate account needed).
2. **New Project** → name it, set a database password (save it), pick a region, Free tier is fine.
3. Wait ~1-2 minutes for provisioning.

## 2. Collect your credentials

From your Supabase project:

- **Settings → API**: `Project URL`, `anon public`/publishable key, and the `service_role`/secret key.
- **Connect** (top of the dashboard) **→ ORMs → Prisma**: copy both the pooled connection string
  (`DATABASE_URL`, port 6543) and the direct connection string (`DIRECT_URL`, port 5432). The app
  queries through the pooler; migrations need the direct connection since PgBouncer's
  transaction-mode pooler doesn't support the schema commands migrations issue.

## 3. Enable Google sign-in

1. **Authentication → Providers → Google** → toggle on.
2. You need a Google OAuth client (uses your existing Google account, not a new service):
   [Google Cloud Console](https://console.cloud.google.com) → new project → **APIs & Services → Credentials**
   → **Create OAuth Client ID** → Application type "Web application" → add the redirect URL Supabase
   shows on the Google provider settings page as an authorized redirect URI.
3. Paste the resulting Client ID / Secret into Supabase's Google provider config.

## 4. Create the receipts storage bucket

**Storage → New bucket** → name it `receipts` → **Private** (not public).

## 5. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values from steps 2-4:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → anon public key |
| `SUPABASE_SECRET_KEY` | Settings → API → secret/service_role key (server-only, never expose to the browser) |
| `DATABASE_URL` | Connect → ORMs → Prisma → pooled connection string (port 6543) |
| `DIRECT_URL` | Connect → ORMs → Prisma → direct connection string (port 5432, migrations only) |
| `SUPABASE_RECEIPTS_BUCKET` | `receipts` (matches step 4) |
| `BOOTSTRAP_SUPER_ADMIN_EMAIL` | The email that should auto-become Super Admin on first login |
| `DEFAULT_ORG_SLUG` | `por` (matches the seed data) — change if you re-seed with a different org |
| `ADMIN_PIN_COOKIE_SECRET` | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

## 6. Install, migrate, seed, run

```bash
npm install
npx prisma migrate dev --name init   # creates tables in your Supabase Postgres
npx prisma db seed                   # seeds the org, fiscal year, and budget hierarchy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with Google using the
`BOOTSTRAP_SUPER_ADMIN_EMAIL` account, and you'll land in the admin dashboard as Super Admin.
From there, visit **Users** to promote other accounts, and **Cycles** to create reimbursement
cycles (submissions auto-assign to whichever cycle covers the submission date).

## Project structure

```
prisma/schema.prisma, prisma/seed.ts     Data model + seed data
lib/supabase/{client,server,middleware,admin}.ts   Supabase auth/storage helpers
lib/auth.ts, lib/org.ts, lib/cycles.ts, lib/storage.ts   App-level auth/domain helpers
lib/actions/                              Server Actions (mutations)
lib/validations/                          zod schemas shared by forms + actions
components/ui/                            shadcn primitives
components/shared/                        AppShell, StatusBadge, FileDropzone, EmptyState, ...
components/reimbursements/, components/admin/   Feature components
app/login, app/auth/callback              Auth
app/(portal)/...                          Member portal (dashboard, submit, own reimbursement detail)
app/(admin)/admin/...                     Treasurer/Super Admin dashboard
middleware.ts                             Session refresh + route protection
```

## What's deferred to later phases

Schema is in place for these, but no UI/logic yet: automatic ledger writes on
payment, budget used/remaining/% computation, the public ledger page, analytics
charts, CSV/Excel/PDF exports, receipt OCR, and email notifications.

## Deploying

Deploy to [Vercel](https://vercel.com/new). Set the same environment variables from
`.env.local` in the Vercel project settings, and run `npx prisma migrate deploy`
against production before (or via a build step) the first deploy.

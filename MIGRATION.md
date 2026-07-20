# Next.js (T3) migration — status & finishing steps

The app has been migrated from **NestJS backend + Vite SPA** to a **single
Next.js (T3) app**. Everything that can be verified without a database is done
and committed on branch `feat/nextjs-t3-migration`:

- ✅ T3 scaffold, Prisma schema (money as BigInt minor units), `src/env.js`
- ✅ NextAuth v5 Credentials (JWT sessions), edge-safe middleware
- ✅ Eight tRPC routers + services; PDF/CSV as Node route handlers
- ✅ Balance engine ported to `db.$transaction` + atomic increments + row locks
- ✅ Frontend on the App Router; pages talk to tRPC via a thin `@/api/*` shim
- ✅ `npm run typecheck`, `npm test`, and `npx next build` all pass
- ✅ Money unit tests (7) green; Prisma integration suite written

The remaining steps **all require a database**, so they are yours to run.

## 1. Provide the database

Create a Supabase project (or any Postgres) and put **three** values in a
root `.env` (see `.env.example`):

```
DATABASE_URL=...   # pooled, port 6543, ?pgbouncer=true
DIRECT_URL=...     # direct, port 5432 (migrations only)
AUTH_SECRET=...    # openssl rand -base64 32
```

The old `NEXT_PUBLIC_SUPABASE_*` keys are not used — Prisma talks to Postgres
directly and NextAuth handles auth.

## 2. Migrate + seed

```bash
npm run db:migrate      # creates the tables (uses DIRECT_URL)
npm run db:seed         # demo@budgety.com / password123, 13 dated transactions
```

## 3. Verify the money math (the point of the whole port)

```bash
npm run test:db
```

This runs the balance-engine integration suite against the real database:
create/update/delete guards, the full-rollback-on-failed-edit case, the
both-sides cascade, and a concurrency case proving `lockSources()`. It must
pass, with one intentional difference from the old backend documented in the
suite (the failed-edit error now reports the post-reverse balance).

## 4. Diff old vs new (optional but recommended)

The old NestJS backend is still in `backend/` for exactly this. Run it on
:3000 (`cd backend && bun run start:dev`), run the new app
(`npm run dev`), and compare responses for the demo user. This is why
`backend/` was kept.

## 5. Manual smoke test

`npm run dev`, then: sign up fresh → add a source → add one of each
transaction type → edit one → delete one → reconcile → export PDF and CSV →
toggle dark mode → sign out and back in. Watch the balances at each step.

**Known thing to check specifically:** amounts display correctly. The server
returns BigInt minor units and the UI converts with `toMajor`/`formatCurrency`;
charts convert before recharts/chart.js. This is the one class of bug a
typecheck can't catch, so eyeball the numbers on the dashboard, reports, and a
source detail page.

## 6. Final cleanup (Phase 9)

Once verified, delete `backend/` and `frontend/` and drop the
`react-router-dom` tsconfig alias / `src/compat`. They are intentionally kept
until you've confirmed the port against a real database.

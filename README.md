# Budgety

A personal finance app for tracking income, expenses, and transfers across
multiple money sources, with real-time balance computation, reconciliation, and
PDF/CSV export. A single **Next.js (T3)** application.

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, TypeScript)
- **API:** [tRPC v11](https://trpc.io/) — end-to-end typesafe, no REST layer
- **Database:** [Prisma](https://www.prisma.io/) + PostgreSQL (Supabase).
  Money is stored as `BigInt` **minor units** (kobo); conversion lives only in
  `src/lib/money.ts`.
- **Auth:** [NextAuth v5](https://authjs.dev/) — Credentials provider, JWT
  sessions, bcrypt. No adapter tables.
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + shadcn/ui, with a
  token-based light/dark theme.
- **Charts:** Recharts + Chart.js · **Notifications:** react-toastify

## Prerequisites

- Node.js 20+
- A PostgreSQL database (Supabase, Neon, or local)

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Configure

Copy `.env.example` to `.env` and fill in:

```env
DATABASE_URL=   # pooled connection (Supabase Supavisor, port 6543, ?pgbouncer=true)
DIRECT_URL=     # direct connection (port 5432) — used by prisma migrate
AUTH_SECRET=    # openssl rand -base64 32
```

`DATABASE_URL` and `DIRECT_URL` are **not** interchangeable — migrations take
advisory locks a transaction-mode pooler can't hold, hence the direct URL. See
`.env.example` for details.

### 3. Migrate & seed

```bash
npm run db:migrate      # create tables
npm run db:seed         # demo@budgety.com / password123, 13 dated transactions
```

### 4. Run

```bash
npm run dev             # http://localhost:3000
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests (money conversion) |
| `npm run test:db` | Balance-engine integration suite (needs a DB) |
| `npm run db:migrate` / `db:seed` / `db:studio` | Prisma |

## Structure

```
src/
├── app/                    # App Router — (auth) and (app) route groups, api/
│   └── api/{trpc,auth,export}
├── server/
│   ├── api/routers/        # one tRPC router per domain
│   ├── services/           # business logic (balance engine in transactions.ts)
│   ├── auth/               # NextAuth config (split edge/node)
│   └── db.ts               # Prisma client
├── features/               # page components (client)
├── components/             # ui/, charts/, layout/
├── api/                    # thin tRPC-client shims used by pages
├── lib/                    # money, formatters, helpers
└── env.js                  # validated environment
prisma/
├── schema.prisma
└── seed.ts
```

## Notes

- The balance engine (`src/server/services/transactions.ts`) keeps `source.balance`
  as a running total. Every write is a single `db.$transaction` with atomic
  increments and `SELECT … FOR UPDATE` row locks. Its behaviour is covered by
  `npm run test:db`.
- `src/api/*` re-expose tRPC over the call signatures the pages were written
  against; `react-router-dom` is aliased to a Next-navigation shim
  (`src/compat/`). Both are migration conveniences that can be unwound later.
- Migrated from a NestJS backend + Vite SPA; see `MIGRATION.md`.

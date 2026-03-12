# Budgety

A production-ready personal budgeting API built with NestJS, TypeScript, and Bun.

Track money across multiple sources (cash, Opay, bank accounts), record inflows/outflows/transfers, reconcile balances, and export PDF reports.

## Quick Start

```bash
# Install dependencies
bun install

# Configure environment
cp .env .env.local   # edit JWT_SECRET for production

# Run in development (hot reload)
bun run start:dev

# Build and run for production
bun run build
bun run start:prod
```

The API starts at **http://localhost:3000** by default.

## Scripts

| Script | Command | Description |
|---|---|---|
| `start:dev` | `bun --watch src/main.ts` | Development with hot reload |
| `build` | `nest build` | Compile TypeScript to `dist/` |
| `start` | `bun dist/main.js` | Run compiled output |
| `start:prod` | `NODE_ENV=production bun dist/main.js` | Production mode |

## Environment Variables

Create a `.env` file in the project root:

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `budgety-dev-secret` | Secret key for signing JWT tokens. **Change this in production.** |
| `JWT_EXPIRATION` | `7d` | Token expiry duration (e.g. `1h`, `7d`, `30d`) |
| `PORT` | `3000` | Server port |

## Project Structure

```
src/
├── main.ts                         # App bootstrap, global pipes, CORS
├── app.module.ts                   # Root module, global StorageService
├── common/
│   ├── decorators/
│   │   └── current-user.decorator.ts   # @CurrentUser() param decorator
│   ├── interfaces/                 # TypeScript interfaces & enums
│   │   ├── user.interface.ts
│   │   ├── source.interface.ts
│   │   ├── transaction.interface.ts
│   │   ├── category.interface.ts
│   │   ├── reconciliation.interface.ts
│   │   └── index.ts
│   ├── services/
│   │   └── storage.service.ts      # In-memory data store (swap point for DB)
│   └── utils/
│       └── pdf.util.ts             # PDF report generation with pdfkit
└── modules/
    ├── auth/                       # Register, login, JWT strategy & guard
    ├── sources/                    # Money sources CRUD
    ├── transactions/               # Transaction CRUD with balance management
    ├── categories/                 # Income/expense categories CRUD
    ├── dashboard/                  # Aggregated financial overview
    ├── reconciliation/             # Balance verification & discrepancies
    └── export/                     # PDF report download
```

## Architecture

### Data Storage

All data lives in a single `StorageService` — a global singleton holding in-memory arrays. Every module injects this same instance.

**To migrate to a database**, replace `StorageService` methods with actual repository calls (TypeORM, Prisma, Drizzle, etc.). No other code needs to change since all data access is centralised in this one service.

### Authentication

- JWT-based authentication via `@nestjs/passport` and `passport-jwt`
- Tokens are issued on register/login and sent as `Authorization: Bearer <token>`
- All endpoints except `/auth/register` and `/auth/login` require a valid token
- The authenticated user is extracted with the `@CurrentUser()` decorator

### Balance Management

Balance updates are handled exclusively by the Transactions service — not by direct source edits:

- **Inflow** — adds amount to source balance
- **Outflow** — deducts amount from source balance
- **Transfer** — deducts from source, adds to target

**On edit:** the old transaction's effects are reversed first, then the new effects are applied. If the new state would cause a negative balance, the operation is rolled back.

**On delete:** the transaction's effects are reversed. If reversing would cause a negative balance (e.g. deleting an inflow when the money has already been spent), the deletion is rejected.

### Validation

A global `ValidationPipe` is configured with:
- `whitelist: true` — strips unknown properties
- `forbidNonWhitelisted: true` — rejects requests with unknown properties
- `transform: true` — auto-transforms payloads to DTO class instances

## API Overview

All authenticated endpoints require the header: `Authorization: Bearer <token>`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Get access token |
| GET | `/sources` | Yes | List all sources |
| POST | `/sources` | Yes | Create a source |
| GET | `/sources/:id` | Yes | Source detail + transaction history |
| PATCH | `/sources/:id` | Yes | Update source name/currency |
| DELETE | `/sources/:id` | Yes | Delete source and its transactions |
| GET | `/transactions` | Yes | List transactions (with filters) |
| POST | `/transactions` | Yes | Create transaction |
| PATCH | `/transactions/:id` | Yes | Edit transaction (re-adjusts balances) |
| DELETE | `/transactions/:id` | Yes | Delete transaction (reverses balance) |
| GET | `/categories` | Yes | List categories |
| POST | `/categories` | Yes | Create category |
| PATCH | `/categories/:id` | Yes | Update category |
| DELETE | `/categories/:id` | Yes | Delete category |
| GET | `/dashboard` | Yes | Financial overview |
| POST | `/reconcile` | Yes | Submit actual balances |
| GET | `/reconcile` | Yes | View discrepancies |
| GET | `/export/pdf` | Yes | Download PDF report |

For full request/response details, see [docs/API.md](docs/API.md).

## Key Concepts

### Sources

A source represents where money is held — cash, a bank account, Opay, etc. Each source tracks its own balance and currency. Retrieving a source by ID returns its full transaction history.

### Transactions

Every money movement is a transaction with one of three types:

| Type | Effect |
|---|---|
| `inflow` | Money comes in → source balance increases |
| `outflow` | Money goes out → source balance decreases |
| `transfer` | Money moves between sources → source decreases, target increases |

### Reconciliation

Allows users to input their actual real-world balance for each source. The system compares it against the app's computed balance and reports discrepancies, helping users find untracked spending.

### Dashboard

Returns a snapshot of the user's finances:
- Total balance across all sources
- Per-source balances
- Current month's inflow/outflow totals
- 10 most recent transactions

### PDF Export

Download a formatted PDF report of all transactions in a given date range, including a summary with total inflow, total outflow, and net. Currency is formatted as Nigerian Naira (NGN).

## License

Private — all rights reserved.

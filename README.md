# Budgety

A personal finance management application for tracking income, expenses, and transfers across multiple money sources. Built with a **React** frontend and **NestJS** backend.

## Tech Stack

### Backend

- **Runtime:** [Bun](https://bun.sh/)
- **Framework:** [NestJS](https://nestjs.com/) (TypeScript)
- **Authentication:** JWT via Passport
- **Validation:** class-validator + class-transformer
- **PDF Export:** pdfkit
- **Data Storage:** In-memory (no database required)

### Frontend

- **Framework:** [React 19](https://react.dev/) (TypeScript)
- **Build Tool:** [Vite 7](https://vite.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **State Management:** [Zustand](https://zustand.docs.pmnd.rs/)
- **Forms:** react-hook-form + Zod
- **Charts:** Chart.js / Recharts
- **Icons:** Lucide React
- **Animations:** Framer Motion

## Prerequisites

- [Bun](https://bun.sh/) (v1.0 or later)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/miyemi/Budgety.git
cd Budgety
```

### 2. Backend Setup

```bash
cd backend
bun install
```

Create a `.env` file in the `backend/` directory:

```env
JWT_SECRET=change-this-to-a-secure-random-string
JWT_EXPIRATION=7d
PORT=3000
```

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `budgety-dev-secret` | Secret key for signing JWT tokens |
| `JWT_EXPIRATION` | `7d` | Token expiry duration (e.g. `1h`, `7d`, `30d`) |
| `PORT` | `3000` | Server listening port |

Start the backend:

```bash
# Development (with hot-reload)
bun run start:dev

# Production
bun run build
bun run start:prod
```

The API will be available at **http://localhost:3000**.

> **Note:** The backend uses an in-memory data store. All data is lost when the server restarts. This is by design — the `StorageService` can be swapped out for a real database (TypeORM, Prisma, etc.) without changing any other code.

### 3. Frontend Setup

```bash
cd frontend
bun install
```

Start the frontend:

```bash
# Development
bun run dev

# Production build
bun run build
bun run preview
```

The frontend dev server will start at **http://localhost:5173** (Vite default).

### 4. Running Both Together

Open two terminal windows:

```bash
# Terminal 1 — Backend
cd backend
bun run start:dev

# Terminal 2 — Frontend
cd frontend
bun run dev
```

## Project Structure

```
Budgety/
├── backend/
│   ├── src/
│   │   ├── main.ts                    # Entry point (CORS, validation pipe)
│   │   ├── app.module.ts              # Root module
│   │   ├── common/
│   │   │   ├── decorators/            # @CurrentUser() decorator
│   │   │   ├── interfaces/            # TypeScript interfaces (User, Source, Transaction, etc.)
│   │   │   ├── services/
│   │   │   │   └── storage.service.ts # In-memory data store
│   │   │   └── utils/
│   │   │       └── pdf.util.ts        # PDF report generation
│   │   └── modules/
│   │       ├── auth/                  # Register, login, JWT strategy
│   │       ├── sources/               # Money sources CRUD
│   │       ├── transactions/          # Transactions CRUD + balance management
│   │       ├── categories/            # Income/expense categories CRUD
│   │       ├── dashboard/             # Aggregated financial overview
│   │       ├── reconciliation/        # Balance verification
│   │       └── export/                # PDF export
│   ├── .env                           # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx                   # App bootstrap
│   │   ├── App.tsx                    # Routes and layout
│   │   ├── index.css                  # Tailwind + theme variables
│   │   ├── lib/utils.ts              # cn() utility
│   │   ├── components/
│   │   │   ├── layout/               # AppContainer, Navbar, Sidebar
│   │   │   ├── charts/               # Inflow, Outflow, Transaction, Transfer charts
│   │   │   └── ui/                   # shadcn/ui components
│   │   └── features/
│   │       ├── dashboard/            # Dashboard page
│   │       ├── addsource/            # Source management
│   │       ├── transactions/         # Transaction management
│   │       ├── reports/              # Reports page
│   │       ├── reconcilation/        # Reconciliation page
│   │       └── settingPage/          # Settings page
│   ├── components.json               # shadcn/ui configuration
│   ├── vite.config.ts                # Vite config (React + Tailwind plugins, @ alias)
│   └── package.json
│
└── README.md
```

## API Endpoints

All endpoints except auth require a `Authorization: Bearer <token>` header.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create an account |
| POST | `/auth/login` | No | Get JWT access token |
| GET | `/sources` | Yes | List money sources |
| POST | `/sources` | Yes | Create a source |
| GET | `/sources/:id` | Yes | Get source with transaction history |
| PATCH | `/sources/:id` | Yes | Update a source |
| DELETE | `/sources/:id` | Yes | Delete a source |
| GET | `/transactions` | Yes | List transactions (filterable) |
| POST | `/transactions` | Yes | Create a transaction |
| PATCH | `/transactions/:id` | Yes | Update a transaction |
| DELETE | `/transactions/:id` | Yes | Delete a transaction |
| GET | `/categories` | Yes | List categories |
| POST | `/categories` | Yes | Create a category |
| PATCH | `/categories/:id` | Yes | Update a category |
| DELETE | `/categories/:id` | Yes | Delete a category |
| GET | `/dashboard` | Yes | Financial overview |
| POST | `/reconcile` | Yes | Submit actual balances |
| GET | `/reconcile` | Yes | View balance discrepancies |
| GET | `/export/pdf` | Yes | Download PDF report |

## Frontend Routes

| Path | Page |
|---|---|
| `/` | Dashboard |
| `/source` | Source listing |
| `/source/id` | Individual source details |
| `/transaction` | Transaction listing |
| `/report` | Reports |
| `/reconcilation` | Reconciliation |
| `/setting` | Settings |

## Available Scripts

### Backend (`backend/`)

| Script | Command | Description |
|---|---|---|
| `bun run start:dev` | `bun --watch src/main.ts` | Development with hot-reload |
| `bun run build` | `nest build` | Compile TypeScript |
| `bun run start` | `bun dist/main.js` | Run compiled output |
| `bun run start:prod` | `NODE_ENV=production bun dist/main.js` | Production mode |

### Frontend (`frontend/`)

| Script | Command | Description |
|---|---|---|
| `bun run dev` | `vite` | Start dev server |
| `bun run build` | `tsc -b && vite build` | Type-check and build |
| `bun run preview` | `vite preview` | Preview production build |
| `bun run lint` | `eslint .` | Run linter |

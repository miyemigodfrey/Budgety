# Budgety Backend

Node.js + Express + MongoDB backend for Budgety app.

Quick start:

1. Copy `.env.example` to `.env` and set values.
2. Install dependencies: `npm install`.
3. Run in dev: `npm run dev`.

API endpoints:

- `POST /api/auth/register` - register
- `POST /api/auth/login` - login
- `GET/POST/PUT/DELETE /api/transactions` - transactions CRUD (auth required)
- `GET/POST/PUT/DELETE /api/categories` - categories CRUD (auth required)
- `GET /api/summary/monthly?year=YYYY&month=MM` - monthly summary (auth required)

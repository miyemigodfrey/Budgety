# Budgety API Reference

Base URL: `http://localhost:3000`

All authenticated endpoints require:

```
Authorization: Bearer <token>
```

Validation errors return `400` with a `message` array describing each violation.

---

## Auth

### POST `/auth/register`

Create a new user account.

**Request body:**

| Field      | Type   | Required | Rules              |
| ---------- | ------ | -------- | ------------------ |
| `name`     | string | yes      | min 2 characters   |
| `email`    | string | yes      | valid email format |
| `password` | string | yes      | min 6 characters   |

**Example:**

```json
POST /auth/register
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secure123"
}
```

**Response `201`:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "jane@example.com",
    "name": "Jane Doe"
  }
}
```

**Errors:**

- `400` — Email already registered
- `400` — Validation errors

---

### POST `/auth/login`

Authenticate and receive a token.

**Request body:**

| Field      | Type   | Required | Rules              |
| ---------- | ------ | -------- | ------------------ |
| `email`    | string | yes      | valid email format |
| `password` | string | yes      | —                  |

**Example:**

```json
POST /auth/login
{
  "email": "jane@example.com",
  "password": "secure123"
}
```

**Response `200`:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "jane@example.com",
    "name": "Jane Doe"
  }
}
```

**Errors:**

- `401` — Invalid credentials

---

## Sources

All endpoints require authentication.

### GET `/sources`

List all sources for the authenticated user.

**Response `200`:**

```json
[
  {
    "id": "6ea4cb02-...",
    "userId": "a1b2c3d4-...",
    "name": "Cash",
    "balance": 50000,
    "currency": "NGN",
    "createdAt": "2026-03-11T10:00:00.000Z",
    "updatedAt": "2026-03-11T10:00:00.000Z"
  }
]
```

---

### POST `/sources`

Create a new money source.

**Request body:**

| Field      | Type   | Required | Rules           | Default |
| ---------- | ------ | -------- | --------------- | ------- |
| `name`     | string | yes      | min 1 character | —       |
| `balance`  | number | yes      | >= 0            | —       |
| `currency` | string | no       | —               | `"NGN"` |

**Example:**

```json
POST /sources
{
  "name": "Opay",
  "balance": 100000,
  "currency": "NGN"
}
```

**Response `201`:** The created source object.

---

### GET `/sources/:id`

Get a source with its full transaction history.

**Response `200`:**

```json
{
  "id": "6ea4cb02-...",
  "userId": "a1b2c3d4-...",
  "name": "Cash",
  "balance": 75000,
  "currency": "NGN",
  "createdAt": "2026-03-11T10:00:00.000Z",
  "updatedAt": "2026-03-11T12:00:00.000Z",
  "transactions": [
    {
      "id": "12e9c404-...",
      "sourceId": "6ea4cb02-...",
      "type": "inflow",
      "amount": 20000,
      "category": "Salary",
      "note": "",
      "date": "2026-03-01T00:00:00.000Z",
      "createdAt": "2026-03-11T10:05:00.000Z",
      "updatedAt": "2026-03-11T10:05:00.000Z"
    }
  ]
}
```

**Errors:**

- `404` — Source not found

---

### PATCH `/sources/:id`

Update a source's name or currency. Balance cannot be changed directly — use transactions.

**Request body (all fields optional):**

| Field      | Type   | Rules           |
| ---------- | ------ | --------------- |
| `name`     | string | min 1 character |
| `currency` | string | —               |

**Response `200`:** The updated source object.

**Errors:**

- `404` — Source not found

---

### DELETE `/sources/:id`

Delete a source and all associated transactions.

**Response `200`:**

```json
{ "message": "Source deleted" }
```

**Errors:**

- `404` — Source not found

---

## Transactions

All endpoints require authentication.

### GET `/transactions`

List transactions with optional filters. Results are sorted by date descending.

**Query parameters (all optional):**

| Param       | Type                                | Description                                                |
| ----------- | ----------------------------------- | ---------------------------------------------------------- |
| `sourceId`  | UUID string                         | Filter by source (matches both source and transfer target) |
| `type`      | `inflow` \| `outflow` \| `transfer` | Filter by transaction type                                 |
| `startDate` | `YYYY-MM-DD`                        | Inclusive start date                                       |
| `endDate`   | `YYYY-MM-DD`                        | Inclusive end date                                         |

**Example:**

```
GET /transactions?sourceId=6ea4cb02-...&type=inflow&startDate=2026-03-01&endDate=2026-03-31
```

**Response `200`:** Array of transaction objects.

---

### POST `/transactions`

Create a transaction. The source balance is updated automatically.

**Request body:**

| Field              | Type            | Required    | Rules                                    |
| ------------------ | --------------- | ----------- | ---------------------------------------- |
| `sourceId`         | UUID string     | yes         | Must exist and belong to user            |
| `type`             | string          | yes         | `"inflow"`, `"outflow"`, or `"transfer"` |
| `amount`           | number          | yes         | > 0 (minimum 0.01)                       |
| `category`         | string          | yes         | —                                        |
| `note`             | string          | no          | Defaults to `""`                         |
| `date`             | ISO date string | yes         | e.g. `"2026-03-15"`                      |
| `transferTargetId` | UUID string     | conditional | Required when `type` is `"transfer"`     |

**Examples:**

Inflow:

```json
POST /transactions
{
  "sourceId": "6ea4cb02-...",
  "type": "inflow",
  "amount": 20000,
  "category": "Salary",
  "note": "March salary",
  "date": "2026-03-01"
}
```

Transfer:

```json
POST /transactions
{
  "sourceId": "78ec48b4-...",
  "type": "transfer",
  "amount": 10000,
  "category": "Transfer",
  "date": "2026-03-03",
  "transferTargetId": "6ea4cb02-..."
}
```

**Response `201`:** The created transaction object.

**Errors:**

- `400` — Insufficient balance for outflow/transfer
- `400` — `transferTargetId` missing for transfer type
- `400` — Cannot transfer to the same source
- `404` — Source or transfer target not found

---

### PATCH `/transactions/:id`

Edit a transaction. The system reverses the old balance effects and applies the new ones. If the edit would cause a negative balance, it is rejected and rolled back.

**Request body (all fields optional):**

| Field              | Type            | Rules                                    |
| ------------------ | --------------- | ---------------------------------------- |
| `sourceId`         | UUID string     | Must exist                               |
| `type`             | string          | `"inflow"`, `"outflow"`, or `"transfer"` |
| `amount`           | number          | > 0 (minimum 0.01)                       |
| `category`         | string          | —                                        |
| `note`             | string          | —                                        |
| `date`             | ISO date string | —                                        |
| `transferTargetId` | UUID string     | Required when type is `"transfer"`       |

**Response `200`:** The updated transaction object.

**Errors:**

- `400` — Edit would cause negative balance (rolled back)
- `404` — Transaction not found

---

### DELETE `/transactions/:id`

Delete a transaction and reverse its balance effects.

**Response `200`:**

```json
{ "message": "Transaction deleted" }
```

**Errors:**

- `400` — Reversal would cause negative balance
- `404` — Transaction not found

---

## Categories

All endpoints require authentication.

### GET `/categories`

List all categories for the authenticated user.

**Response `200`:**

```json
[
  {
    "id": "d4e5f6a7-...",
    "userId": "a1b2c3d4-...",
    "name": "Food",
    "type": "expense"
  }
]
```

---

### POST `/categories`

Create a category.

**Request body:**

| Field  | Type   | Required | Rules                     |
| ------ | ------ | -------- | ------------------------- |
| `name` | string | yes      | min 1 character           |
| `type` | string | yes      | `"income"` or `"expense"` |

**Response `201`:** The created category object.

**Errors:**

- `400` — Category with this name and type already exists

---

### PATCH `/categories/:id`

Update a category.

**Request body (all fields optional):**

| Field  | Type   | Rules                     |
| ------ | ------ | ------------------------- |
| `name` | string | min 1 character           |
| `type` | string | `"income"` or `"expense"` |

**Response `200`:** The updated category object.

**Errors:**

- `404` — Category not found

---

### DELETE `/categories/:id`

Delete a category.

**Response `200`:**

```json
{ "message": "Category deleted" }
```

**Errors:**

- `404` — Category not found

---

## Dashboard

### GET `/dashboard`

Returns an aggregated financial overview for the authenticated user.

**Response `200`:**

```json
{
  "totalBalance": 165000,
  "sources": [
    {
      "id": "6ea4cb02-...",
      "name": "Cash",
      "balance": 75000,
      "currency": "NGN"
    },
    {
      "id": "78ec48b4-...",
      "name": "Opay",
      "balance": 90000,
      "currency": "NGN"
    }
  ],
  "monthly": {
    "period": "2026-03",
    "inflow": 20000,
    "outflow": 5000,
    "net": 15000
  },
  "recentTransactions": [
    {
      "id": "59451095-...",
      "sourceId": "78ec48b4-...",
      "type": "transfer",
      "amount": 10000,
      "category": "Transfer",
      "note": "",
      "date": "2026-03-03T00:00:00.000Z",
      "transferTargetId": "6ea4cb02-...",
      "sourceName": "Opay",
      "transferTargetName": "Cash",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**Fields:**

- `totalBalance` — sum of all source balances
- `sources` — per-source balance summary
- `monthly` — current calendar month's inflow, outflow, and net
- `recentTransactions` — last 10 transactions (most recent first), enriched with `sourceName` and `transferTargetName`

---

## Reconciliation

### POST `/reconcile`

Submit actual real-world balances for your sources. The system compares them against computed app balances and stores the discrepancy.

**Request body:**

```json
{
  "entries": [
    { "sourceId": "6ea4cb02-...", "actualBalance": 70000 },
    { "sourceId": "78ec48b4-...", "actualBalance": 88000 }
  ]
}
```

**Entry fields:**

| Field           | Type        | Required | Rules      |
| --------------- | ----------- | -------- | ---------- |
| `sourceId`      | UUID string | yes      | Must exist |
| `actualBalance` | number      | yes      | >= 0       |

**Response `201`:**

```json
[
  {
    "id": "76f13169-...",
    "userId": "a1b2c3d4-...",
    "sourceId": "6ea4cb02-...",
    "actualBalance": 70000,
    "appBalance": 75000,
    "discrepancy": -5000,
    "reconciledAt": "2026-03-11T21:27:36.818Z",
    "sourceName": "Cash"
  }
]
```

`discrepancy` = `actualBalance` - `appBalance`. Negative means money is missing, positive means extra.

**Errors:**

- `404` — Source not found

---

### GET `/reconcile`

View the latest reconciliation records. Discrepancies are recalculated against current app balances.

**Response `200`:**

```json
[
  {
    "sourceId": "6ea4cb02-...",
    "sourceName": "Cash",
    "actualBalance": 70000,
    "appBalance": 75000,
    "discrepancy": -5000,
    "reconciledAt": "2026-03-11T21:27:36.818Z"
  }
]
```

---

## Export

### GET `/export/pdf`

Download a PDF report of all transactions within a date range.

**Query parameters (both required):**

| Param       | Type         | Example      |
| ----------- | ------------ | ------------ |
| `startDate` | `YYYY-MM-DD` | `2026-03-01` |
| `endDate`   | `YYYY-MM-DD` | `2026-03-31` |

**Example:**

```
GET /export/pdf?startDate=2026-03-01&endDate=2026-03-31
```

**Response:** Binary PDF file with headers:

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="budgety-report-2026-03-01-to-2026-03-31.pdf"`

The PDF contains:

- Report title and date range
- Summary — total inflow, total outflow, net
- Transaction table — date, type, source, category, amount, note

**Errors:**

- `400` — Missing `startDate` or `endDate`
- `404` — No sources found for user

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Description of what went wrong",
  "error": "Bad Request"
}
```

Validation errors return an array of messages:

```json
{
  "statusCode": 400,
  "message": ["amount must not be less than 0.01", "sourceId must be a UUID"],
  "error": "Bad Request"
}
```

Common status codes:

| Code  | Meaning                                     |
| ----- | ------------------------------------------- |
| `200` | Successful retrieval or update              |
| `201` | Successful creation                         |
| `400` | Validation error or business rule violation |
| `401` | Missing or invalid JWT token                |
| `404` | Resource not found                          |

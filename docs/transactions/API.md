# Transaction API Reference

## Base URL

```
/api/transactions
```

## Authentication

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

## Endpoints

### POST /api/transactions

Create a new transaction.

**Auth:** Required (Customer, Admin)

**Request Body:**

```json
{
  "type": "DEPOSIT",
  "accountId": "acct_abc123",
  "counterpartyAccountId": "acct_xyz789",
  "amount": "1000.00",
  "currency": "USD",
  "idempotencyKey": "unique-key-123",
  "description": "Monthly deposit",
  "metadata": {
    "source": "payroll"
  }
}
```

**Response (201):**

```json
{
  "id": "txn_abc123",
  "referenceNumber": "TXN-20260718-A1B2C3",
  "type": "DEPOSIT",
  "status": "COMPLETED",
  "accountId": "acct_abc123",
  "counterpartyAccountId": null,
  "amount": "1000.00",
  "currency": "USD",
  "description": "Monthly deposit",
  "metadata": { "source": "payroll" },
  "createdAt": "2026-07-18T20:00:00.000Z",
  "updatedAt": "2026-07-18T20:00:00.000Z",
  "completedAt": "2026-07-18T20:00:00.000Z",
  "failedAt": null,
  "cancelledAt": null,
  "reversedAt": null,
  "reversalTransactionId": null,
  "createdBy": "user_abc123",
  "updatedBy": null
}
```

**Errors:**
- `400` — Invalid input or business rule violation
- `403` — Policy violation
- `404` — Account not found
- `409` — Duplicate reference number

---

### GET /api/transactions/:id

Get a transaction by ID.

**Auth:** Required (Owner or Admin)

**Parameters:**
| Param | Type | Description |
|---|---|---|
| `id` | string | Transaction ID |

**Response (200):** TransactionResponseDto

**Errors:**
- `403` — Not the owner
- `404` — Transaction not found

---

### GET /api/transactions/reference/:referenceNumber

Get a transaction by reference number.

**Auth:** Required (Owner or Admin)

**Parameters:**
| Param | Type | Description |
|---|---|---|
| `referenceNumber` | string | e.g., TXN-20260718-A1B2C3 |

**Response (200):** TransactionResponseDto

---

### GET /api/transactions/search

Search transactions with filters.

**Auth:** Required (Owner sees own; Admin sees all)

**Query Parameters:**
| Param | Type | Required | Description |
|---|---|---|---|
| `referenceNumber` | string | No | Exact reference match |
| `type` | enum | No | Transaction type filter |
| `status` | enum | No | Status filter |
| `accountId` | string | No | Account filter |
| `currency` | string | No | Currency filter (3-letter ISO) |
| `startDate` | string | No | ISO 8601 date |
| `endDate` | string | No | ISO 8601 date |
| `minAmount` | string | No | Minimum amount |
| `maxAmount` | string | No | Maximum amount |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20, max: 100) |

**Response (200):**

```json
{
  "data": [ ...TransactionResponseDto ],
  "total": 150,
  "page": 1,
  "limit": 20,
  "hasNext": true,
  "hasPrev": false
}
```

---

### POST /api/transactions/:id/cancel

Cancel a pending transaction.

**Auth:** Required (Owner or Admin)

**Parameters:**
| Param | Type | Description |
|---|---|---|
| `id` | string | Transaction ID |

**Request Body:**

```json
{
  "reason": "Changed my mind"
}
```

**Response (200):** TransactionResponseDto with status `CANCELLED`

**Errors:**
- `400` — Transaction not in cancellable state
- `403` — Not the owner
- `404` — Transaction not found

---

### POST /api/transactions/:id/reverse

Reverse a completed transaction.

**Auth:** Required (Owner or Admin)

**Parameters:**
| Param | Type | Description |
|---|---|---|
| `id` | string | Transaction ID |

**Request Body:**

```json
{
  "reason": "Duplicate payment"
}
```

**Response (200):** TransactionResponseDto with status `REVERSED`

**Errors:**
- `400` — Transaction not in reversible state
- `403` — Not the owner
- `404` — Transaction not found

---

### GET /api/transactions/account/:accountId

Get transactions for a specific account.

**Auth:** Required (Account owner or Admin)

**Parameters:**
| Param | Type | Description |
|---|---|---|
| `accountId` | string | Account ID |
| `page` | query | Page number |
| `limit` | query | Items per page |

**Response (200):**

```json
{
  "data": [ ...TransactionResponseDto ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "hasNext": true,
  "hasPrev": false
}
```

---

## Transaction Types

| Enum Value | Description |
|---|---|
| `DEPOSIT` | Cash or check deposit |
| `WITHDRAWAL` | Cash withdrawal |
| `INTERNAL_TRANSFER` | Transfer between own accounts |
| `ACH_CREDIT` | Incoming ACH |
| `ACH_DEBIT` | Outgoing ACH |
| `WIRE_DOMESTIC` | Domestic wire transfer |
| `WIRE_INTERNATIONAL` | International wire transfer |
| `SWIFT` | SWIFT transfer |
| `CARD_PURCHASE` | Card point-of-sale purchase |
| `CARD_REFUND` | Card refund |
| `CARD_AUTHORIZATION` | Card pre-authorization |
| `CARD_CAPTURE` | Card capture of authorization |
| `CRYPTO_DEPOSIT` | Cryptocurrency deposit |
| `CRYPTO_WITHDRAWAL` | Cryptocurrency withdrawal |
| `PAYROLL_DEPOSIT` | Direct deposit payroll |
| `INTEREST_CREDIT` | Interest earned |
| `FEE` | Account fee |
| `ADJUSTMENT` | Manual adjustment |
| `LOAN_DISBURSEMENT` | Loan funds disbursed |
| `LOAN_REPAYMENT` | Loan repayment |
| `INVESTMENT_PURCHASE` | Investment buy |
| `INVESTMENT_SALE` | Investment sell |
| `REVERSAL` | Reversal of a prior transaction |

## Transaction Statuses

| Enum Value | Description |
|---|---|
| `CREATED` | Transaction initiated |
| `VALIDATED` | Business rules validated |
| `AUTHORIZED` | Policy authorized |
| `PENDING` | Awaiting processing |
| `POSTED` | Ledger entries created |
| `SETTLED` | Funds settled |
| `COMPLETED` | Fully processed |
| `FAILED` | Processing failed |
| `CANCELLED` | Cancelled |
| `REVERSED` | Reversed |
| `EXPIRED` | Expired |

---

## Statement Export (Placeholder)

```
GET /api/transactions/account/:accountId/statement
```

Returns placeholder statement data. PDF generation is not yet implemented.

---

## Swagger UI

Interactive API documentation is available at:

```
/api/docs
```

All endpoints are fully documented with request/response schemas, examples, and error codes.
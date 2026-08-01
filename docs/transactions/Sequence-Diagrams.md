# Transaction Sequence Diagrams

## 1. Deposit Flow

```
Client          Controller        Service           Policy           Repository       LedgerService
  │                 │                │                 │                 │                │
  │  POST /deposit  │                │                 │                 │                │
  │────────────────>│                │                 │                 │                │
  │                 │  create(dto)   │                 │                 │                │
  │                 │───────────────>│                 │                 │                │
  │                 │                │ findByIdempotencyKey             │                │
  │                 │                │──────────────────────────────────>│                │
  │                 │                │<──────────────────────────────────│                │
  │                 │                │                 │                 │                │
  │                 │                │ authorize(user, account, DEPOSIT)│                │
  │                 │                │───────────────>│                 │                │
  │                 │                │  PolicyResult   │                 │                │
  │                 │                │<────────────────│                 │                │
  │                 │                │                 │                 │                │
  │                 │                │ create(txn)     │                 │                │
  │                 │                │──────────────────────────────────>│                │
  │                 │                │<──────────────────────────────────│                │
  │                 │                │                 │                 │                │
  │                 │                │ postJournal(entries)              │                │
  │                 │                │──────────────────────────────────────────────────>│
  │                 │                │<──────────────────────────────────────────────────│
  │                 │                │                 │                 │                │
  │                 │                │ updateStatus(COMPLETED)           │                │
  │                 │                │──────────────────────────────────>│                │
  │                 │                │<──────────────────────────────────│                │
  │                 │                │                 │                 │                │
  │                 │  TransactionResponseDto           │                │                │
  │                 │<───────────────│                 │                 │                │
  │  201 Created    │                │                 │                 │                │
  │<────────────────│                │                 │                 │                │
```

## 2. Internal Transfer Flow

```
Client          Controller        Service           Policy           Repository       LedgerService      EventEmitter
  │                 │                │                 │                 │                │                  │
  │ POST /transfer  │                │                 │                 │                │                  │
  │────────────────>│                │                 │                 │                │                  │
  │                 │  create(dto)   │                 │                 │                │                  │
  │                 │───────────────>│                 │                 │                │                  │
  │                 │                │ findByIdempotencyKey             │                │                  │
  │                 │                │──────────────────────────────────>│                │                  │
  │                 │                │<──────────────────────────────────│                │                  │
  │                 │                │                 │                 │                │                  │
  │                 │                │ [Lookup source account]           │                │                  │
  │                 │                │ [Lookup destination account]      │                │                  │
  │                 │                │                 │                 │                │                  │
  │                 │                │ authorize(user, srcAccount,       │                │                  │
  │                 │                │   INTERNAL_TRANSFER, dstAccount)  │                │                  │
  │                 │                │───────────────>│                 │                │                  │
  │                 │                │  PolicyResult   │                 │                │                  │
  │                 │                │<────────────────│                 │                │                  │
  │                 │                │                 │                 │                │                  │
  │                 │                │ create(txn)     │                 │                │                  │
  │                 │                │──────────────────────────────────>│                │                  │
  │                 │                │<──────────────────────────────────│                │                  │
  │                 │                │                 │                 │                │                  │
  │                 │                │ postJournal(                    │                │                  │
  │                 │                │   debit: srcAccount,             │                │                  │
  │                 │                │   credit: dstAccount)            │                │                  │
  │                 │                │──────────────────────────────────────────────────>│                  │
  │                 │                │<──────────────────────────────────────────────────│                  │
  │                 │                │                 │                 │                │                  │
  │                 │                │ updateStatus(COMPLETED)           │                │                  │
  │                 │                │──────────────────────────────────>│                │                  │
  │                 │                │                 │                 │                │                  │
  │                 │                │ emit(TransactionCompleted)        │                │                  │
  │                 │                │──────────────────────────────────────────────────────────────────────>│
  │                 │                │                 │                 │                │                  │
  │                 │  TransactionResponseDto           │                │                │                  │
  │                 │<───────────────│                 │                 │                │                  │
  │  201 Created    │                │                 │                 │                │                  │
  │<────────────────│                │                 │                 │                │                  │
```

## 3. Reversal Flow

```
Client          Controller        Service           Policy           Repository       LedgerService      EventEmitter
  │                 │                │                 │                 │                │                  │
  │ POST /:id/reverse               │                 │                 │                │                  │
  │────────────────>│                │                 │                 │                │                  │
  │                 │ reverse(id, reason)              │                 │                │                  │
  │                 │───────────────>│                 │                 │                │                  │
  │                 │                │ findById(id)    │                 │                │                  │
  │                 │                │──────────────────────────────────>│                │                  │
  │                 │                │<──────────────────────────────────│                │                  │
  │                 │                │                 │                 │                │                  │
  │                 │                │ authorize(user, REVERSAL)         │                │                  │
  │                 │                │───────────────>│                 │                │                  │
  │                 │                │  PolicyResult   │                 │                │                  │
  │                 │                │<────────────────│                 │                │                  │
  │                 │                │                 │                 │                │                  │
  │                 │                │ reverseJournal(originalJournalId) │                │                  │
  │                 │                │──────────────────────────────────────────────────>│                  │
  │                 │                │<──────────────────────────────────────────────────│                  │
  │                 │                │                 │                 │                │                  │
  │                 │                │ create(reversalTxn)               │                │                  │
  │                 │                │──────────────────────────────────>│                │                  │
  │                 │                │<──────────────────────────────────│                │                  │
  │                 │                │                 │                 │                │                  │
  │                 │                │ updateStatus(originalTxn, REVERSED)               │                  │
  │                 │                │──────────────────────────────────>│                │                  │
  │                 │                │                 │                 │                │                  │
  │                 │                │ emit(TransactionReversed)         │                │                  │
  │                 │                │──────────────────────────────────────────────────────────────────────>│
  │                 │                │                 │                 │                │                  │
  │                 │  TransactionResponseDto           │                │                │                  │
  │                 │<───────────────│                 │                 │                │                  │
  │  200 OK         │                │                 │                 │                │                  │
  │<────────────────│                │                 │                 │                │                  │
```

## 4. Idempotent Create (Duplicate Key)

```
Client          Controller        Service           Repository
  │                 │                │                 │
  │  POST /txn      │                │                 │
  │  (idempotency: "abc")            │                 │
  │────────────────>│                │                 │
  │                 │  create(dto)   │                 │
  │                 │───────────────>│                 │
  │                 │                │ findByIdempotencyKey("abc")      │
  │                 │                │──────────────────────────────────>│
  │                 │                │  (existing txn found)             │
  │                 │                │<──────────────────────────────────│
  │                 │                │                 │
  │                 │                │ [Skip creation, return existing]  │
  │                 │                │                 │
  │                 │  TransactionResponseDto           │
  │                 │<───────────────│                 │
  │  200 OK         │                │                 │
  │  (same response as original)     │                 │
  │<────────────────│                │                 │
```

## 5. Failed Transaction (Policy Violation)

```
Client          Controller        Service           Policy           Repository       EventEmitter
  │                 │                │                 │                 │                │
  │  POST /txn      │                │                 │                 │                │
  │────────────────>│                │                 │                 │                │
  │                 │  create(dto)   │                 │                 │                │
  │                 │───────────────>│                 │                 │                │
  │                 │                │ authorize(user, account, WITHDRAWAL)              │
  │                 │                │───────────────>│                 │                │
  │                 │                │  PolicyResult(violations: [                       │
  │                 │                │    "Insufficient balance"])       │                │
  │                 │                │<────────────────│                 │                │
  │                 │                │                 │                 │                │
  │                 │                │ create(txn, status: FAILED)       │                │
  │                 │                │──────────────────────────────────>│                │
  │                 │                │                 │                 │                │
  │                 │                │ emit(TransactionFailed)           │                │
  │                 │                │──────────────────────────────────────────────────>│
  │                 │                │                 │                 │                │
  │                 │  throw PolicyViolationException   │                │                │
  │                 │<───────────────│                 │                 │                │
  │  403 Forbidden  │                │                 │                 │                │
  │<────────────────│                │                 │                 │                │
```

## 6. Search Flow

```
Client          Controller        Service           Policy           Repository
  │                 │                │                 │                 │
  │  GET /search    │                │                 │                 │
  │  ?type=DEPOSIT  │                │                 │                 │
  │  &status=COMPLETED              │                 │                 │
  │────────────────>│                │                 │                 │
  │                 │ search(filters)│                 │                 │
  │                 │───────────────>│                 │                 │
  │                 │                │ authorize(user, READ)             │
  │                 │                │───────────────>│                 │
  │                 │                │  PolicyResult   │                 │
  │                 │                │<────────────────│                 │
  │                 │                │                 │                 │
  │                 │                │ search(filters, userId, role)     │
  │                 │                │──────────────────────────────────>│
  │                 │                │<──────────────────────────────────│
  │                 │                │                 │                 │
  │                 │  PaginatedResponseDto            │                 │
  │                 │<───────────────│                 │                 │
  │  200 OK         │                │                 │                 │
  │<────────────────│                │                 │                 │
```

## 7. Cancellation Flow

```
Client          Controller        Service           Policy           Repository       EventEmitter
  │                 │                │                 │                 │                │
  │  POST /:id/cancel               │                 │                 │                │
  │────────────────>│                │                 │                 │                │
  │                 │ cancel(id, reason)               │                 │                │
  │                 │───────────────>│                 │                 │                │
  │                 │                │ findByIdAndUser(id, userId)       │                │
  │                 │                │──────────────────────────────────>│                │
  │                 │                │<──────────────────────────────────│                │
  │                 │                │                 │                 │                │
  │                 │                │ authorize(user, CANCEL)           │                │
  │                 │                │───────────────>│                 │                │
  │                 │                │  PolicyResult   │                 │                │
  │                 │                │<────────────────│                 │                │
  │                 │                │                 │                 │                │
  │                 │                │ updateStatus(CANCELLED)           │                │
  │                 │                │──────────────────────────────────>│                │
  │                 │                │<──────────────────────────────────│                │
  │                 │                │                 │                 │                │
  │                 │                │ emit(TransactionCancelled)        │                │
  │                 │                │──────────────────────────────────────────────────>│
  │                 │                │                 │                 │                │
  │                 │  TransactionResponseDto           │                │                │
  │                 │<───────────────│                 │                 │                │
  │  200 OK         │                │                 │                 │                │
  │<────────────────│                │                 │                 │                │
# Transaction Lifecycle

## State Machine

Every transaction progresses through a defined set of states. State transitions are strictly controlled by the Transaction Policy engine.

```
                    ┌──────────┐
                    │ CREATED  │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │VALIDATED │
                    └────┬─────┘
                         │
                    ┌────▼──────┐
                    │AUTHORIZED │
                    └────┬──────┘
                         │
                    ┌────▼─────┐
                    │ PENDING  │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │  POSTED  │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │ SETTLED  │
                    └────┬─────┘
                         │
                    ┌────▼──────┐
                    │ COMPLETED │
                    └───────────┘
```

## States

| State | Description | Transitions To |
|---|---|---|
| **CREATED** | Transaction record created in the database | VALIDATED, FAILED, CANCELLED |
| **VALIDATED** | All business validations passed | AUTHORIZED, FAILED, CANCELLED |
| **AUTHORIZED** | Policy authorization passed | PENDING, FAILED, CANCELLED |
| **PENDING** | Awaiting processing (e.g., ACH, wire) | POSTED, FAILED, CANCELLED |
| **POSTED** | Ledger journal entries posted | SETTLED, FAILED, REVERSED |
| **SETTLED** | Funds confirmed settled | COMPLETED, REVERSED |
| **COMPLETED** | Transaction fully processed | REVERSED |
| **FAILED** | Transaction failed at any stage | Terminal state |
| **CANCELLED** | Transaction cancelled by user or system | Terminal state |
| **REVERSED** | Transaction reversed via reversal workflow | Terminal state |
| **EXPIRED** | Transaction expired (e.g., uncaptured authorization) | Terminal state |

## Terminal States

- **FAILED** — The transaction encountered an error during processing. The ledger remains unchanged.
- **CANCELLED** — The transaction was cancelled before completion. No ledger impact.
- **REVERSED** — A completed transaction was reversed. A counter-journal is posted.
- **EXPIRED** — The transaction exceeded its validity window.

## State Transitions

### Normal Flow (Happy Path)

```
CREATED → VALIDATED → AUTHORIZED → PENDING → POSTED → SETTLED → COMPLETED
```

For simple transactions (deposits, withdrawals), the flow may be abbreviated:

```
CREATED → AUTHORIZED → POSTED → COMPLETED
```

### Cancellation Flow

```
CREATED → CANCELLED
VALIDATED → CANCELLED
AUTHORIZED → CANCELLED
PENDING → CANCELLED
```

### Failure Flow

```
CREATED → FAILED
VALIDATED → FAILED
AUTHORIZED → FAILED
PENDING → FAILED
POSTED → FAILED
```

### Reversal Flow

```
COMPLETED → REVERSED (with counter-transaction)
SETTLED → REVERSED (with counter-transaction)
POSTED → REVERSED (with counter-transaction)
```

## Rules

1. A transaction can only be cancelled from states: CREATED, VALIDATED, AUTHORIZED, PENDING
2. A transaction can only be reversed from states: POSTED, SETTLED, COMPLETED
3. A transaction can only be failed from states: CREATED, VALIDATED, AUTHORIZED, PENDING, POSTED
4. Reversal creates a new REVERSAL transaction with the opposite amount
5. Terminal states cannot transition to any other state
6. Failed transactions leave the ledger unchanged
7. Cancelled transactions leave the ledger unchanged

## Event Emission

Each state transition emits a corresponding domain event:

| Transition | Event |
|---|---|
| → CREATED | `TransactionCreated` |
| → AUTHORIZED | `TransactionAuthorized` |
| → POSTED | `TransactionPosted` |
| → SETTLED | `TransactionSettled` |
| → COMPLETED | `TransactionCompleted` |
| → FAILED | `TransactionFailed` |
| → CANCELLED | `TransactionCancelled` |
| → REVERSED | `TransactionReversed` |
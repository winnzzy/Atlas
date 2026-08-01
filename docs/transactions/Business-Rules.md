# Transaction Business Rules

## Core Rules

### 1. No Direct Balance Mutation
The Transaction module NEVER directly mutates account balances. All balance changes flow through the Ledger Engine.

### 2. Balanced Ledger Journals
Every successful transaction creates a balanced journal in the Ledger Engine. Debits equal credits.

### 3. Failed Transactions Leave Ledger Unchanged
If a transaction fails at any point, no ledger entries are created. The ledger remains in its previous state.

### 4. No Duplicate Reference Numbers
Every transaction has a unique reference number. Duplicate reference numbers are rejected.

### 5. No Duplicate Idempotency Keys
If a transaction with the same idempotency key exists, the original transaction is returned (idempotent response).

## Validation Rules

### Ownership
- Users can only view and manage their own transactions
- Admin users can view all transactions

### Permissions
- CREATE: Authenticated users can create transactions on their own accounts
- READ: Users can read their own transactions; admins can read all
- CANCEL: Users can cancel their own pending transactions
- REVERSE: Users can reverse their own completed transactions
- SETTLE: System-only operation
- FAIL: System-only operation

### Account Status
- Account must be ACTIVE to create transactions
- Frozen accounts: All transactions blocked
- Locked accounts: All transactions blocked
- Closed accounts: All transactions blocked
- Pending accounts: Deposits and interest credits allowed; other types blocked

### Currency
- Transaction currency must match the account currency

### Balance
- Withdrawals and outgoing transfers require sufficient available balance
- Deposits and incoming transfers have no balance requirement

### Limits
- Transactions must not exceed the account's daily transaction limit
- Transactions must not exceed the account's monthly transaction limit

## Transaction-Specific Rules

### Deposits
- Counterparty account not required
- Amount must be positive

### Withdrawals
- Counterparty account not required
- Requires sufficient available balance
- Subject to daily/monthly limits

### Internal Transfers
- Counterparty account is required
- Source and destination accounts must be different
- Both accounts must be ACTIVE
- Currency must match between accounts

### ACH
- Counterparty account required for ACH_CREDIT (destination)
- Counterparty account required for ACH_DEBIT (source)
- Settled status set by external system

### Wire / SWIFT
- Counterparty account required
- Metadata should contain wire instructions

### Card Transactions
- CARD_AUTHORIZATION creates a hold
- CARD_CAPTURE captures the hold
- CARD_REFUND reverses a capture

### Reversal
- Original transaction must be POSTED, SETTLED, or COMPLETED
- Creates a new REVERSAL transaction with counter-entries
- Original transaction status changes to REVERSED

## Status Transition Rules

| From → To | Valid |
|---|---|
| CREATED → VALIDATED | ✅ |
| CREATED → FAILED | ✅ |
| CREATED → CANCELLED | ✅ |
| VALIDATED → AUTHORIZED | ✅ |
| VALIDATED → FAILED | ✅ |
| VALIDATED → CANCELLED | ✅ |
| AUTHORIZED → PENDING | ✅ |
| AUTHORIZED → POSTED | ✅ |
| AUTHORIZED → FAILED | ✅ |
| AUTHORIZED → CANCELLED | ✅ |
| PENDING → POSTED | ✅ |
| PENDING → FAILED | ✅ |
| PENDING → CANCELLED | ✅ |
| POSTED → SETTLED | ✅ |
| POSTED → COMPLETED | ✅ |
| POSTED → FAILED | ✅ |
| POSTED → REVERSED | ✅ |
| SETTLED → COMPLETED | ✅ |
| SETTLED → REVERSED | ✅ |
| COMPLETED → REVERSED | ✅ |
| Any other transition | ❌ |

## Search & Export Rules

- Search supports: reference number, date range, amount, status, type, account, customer, currency
- Results are paginated with cursor-based pagination
- Statement generation returns placeholder data for future PDF export
- All searches and exports are logged for audit purposes

## Hooks (Future)

### Velocity Rules (Placeholder)
- Rate limiting per account
- Velocity checks per customer

### Compliance Hooks (Placeholder)
- Sanctions screening
- Transaction monitoring

### AML Hooks (Placeholder)
- Suspicious activity detection
- Currency Transaction Reports (CTR)

### Fraud Hooks (Placeholder)
- Device fingerprinting
- Behavioral analysis
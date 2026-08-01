# Transaction Processing Engine — Architecture

## Overview

The Transaction Processing Engine is the central orchestration module in Atlas. It manages the complete lifecycle of financial transactions while delegating all accounting operations to the Ledger Engine.

## Design Principles

### 1. Separation of Concerns

- **Transactions** = Business workflows (what happened, why, validation, authorization)
- **Ledger** = Accounting (double-entry postings, balance calculations, holds, settlements)

### 2. No Accounting Logic in Transactions

The Transaction module NEVER directly mutates balances or creates ledger entries. All financial posting flows through the Ledger Engine via the `LedgerService`.

### 3. Idempotency

Every transaction supports idempotency keys to prevent duplicate processing. Clients provide an idempotency key, and if a transaction with that key already exists, the original result is returned.

### 4. Event-Driven Architecture

State changes emit domain events via NestJS EventEmitter2. These events can trigger downstream workflows like notifications, audit logging, and compliance checks.

## Module Structure

```
src/transactions/
├── controllers/
│   ├── transaction.controller.ts      # REST API endpoints
│   └── __tests__/
│       └── transaction.controller.spec.ts
├── dto/
│   ├── create-transaction.dto.ts      # Request DTOs
│   ├── search-transactions.dto.ts     # Search/filter DTOs
│   ├── transaction-response.dto.ts    # Response DTOs
│   └── index.ts
├── enums/
│   ├── transaction-type.enum.ts       # 24 transaction types
│   ├── transaction-status.enum.ts     # 11 lifecycle states
│   └── index.ts
├── events/
│   └── transaction.events.ts          # Domain event definitions
├── exceptions/
│   └── transaction-domain.exception.ts
├── mappers/
│   └── transaction.mapper.ts          # Entity ↔ DTO mapping
├── policies/
│   ├── transaction.policy.ts          # Authorization & validation rules
│   └── __tests__/
│       └── transaction.policy.spec.ts
├── repositories/
│   └── transaction.repository.ts      # Database access layer
├── services/
│   └── transaction.service.ts         # Business orchestration
└── transactions.module.ts             # NestJS module definition
```

## Dependency Graph

```
TransactionModule
├── imports: PrismaModule, AuthModule, AccountsModule, LedgerModule
├── provides: TransactionService, TransactionRepository, TransactionPolicy, TransactionMapper
└── exports: TransactionService
```

### Dependencies

| Dependency | Purpose |
|---|---|
| `PrismaModule` | Database access via Prisma ORM |
| `AuthModule` | JWT authentication and guards |
| `AccountsModule` | Account lookup, validation, status checks |
| `LedgerModule` | All financial posting, holds, reversals |

## Transaction Types

| Category | Types |
|---|---|
| **Core Banking** | DEPOSIT, WITHDRAWAL, INTERNAL_TRANSFER |
| **ACH** | ACH_CREDIT, ACH_DEBIT |
| **Wire** | WIRE_DOMESTIC, WIRE_INTERNATIONAL, SWIFT |
| **Card** | CARD_PURCHASE, CARD_REFUND, CARD_AUTHORIZATION, CARD_CAPTURE |
| **Crypto** | CRYPTO_DEPOSIT, CRYPTO_WITHDRAWAL |
| **Payroll/Interest** | PAYROLL_DEPOSIT, INTEREST_CREDIT |
| **Fees/Adjustments** | FEE, ADJUSTMENT |
| **Lending** | LOAN_DISBURSEMENT, LOAN_REPAYMENT |
| **Investment** | INVESTMENT_PURCHASE, INVESTMENT_SALE |
| **Reversals** | REVERSAL |

## Processing Flow

```
Incoming Request
    ↓
Authentication (JWT Guard)
    ↓
Controller → Service.create()
    ↓
Idempotency Check (findByReferenceNumber)
    ↓
Account Lookup (AccountService)
    ↓
Policy Authorization (TransactionPolicy.authorize)
    ↓
Business Validation
    ↓
Transaction Record Created (Repository)
    ↓
Ledger Posting (LedgerService.postJournal)
    ↓
Status Updated to COMPLETED
    ↓
Domain Events Emitted
    ↓
TransactionResponseDto Returned
```

## Error Handling

- Policy violations → `ForbiddenException` with violation details
- Account errors → `NotFoundException` or `ForbiddenException`
- Duplicate references → `ConflictException`
- Duplicate idempotency → Return existing transaction (idempotent response)
- Ledger failures → Transaction marked as FAILED

## Cross-Cutting Concerns

- **Audit**: All status changes are logged via `AuditService`
- **Events**: Domain events emitted for every state transition
- **Compliance**: Placeholder hooks for AML, fraud detection, velocity rules
- **Pagination**: Cursor-based pagination for large datasets
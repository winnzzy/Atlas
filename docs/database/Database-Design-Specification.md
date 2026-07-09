# Atlas — Database Design Specification

> **Version:** 1.0.0
> **Status:** Authoritative — This document is the single source of truth for the Atlas database design. All Prisma schema generation, migrations, and application code must conform to this specification.
> **Author:** Atlas Architecture Team
> **Last Updated:** 2026-07-09

---

## Table of Contents

1. [Database Philosophy](#1-database-philosophy)
2. [Business Domains](#2-business-domains)
3. [Entity List](#3-entity-list)
4. [Entity Relationships](#4-entity-relationships)
5. [Entity Specifications](#5-entity-specifications)
6. [Enumerations](#6-enumerations)
7. [Banking Rules](#7-banking-rules)
8. [Crypto Rules](#8-crypto-rules)
9. [Audit Rules](#9-audit-rules)
10. [Demo Mode](#10-demo-mode)
11. [Performance Considerations](#11-performance-performance)
12. [Future Expansion](#12-future-expansion)

---

## 1. Database Philosophy

### 1.1 Primary Keys

Every table uses **UUIDv7** as the primary key. UUIDv7 is time-ordered, which provides:

- Globally unique identifiers without coordination
- Natural chronological ordering in indexes
- Safe for distributed systems and future sharding
- No sequential ID enumeration by end users
- No information leakage about row counts or creation order

Primary key columns are always named `id` and typed as `UUID`.

### 1.2 Soft Deletes

All user-facing entities implement **soft deletes** via:

- `deleted_at` — Nullable timestamp. When set, the record is considered deleted.
- `deleted_by` — Nullable UUID foreign key to the `User` who performed the deletion.

Soft-deleted records are **excluded from all default queries** via global query scopes. They are retained for:

- Regulatory compliance (minimum 5 years for financial records)
- Audit trail completeness
- Disaster recovery
- Customer dispute resolution

Hard deletes are only permitted for:

- Demo/test data cleanup
- GDPR/CCPA data erasure requests (requires separate compliance workflow)

### 1.3 Audit Fields

Every table includes:

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | `TIMESTAMPTZ` | Row creation timestamp, set automatically, immutable |
| `created_by` | `UUID (nullable)` | User who created the record. NULL for system-generated rows |
| `updated_at` | `TIMESTAMPTZ` | Last modification timestamp, updated automatically |
| `updated_by` | `UUID (nullable)` | User who last modified the record |
| `deleted_at` | `TIMESTAMPTZ (nullable)` | Soft delete timestamp |
| `deleted_by` | `UUID (nullable)` | User who soft-deleted the record |

These fields are present on every table. They are never exposed to API consumers directly.

### 1.4 Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | `snake_case`, plural | `bank_accounts`, `card_transactions` |
| Columns | `snake_case` | `first_name`, `available_balance` |
| Primary keys | Always `id` | `id UUID` |
| Foreign keys | `{referenced_table_singular}_id` | `user_id`, `account_id` |
| Join tables | `{table_a}_{table_b}` (alphabetical) | `user_roles`, `account_holders` |
| Indexes | `idx_{table}_{columns}` | `idx_transactions_account_id` |
| Unique constraints | `uq_{table}_{columns}` | `uq_users_email` |
| Foreign keys | `fk_{table}_{referenced}` | `fk_transactions_account` |
| Enums | `snake_case`, singular | `account_status`, `transaction_type` |
| Boolean columns | `is_{adjective}` or `has_{noun}` | `is_active`, `has_overdraft` |

### 1.5 Indexing Strategy

- Every foreign key column gets an index
- Columns used in `WHERE` clauses of frequent queries get indexes
- Composite indexes for common multi-column filter patterns
- Partial indexes for filtered queries (e.g., active records only)
- GiST indexes for geospatial data (future branch/ATM locations)
- GIN indexes for JSONB columns that are queried
- Trigram indexes for fuzzy text search on names

### 1.6 Foreign Key Strategy

- All foreign keys use `ON DELETE RESTRICT` by default to prevent accidental cascading deletes
- Soft-delete entities use `ON DELETE SET NULL` for the `deleted_by` field
- Junction tables use `ON DELETE CASCADE` for both sides
- Foreign keys always reference the `id` column of the target table
- All foreign key columns are indexed

### 1.7 Enum Strategy

- Database-level enums (PostgreSQL `ENUM` type) for values that rarely change
- Application-level enums (in `packages/types`) mirror the database enums exactly
- New enum values can be added but never removed or renamed without a migration
- Enum values are `UPPER_SNAKE_CASE` strings

### 1.8 Timestamp Strategy

- All timestamps are `TIMESTAMP WITH TIME ZONE` (`TIMESTAMPTZ`)
- All timestamps are stored in UTC
- Application layer is responsible for timezone conversion for display
- Date-only values (e.g., date of birth) use `DATE` type
- Time-only values are not stored; they are derived from timestamps

### 1.9 Monetary Values

- All monetary amounts are stored as `DECIMAL(19,4)` — 19 total digits, 4 decimal places
- This supports values up to $999,999,999,999,999.9999
- Four decimal places support fractional cents for interest calculations and crypto
- Currency is always stored alongside the amount in a separate `currency` column (3-letter ISO 4217 code)
- Cryptocurrency amounts use the same `DECIMAL(19,4)` with a separate `crypto_asset` column

### 1.10 Multi-Tenancy

- Atlas uses **shared-database, shared-schema** multi-tenancy
- All user data is scoped by `user_id` foreign keys
- Admin users operate in the same database with role-based access control
- Row-level security (RLS) policies will be evaluated for production deployment

---

## 2. Business Domains

Atlas is organized into **12 business domains**. Each domain owns a set of entities and has clear boundaries.

### 2.1 Authentication Domain

**Purpose:** User identity, credentials, sessions, and multi-factor authentication.

**Entities:** User, UserCredential, UserSession, RefreshToken, MfaMethod, MfaBackupCode, LoginAttempt, PasswordResetToken

### 2.2 Account Domain

**Purpose:** Bank accounts (checking, savings), balances, holds, and account-level settings.

**Entities:** BankAccount, AccountHolder, Balance, BalanceHold, AccountStatement, AccountAlert

### 2.3 Transaction Domain

**Purpose:** All money movement — debits, credits, transfers, and their lifecycle.

**Entities:** Transaction, TransactionLine (double-entry ledger), PendingTransaction, TransactionCategory, TransactionNote, TransactionAttachment

### 2.4 Transfer Domain

**Purpose:** ACH, wire transfers, internal transfers, and external transfer methods.

**Entities:** Transfer, TransferMethod, TransferSchedule, ExternalAccount, TransferBeneficiary

### 2.5 Card Domain

**Purpose:** Debit cards, virtual cards, card controls, and card transactions.

**Entities:** Card, CardTransaction, CardLimit, CardControl, CardDesign, CardActivation

### 2.6 Crypto Domain

**Purpose:** Cryptocurrency wallets, deposits, withdrawals, and asset management.

**Entities:** CryptoWallet, CryptoAsset, CryptoDeposit, CryptoWithdrawal, CryptoTransaction, CryptoPrice, CryptoNetwork

### 2.7 Investment Domain

**Purpose:** Investment accounts, holdings, and investment transactions (future expansion).

**Entities:** InvestmentAccount, InvestmentHolding, InvestmentTransaction, InvestmentAsset

### 2.8 Loan Domain

**Purpose:** Personal loans, lines of credit, repayment schedules, and loan payments.

**Entities:** Loan, LoanPayment, LoanSchedule, LoanApplication, LoanDocument

### 2.9 Notification Domain

**Purpose:** System notifications, alerts, email/SMS/push delivery, and user preferences.

**Entities:** Notification, NotificationPreference, NotificationTemplate, NotificationDelivery

### 2.10 Administration Domain

**Purpose:** Admin users, roles, permissions, and admin actions.

**Entities:** AdminUser, AdminRole, AdminPermission, AdminRolePermission, AdminAction

### 2.11 Audit Domain

**Purpose:** Immutable audit log of all significant events for compliance and investigation.

**Entities:** AuditLog, AuditEvent, SecurityEvent

### 2.12 Settings Domain

**Purpose:** User preferences, feature flags, system configuration, and demo mode.

**Entities:** UserPreference, SystemSetting, FeatureFlag, DemoScenario

---

## 3. Entity List

### 3.1 Authentication Domain

| Entity | Purpose | Description | Owner Domain | Dependencies | Lifecycle |
|--------|---------|-------------|-------------|-------------|-----------|
| User | Core identity | Represents a registered person in the system | Authentication | None | Created at registration, soft-deleted on account closure |
| UserCredential | Password storage | Stores hashed password and credential metadata | Authentication | User | Created with user, updated on password change |
| UserSession | Active sessions | Tracks active login sessions with device info | Authentication | User | Created on login, expires/revoked on logout |
| RefreshToken | Token rotation | JWT refresh tokens for authentication flow | Authentication | User, UserSession | Created on login, rotated on refresh, revoked on logout |
| MfaMethod | MFA enrollment | TOTP, SMS, or email MFA methods | Authentication | User | Created on enrollment, disabled on removal |
| MfaBackupCode | Recovery codes | One-time backup codes for MFA recovery | Authentication | User | Generated on MFA setup, consumed on use |
| LoginAttempt | Login tracking | Records all login attempts for security monitoring | Authentication | User (nullable) | Created on each attempt, never modified |
| PasswordResetToken | Password recovery | Time-limited tokens for password reset flow | Authentication | User | Created on request, consumed on use, expires in 1 hour |

### 3.2 Account Domain

| Entity | Purpose | Description | Owner Domain | Dependencies | Lifecycle |
|--------|---------|-------------|-------------|-------------|-----------|
| BankAccount | Core account | Checking or savings account | Account | User | Created on application, closed on request |
| AccountHolder | Ownership link | Maps users to accounts (supports joint accounts) | Account | User, BankAccount | Created when account is opened |
| Balance | Current balance | Real-time balance for each account | Account | BankAccount | Created with account, updated on every transaction |
| BalanceHold | Reserved funds | Funds held for pending transactions or disputes | Account | BankAccount, Transaction | Created on hold, released on settlement |
| AccountStatement | Monthly statements | Generated periodic account statements | Account | BankAccount | Generated monthly, immutable once created |
| AccountAlert | Account notifications | Threshold and activity alerts per account | Account, Notification | BankAccount | Created by user preferences |

### 3.3 Transaction Domain

| Entity | Purpose | Description | Owner Domain | Dependencies | Lifecycle |
|--------|---------|-------------|-------------|-------------|-----------|
| Transaction | Core transaction | Record of a single financial event | Transaction | BankAccount | Created on initiation, progresses through statuses |
| TransactionLine | Ledger entry | Double-entry line item (debit or credit) | Transaction | Transaction, BankAccount | Created with transaction, immutable |
| PendingTransaction | Pre-settlement | Transaction awaiting settlement (e.g., card auth) | Transaction, Card | BankAccount, Card | Created on authorization, settled or expired |
| TransactionCategory | Categorization | User or system-assigned category for spending | Transaction | User | Created by user or auto-classified |
| TransactionNote | User notes | User-added notes on transactions | Transaction | Transaction, User | Created/updated by user |
| TransactionAttachment | Receipts | File attachments (receipts, invoices) | Transaction | Transaction, User | Uploaded by user, soft-deleted |

### 3.4 Transfer Domain

| Entity | Purpose | Description | Owner Domain | Dependencies | Lifecycle |
|--------|---------|-------------|-------------|-------------|-----------|
| Transfer | Transfer request | Initiated transfer between accounts | Transfer | BankAccount (source, destination) | Created on initiation, progresses through processing |
| TransferMethod | Method config | ACH, Wire, Internal, Zelle method definitions | Transfer | None | System-defined, static |
| TransferSchedule | Recurring transfers | Scheduled repeating transfers | Transfer | Transfer, BankAccount | Created by user, activated/paused/cancelled |
| ExternalAccount | Linked accounts | External bank accounts linked via Plaid/manual | Transfer, Account | User | Created on link, verified before use |
| TransferBeneficiary | Saved recipients | Saved recipient accounts for quick transfers | Transfer | User, ExternalAccount (nullable) | Created by user, soft-deleted |

### 3.5 Card Domain

| Entity | Purpose | Description | Owner Domain | Dependencies | Lifecycle |
|--------|---------|-------------|-------------|-------------|-----------|
| Card | Debit card | Physical or virtual debit card | Card | BankAccount, User | Issued on request, activated by user, frozen/closed |
| CardTransaction | Card purchase | Individual card purchase or ATM withdrawal | Card, Transaction | Card, Transaction | Created on authorization, settled or reversed |
| CardLimit | Spending limits | Daily/weekly/monthly spending limits | Card | Card | Set at issuance, adjustable by user |
| CardControl | User controls | Merchant category, geographic, online toggles | Card | Card | Created with card, user-adjustable |
| CardDesign | Card appearance | Physical card design/style selection | Card | Card | Selected at issuance, changeable |
| CardActivation | Activation tracking | Tracks card activation attempts and status | Card | Card | Created at issuance, completed on activation |

### 3.6 Crypto Domain

| Entity | Purpose | Description | Owner Domain | Dependencies | Lifecycle |
|--------|---------|-------------|-------------|-------------|-----------|
| CryptoWallet | User wallet | Per-asset wallet address for a user | Crypto | User, CryptoAsset | Created on first deposit or on request |
| CryptoAsset | Supported asset | BTC, ETH, USDT, USDC, BNB, SOL definitions | Crypto | None | System-defined, static |
| CryptoNetwork | Blockchain network | Network definitions (Ethereum, Tron, Bitcoin, etc.) | Crypto | None | System-defined, static |
| CryptoDeposit | Incoming crypto | Cryptocurrency deposit to user wallet | Crypto | CryptoWallet, CryptoAsset | Created on detection, confirmed after required confirmations |
| CryptoWithdrawal | Outgoing crypto | Cryptocurrency withdrawal request | Crypto | CryptoWallet, CryptoAsset | Created on request, processed after approval |
| CryptoTransaction | On-chain tx | On-chain transaction record | Crypto | CryptoWallet | Created on detection, immutable |
| CryptoPrice | Price cache | Cached USD prices for supported assets | Crypto | CryptoAsset | Updated periodically, historical record |

### 3.7 Investment Domain

| Entity | Purpose | Description | Owner Domain | Dependencies | Lifecycle |
|--------|---------|-------------|-------------|-------------|-----------|
| InvestmentAccount | Investment wrapper | Separate investment account per user | Investment | User | Created on application |
| InvestmentHolding | Asset holding | Individual asset held in investment account | Investment | InvestmentAccount | Created on purchase, updated on trade |
| InvestmentTransaction | Trade record | Buy/sell/dividend transaction | Investment | InvestmentAccount | Created on execution, immutable |
| InvestmentAsset | Tradeable asset | Stock, ETF, crypto asset definitions | Investment | None | System-defined, updated from market data |

### 3.8 Loan Domain

| Entity | Purpose | Description | Owner Domain | Dependencies | Lifecycle |
|--------|---------|-------------|-------------|-------------|-----------|
| Loan | Active loan | Disbursed personal loan or credit line | Loan | User, BankAccount | Applied, approved, disbursed, active, paid/closed |
| LoanPayment | Payment record | Individual payment toward a loan | Loan | Loan, BankAccount | Created on payment, immutable |
| LoanSchedule | Amortization | Scheduled payment dates and amounts | Loan | Loan | Generated at disbursement, immutable |
| LoanApplication | Application | Loan application before approval | Loan | User | Submitted, under review, approved/denied |
| LoanDocument | Supporting docs | Documents attached to loan application | Loan, Document | LoanApplication | Uploaded, reviewed |

### 3.9 Notification Domain

| Entity | Purpose | Description | Owner Domain | Dependencies | Lifecycle |
|--------|---------|-------------|-------------|-------------|-----------|
| Notification | User notification | In-app notification for user events | Notification | User | Created on trigger, read/unread, archived |
| NotificationPreference | User prefs | Per-channel, per-event notification preferences | Notification | User | Created with user, user-adjustable |
| NotificationTemplate | Message templates | Email/SMS/push templates with variable substitution | Notification | None | System-defined, admin-editable |
| NotificationDelivery | Delivery tracking | Tracks delivery status per channel per notification | Notification | Notification | Created on send, updated on delivery/failure |

### 3.10 Administration Domain

| Entity | Purpose | Description | Owner Domain | Dependencies | Lifecycle |
|--------|---------|-------------|-------------|-------------|-----------|
| AdminUser | Admin identity | Staff/administrator user account | Administration | User (nullable) | Created by super admin, soft-deleted on deactivation |
| AdminRole | Role definition | Named role (Super Admin, Compliance Officer, etc.) | Administration | None | System-defined, admin-editable |
| AdminPermission | Permission | Granular permission (e.g., `accounts:freeze`, `loans:approve`) | Administration | None | System-defined, static |
| AdminRolePermission | Role-permission map | Maps roles to permissions | Administration | AdminRole, AdminPermission | System-defined, admin-adjustable |
| AdminAction | Admin activity log | Records every admin action for compliance | Administration, Audit | AdminUser | Created on action, immutable |

### 3.11 Audit Domain

| Entity | Purpose | Description | Owner Domain | Dependencies | Lifecycle |
|--------|---------|-------------|-------------|-------------|-----------|
| AuditLog | General audit log | Immutable log of all auditable events | Audit | User (nullable) | Created on event, immutable, never deleted |
| AuditEvent | Event definitions | Catalog of audit event types | Audit | None | System-defined, static |
| SecurityEvent | Security incidents | Failed logins, suspicious activity, account lockouts | Audit | User (nullable) | Created on detection, investigated, resolved |

### 3.12 Settings Domain

| Entity | Purpose | Description | Owner Domain | Dependencies | Lifecycle |
|--------|---------|-------------|-------------|-------------|-----------|
| UserPreference | User settings | UI preferences, language, timezone, currency | Settings | User | Created with user, user-adjustable |
| SystemSetting | System config | Global system configuration key-value pairs | Settings | None | System-defined, admin-adjustable |
| FeatureFlag | Feature toggles | Per-user or global feature flags | Settings | None | System-defined, admin-adjustable |
| DemoScenario | Demo data | Predefined demo scenarios for showcase mode | Settings | None | System-defined, admin-created |

---

## 4. Entity Relationships

### 4.1 Core Relationship Diagram

```
User (Authentication Domain)
├── UserCredential (1:1)
├── UserSession (1:N)
├── RefreshToken (1:N)
├── MfaMethod (1:N)
├── MfaBackupCode (1:N)
├── LoginAttempt (1:N)
├── PasswordResetToken (1:N)
│
├── AccountHolder (1:N) ──────── BankAccount (Account Domain)
│                                   ├── Balance (1:1)
│                                   ├── BalanceHold (1:N)
│                                   ├── AccountStatement (1:N)
│                                   ├── AccountAlert (1:N)
│                                   │
│                                   ├── Transaction (1:N) ────── TransactionLine (1:N)
│                                   │                            ├── PendingTransaction (0..1)
│                                   │                            ├── TransactionCategory (N:1)
│                                   │                            ├── TransactionNote (0:N)
│                                   │                            └── TransactionAttachment (0:N)
│                                   │
│                                   └── Card (1:N) ───────────── CardTransaction (1:N)
│                                                                 ├── CardLimit (1:1)
│                                                                 ├── CardControl (1:1)
│                                                                 ├── CardDesign (0:1)
│                                                                 └── CardActivation (1:1)
│
├── Transfer (as sender/receiver) (1:N)
│   ├── TransferSchedule (0:N)
│   └── TransferMethod (N:1)
│
├── ExternalAccount (1:N)
│   └── TransferBeneficiary (1:N)
│
├── CryptoWallet (1:N) ────────── CryptoDeposit (1:N)
│                                  ├── CryptoWithdrawal (1:N)
│                                  └── CryptoTransaction (1:N)
│
├── InvestmentAccount (0:1)
│   ├── InvestmentHolding (1:N)
│   └── InvestmentTransaction (1:N)
│
├── Loan (1:N)
│   ├── LoanPayment (1:N)
│   ├── LoanSchedule (1:N)
│   └── LoanApplication (1:N)
│       └── LoanDocument (1:N)
│
├── Notification (1:N)
│   └── NotificationDelivery (1:N)
│
├── NotificationPreference (1:1)
├── UserPreference (1:1)
│
├── AuditLog (1:N)
├── SecurityEvent (1:N)
│
└── AdminUser (0:1) ───────────── AdminAction (1:N)
                                   └── AdminRole (N:M)
                                       └── AdminRolePermission (N:M)
                                           └── AdminPermission
```

### 4.2 Relationship Explanations

#### User → Bank Account (via AccountHolder)

A User can own multiple BankAccounts. The AccountHolder junction table supports joint accounts where multiple users share a single account. Each AccountHolder has a `role` (PRIMARY, JOINT, AUTHORIZED_SIGNER) and a `ownership_percentage`.

#### Bank Account → Transactions

Every financial event creates one Transaction with multiple TransactionLines (double-entry). A debit on one account is a credit on another. This ensures the ledger always balances.

#### Bank Account → Cards

A single bank account can have multiple debit cards (e.g., primary card + virtual card for online shopping). Each card has its own limits, controls, and transaction history.

#### Transfer → Bank Accounts

A Transfer references a source BankAccount (debit) and optionally a destination. For external transfers, the destination is an ExternalAccount. For crypto, the destination is a CryptoWallet.

#### User → Crypto Wallets

Each user can have multiple CryptoWallets — one per CryptoAsset per CryptoNetwork. For example, a user might have an ETH wallet (Ethereum mainnet) and a USDT wallet (both ERC-20 and TRC-20).

#### User → Loans

A user can have multiple loans. Each loan has a LoanApplication (the request), LoanSchedule (amortization table), and LoanPayments (actual payments made).

#### Notification → User

Notifications are user-scoped. Each notification can have multiple NotificationDelivery records tracking delivery across channels (in-app, email, SMS, push).

---

## 5. Entity Specifications

### 5.1 Authentication Domain

---

#### 5.1.1 User

**Purpose:** Core identity record for every person registered on Atlas.

**Business Rules:**
- Email must be unique across the system
- Phone number must be unique across the system (E.164 format)
- SSN (last 4) stored for KYC, encrypted at rest
- Date of birth required for US banking compliance (must be 18+)
- Users cannot delete their own accounts; must contact support
- Account closure sets status to CLOSED and triggers soft delete after 30-day grace period

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Primary email address |
| email_verified_at | TIMESTAMPTZ | NULLABLE | When email was verified |
| phone | VARCHAR(20) | UNIQUE, NOT NULL | Phone number in E.164 format |
| phone_verified_at | TIMESTAMPTZ | NULLABLE | When phone was verified |
| first_name | VARCHAR(100) | NOT NULL | Legal first name |
| last_name | VARCHAR(100) | NOT NULL | Legal last name |
| date_of_birth | DATE | NOT NULL | Must be 18+ at registration |
| status | UserStatus enum | NOT NULL, DEFAULT ACTIVE | Account status |
| kyc_status | KycStatus enum | NOT NULL, DEFAULT PENDING | KYC verification status |
| kyc_verified_at | TIMESTAMPTZ | NULLABLE | When KYC was completed |
| address_line1 | VARCHAR(255) | NOT NULL | Street address |
| address_line2 | VARCHAR(255) | NULLABLE | Apt/Suite/Unit |
| city | VARCHAR(100) | NOT NULL | City |
| state | VARCHAR(2) | NOT NULL | US state code (ISO 3166-2) |
| zip_code | VARCHAR(10) | NOT NULL | ZIP or ZIP+4 |
| country | VARCHAR(2) | NOT NULL, DEFAULT 'US' | Country code (ISO 3166-1) |
| tax_id_last4 | VARCHAR(4) | NULLABLE | Last 4 of SSN (encrypted) |
| referral_code | VARCHAR(20) | UNIQUE, NULLABLE | User's unique referral code |
| referred_by | UUID | FK → User, NULLABLE | Who referred this user |
| accepted_terms_at | TIMESTAMPTZ | NOT NULL | When ToS were accepted |
| accepted_privacy_at | TIMESTAMPTZ | NOT NULL | When privacy policy was accepted |
| is_demo | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether this is a demo account |

**Optional Fields:**
| Field | Type | Description |
|-------|------|-------------|
| middle_name | VARCHAR(100) | Middle name |
| suffix | VARCHAR(20) | Name suffix (Jr., Sr., III) |
| avatar_url | VARCHAR(500) | Profile picture URL |
| locale | VARCHAR(10) | Preferred locale (default: en-US) |
| timezone | VARCHAR(50) | Preferred timezone (default: America/New_York) |

**Relationships:**
- One-to-one with UserCredential
- One-to-many with UserSession, RefreshToken, MfaMethod, MfaBackupCode, LoginAttempt, PasswordResetToken
- One-to-many with AccountHolder (user can hold multiple accounts)
- One-to-many with CryptoWallet
- One-to-one with NotificationPreference
- One-to-one with UserPreference
- Self-referencing: referred_by → User

**Indexes:**
- `idx_users_email` — UNIQUE on `email`
- `idx_users_phone` — UNIQUE on `phone`
- `idx_users_status` — on `status` WHERE `deleted_at IS NULL`
- `idx_users_referral_code` — UNIQUE on `referral_code` WHERE `referral_code IS NOT NULL`
- `idx_users_state` — on `state`
- `idx_users_kyc_status` — on `kyc_status`
- `idx_users_created_at` — on `created_at` DESC

**Unique Constraints:**
- `uq_users_email`
- `uq_users_phone`
- `uq_users_referral_code`

**Validation Rules:**
- Email: Valid email format, max 255 chars, lowercase normalized
- Phone: E.164 format (e.g., +14155551234)
- Date of birth: Must be 18+ years old at time of registration
- State: Must be a valid US state code
- ZIP: Must match `\d{5}(-\d{4})?`
- First/last name: 1-100 chars, no numbers, no special chars except hyphen and apostrophe

**Lifecycle:**
1. PENDING — User registered, email/phone not yet verified
2. ACTIVE — Email verified, basic profile complete
3. VERIFIED — KYC completed and approved
4. LOCKED — Temporarily locked due to security events
5. SUSPENDED — Suspended by admin (compliance or fraud)
6. CLOSED — Account permanently closed

**Soft Delete Behavior:**
- Setting `deleted_at` excludes the user from all queries
- All associated sessions are revoked
- All cards are frozen
- All accounts are flagged for closure
- Audit log entry created

**Audit Behavior:**
- Registration, status changes, KYC changes, login, logout, profile updates
- Balance-affecting actions logged with before/after values

**Future Expansion:**
- Business account flag and entity type (LLC, Corp, Sole Prop)
- Joint account support via AccountHolder
- International address support
- Enhanced KYC (document upload, video verification)

---

#### 5.1.2 UserCredential

**Purpose:** Stores authentication credentials separately from user profile for security isolation.

**Business Rules:**
- Passwords are hashed with bcrypt (cost factor 12)
- Password must be changed every 90 days for admin users (not enforced for regular users)
- Last 5 passwords cannot be reused
- Failed password attempts tracked; account locked after 5 consecutive failures

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, UNIQUE, NOT NULL | Owner |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hash |
| password_changed_at | TIMESTAMPTZ | NOT NULL | Last password change |
| failed_attempts | INTEGER | NOT NULL, DEFAULT 0 | Consecutive failed attempts |
| locked_until | TIMESTAMPTZ | NULLABLE | Account locked until this time |

**Optional Fields:**
| Field | Type | Description |
|-------|------|-------------|
| last_used_at | TIMESTAMPTZ | Last successful authentication |

**Relationships:**
- Many-to-one with User (unique — effectively one-to-one)

**Indexes:**
- `idx_user_credentials_user_id` — UNIQUE on `user_id`

**Lifecycle:**
- Created at user registration
- Updated on password change
- Locked on excessive failed attempts
- Reset via password reset token flow

---

#### 5.1.3 UserSession

**Purpose:** Tracks active authenticated sessions with device and location information.

**Business Rules:**
- Maximum 10 active sessions per user (oldest revoked when exceeded)
- Sessions expire after 7 days of inactivity
- Sessions can be revoked individually or all at once
- IP address and user agent recorded for security

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, NOT NULL | Session owner |
| token_hash | VARCHAR(255) | NOT NULL | Hashed session token |
| ip_address | INET | NOT NULL | Client IP address |
| user_agent | TEXT | NOT NULL | Client user agent string |
| device_fingerprint | VARCHAR(255) | NULLABLE | Device fingerprint hash |
| last_active_at | TIMESTAMPTZ | NOT NULL | Last activity timestamp |
| expires_at | TIMESTAMPTZ | NOT NULL | Session expiration |
| revoked_at | TIMESTAMPTZ | NULLABLE | When session was revoked |
| revoked_reason | VARCHAR(100) | NULLABLE | Why session was revoked |

**Relationships:**
- Many-to-one with User

**Indexes:**
- `idx_sessions_user_id` — on `user_id`
- `idx_sessions_token_hash` — UNIQUE on `token_hash`
- `idx_sessions_expires_at` — on `expires_at` WHERE `revoked_at IS NULL`

---

#### 5.1.4 RefreshToken

**Purpose:** Implements JWT refresh token rotation for secure token renewal.

**Business Rules:**
- Refresh tokens are single-use (rotated on each refresh)
- Reuse of a revoked refresh token invalidates the entire token family
- Tokens expire after 30 days
- Each token is linked to a session

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, NOT NULL | Token owner |
| session_id | UUID | FK → UserSession, NOT NULL | Associated session |
| token_hash | VARCHAR(255) | NOT NULL | Hashed token value |
| family_id | UUID | NOT NULL | Token family for rotation detection |
| expires_at | TIMESTAMPTZ | NOT NULL | Token expiration |
| revoked_at | TIMESTAMPTZ | NULLABLE | When token was revoked |

**Relationships:**
- Many-to-one with User
- Many-to-one with UserSession

**Indexes:**
- `idx_refresh_tokens_token_hash` — UNIQUE on `token_hash`
- `idx_refresh_tokens_family_id` — on `family_id`
- `idx_refresh_tokens_user_id` — on `user_id`

---

#### 5.1.5 MfaMethod

**Purpose:** Stores user-enrolled multi-factor authentication methods.

**Business Rules:**
- Users can have multiple MFA methods
- TOTP is the recommended method
- SMS MFA uses the verified phone number
- At least one method must be active to have MFA enabled
- Backup codes generated when MFA is first enabled

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, NOT NULL | Owner |
| type | MfaType enum | NOT NULL | TOTP, SMS, EMAIL |
| secret_encrypted | TEXT | NOT NULL | Encrypted secret/key |
| is_primary | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether this is the primary MFA method |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether method is enabled |
| verified_at | TIMESTAMPTZ | NULLABLE | When method was verified |

**Relationships:**
- Many-to-one with User

**Indexes:**
- `idx_mfa_methods_user_id` — on `user_id` WHERE `is_active = TRUE`

---

#### 5.1.6 MfaBackupCode

**Purpose:** One-time recovery codes for MFA-locked accounts.

**Business Rules:**
- 10 backup codes generated per user
- Each code is single-use
- Codes are hashed (bcrypt) before storage
- New codes generated when all are consumed or on user request
- Valid for 1 year from generation

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, NOT NULL | Owner |
| code_hash | VARCHAR(255) | NOT NULL | Bcrypt hash of backup code |
| used_at | TIMESTAMPTZ | NULLABLE | When code was consumed |
| expires_at | TIMESTAMPTZ | NOT NULL | Code expiration |

**Relationships:**
- Many-to-one with User

**Indexes:**
- `idx_mfa_backup_codes_user_id` — on `user_id` WHERE `used_at IS NULL`

---

#### 5.1.7 LoginAttempt

**Purpose:** Immutable record of every login attempt for security monitoring and compliance.

**Business Rules:**
- Every login attempt is recorded regardless of outcome
- Records are never modified or deleted
- Used for anomaly detection and brute force protection
- Retained for 2 years minimum

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| email | VARCHAR(255) | NOT NULL | Email used in attempt (may not match a user) |
| user_id | UUID | FK → User, NULLABLE | Resolved user (null if email not found) |
| ip_address | INET | NOT NULL | Client IP |
| user_agent | TEXT | NOT NULL | Client user agent |
| success | BOOLEAN | NOT NULL | Whether login succeeded |
| failure_reason | VARCHAR(100) | NULLABLE | Reason for failure (INVALID_PASSWORD, ACCOUNT_LOCKED, etc.) |
| mfa_required | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether MFA was required |
| mfa_success | BOOLEAN | NULLABLE | Whether MFA was completed |
| country | VARCHAR(2) | NULLABLE | GeoIP country |
| city | VARCHAR(100) | NULLABLE | GeoIP city |

**Relationships:**
- Many-to-one with User (nullable)

**Indexes:**
- `idx_login_attempts_user_id` — on `user_id`
- `idx_login_attempts_email` — on `email`
- `idx_login_attempts_ip` — on `ip_address`
- `idx_login_attempts_created_at` — on `created_at` DESC
- `idx_login_attempts_success` — on `success` WHERE `success = FALSE`

---

#### 5.1.8 PasswordResetToken

**Purpose:** Time-limited, single-use tokens for the password reset flow.

**Business Rules:**
- Tokens expire after 1 hour
- Tokens are single-use
- Only the most recent token for a user is valid (previous tokens invalidated)
- Token is a cryptographically random string (32 bytes, base64 encoded)
- Token is hashed before storage

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, NOT NULL | Token owner |
| token_hash | VARCHAR(255) | NOT NULL | Hashed token |
| expires_at | TIMESTAMPTZ | NOT NULL | Token expiration |
| used_at | TIMESTAMPTZ | NULLABLE | When token was consumed |
| ip_address | INET | NULLABLE | IP that requested reset |

**Relationships:**
- Many-to-one with User

**Indexes:**
- `idx_password_reset_tokens_token_hash` — UNIQUE on `token_hash`
- `idx_password_reset_tokens_user_id` — on `user_id`

---

### 5.2 Account Domain

---

#### 5.2.1 BankAccount

**Purpose:** Core bank account entity — checking or savings.

**Business Rules:**
- Each user can have up to 3 checking and 3 savings accounts
- Account numbers are system-generated, 10-digit, unique
- Routing number is Atlas's partner bank routing number (shared)
- Interest rate applies only to savings accounts
- Overdraft protection is opt-in for checking accounts
- Accounts cannot be deleted; they are closed and retained for 7 years
- Minimum opening deposit: $0 (waived for demo)
- Accounts in CLOSED status cannot accept new transactions

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| account_number | VARCHAR(10) | UNIQUE, NOT NULL | System-generated account number |
| routing_number | VARCHAR(9) | NOT NULL | Atlas partner bank routing number |
| account_type | AccountType enum | NOT NULL | CHECKING, SAVINGS |
| status | AccountStatus enum | NOT NULL, DEFAULT ACTIVE | Account status |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'USD' | ISO 4217 currency code |
| nickname | VARCHAR(100) | NULLABLE | User-assigned account name |
| interest_rate | DECIMAL(5,4) | NOT NULL, DEFAULT 0.0000 | Annual interest rate (savings only) |
| has_overdraft_protection | BOOLEAN | NOT NULL, DEFAULT FALSE | Overdraft protection enabled |
| overdraft_limit | DECIMAL(19,4) | NOT NULL, DEFAULT 0.0000 | Maximum overdraft amount |
| opened_at | TIMESTAMPTZ | NOT NULL | When account was opened |
| closed_at | TIMESTAMPTZ | NULLABLE | When account was closed |
| close_reason | VARCHAR(255) | NULLABLE | Reason for closure |
| is_demo | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether this is a demo account |

**Relationships:**
- One-to-many via AccountHolder with User
- One-to-one with Balance
- One-to-many with BalanceHold, Transaction, Card, AccountStatement, AccountAlert

**Indexes:**
- `idx_bank_accounts_account_number` — UNIQUE on `account_number`
- `idx_bank_accounts_status` — on `status`
- `idx_bank_accounts_type` — on `account_type`
- `idx_bank_accounts_created_at` — on `created_at` DESC

**Lifecycle:**
1. PENDING — Application submitted, awaiting approval
2. ACTIVE — Account is open and operational
3. RESTRICTED — Limited functionality (compliance hold)
4. FROZEN — All transactions blocked (admin action)
5. CLOSED — Permanently closed, no new transactions
6. DORMANT — No activity for 12+ months (auto-flagged)

---

#### 5.2.2 AccountHolder

**Purpose:** Junction table linking Users to BankAccounts with role information. Supports joint accounts.

**Business Rules:**
- Each account must have exactly one PRIMARY holder
- Additional holders are JOINT or AUTHORIZED_SIGNER
- PRIMARY holder cannot be removed (account must be transferred or closed)
- Ownership percentage must sum to 100% across all holders

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, NOT NULL | The user |
| account_id | UUID | FK → BankAccount, NOT NULL | The account |
| role | AccountHolderRole enum | NOT NULL | PRIMARY, JOINT, AUTHORIZED_SIGNER |
| ownership_percentage | DECIMAL(5,2) | NOT NULL | Ownership share (up to 100.00) |
| added_at | TIMESTAMPTZ | NOT NULL | When relationship was established |
| removed_at | TIMESTAMPTZ | NULLABLE | When holder was removed |

**Relationships:**
- Many-to-one with User
- Many-to-one with BankAccount

**Indexes:**
- `idx_account_holders_user_id` — on `user_id`
- `idx_account_holders_account_id` — on `account_id`
- `uq_account_holders_user_account` — UNIQUE on `(user_id, account_id)`

---

#### 5.2.3 Balance

**Purpose:** Real-time balance record for each bank account. Separated from BankAccount for lock contention management.

**Business Rules:**
- Updated atomically with every transaction
- `available_balance = current_balance - hold_amount`
- Available balance can be negative if overdraft is enabled
- Current balance never goes below `-overdraft_limit`
- Balance is always in the account's currency

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| account_id | UUID | FK → BankAccount, UNIQUE, NOT NULL | The account |
| current_balance | DECIMAL(19,4) | NOT NULL, DEFAULT 0.0000 | Total funds including holds |
| available_balance | DECIMAL(19,4) | NOT NULL, DEFAULT 0.0000 | Funds available for spending |
| hold_amount | DECIMAL(19,4) | NOT NULL, DEFAULT 0.0000 | Total funds on hold |
| pending_credits | DECIMAL(19,4) | NOT NULL, DEFAULT 0.0000 | Incoming funds not yet settled |
| pending_debits | DECIMAL(19,4) | NOT NULL, DEFAULT 0.0000 | Outgoing funds not yet settled |
| last_transaction_at | TIMESTAMPTZ | NULLABLE | Timestamp of last balance change |
| version | INTEGER | NOT NULL, DEFAULT 1 | Optimistic locking version |

**Relationships:**
- One-to-one with BankAccount

**Indexes:**
- `idx_balances_account_id` — UNIQUE on `account_id`

---

#### 5.2.4 BalanceHold

**Purpose:** Represents funds reserved for pending transactions, disputes, or compliance holds.

**Business Rules:**
- Hold amount is deducted from available_balance
- Holds expire after a configurable period (default 7 days for card auths)
- Expired holds are automatically released
- Holds can be settled (converted to actual debit) or released (funds returned)
- Maximum hold period: 30 days

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| account_id | UUID | FK → BankAccount, NOT NULL | The account with held funds |
| transaction_id | UUID | FK → Transaction, NULLABLE | Associated transaction |
| amount | DECIMAL(19,4) | NOT NULL | Amount held |
| reason | HoldReason enum | NOT NULL | PENDING_TRANSACTION, DISPUTE, COMPLIANCE, CARD_AUTH |
| status | HoldStatus enum | NOT NULL, DEFAULT ACTIVE | ACTIVE, SETTLED, RELEASED, EXPIRED |
| expires_at | TIMESTAMPTZ | NOT NULL | When hold auto-expires |
| released_at | TIMESTAMPTZ | NULLABLE | When hold was released |
| released_by | UUID | FK → User, NULLABLE | Who released the hold |
| description | VARCHAR(255) | NULLABLE | Description of hold |

**Relationships:**
- Many-to-one with BankAccount
- Many-to-one with Transaction (nullable)

**Indexes:**
- `idx_balance_holds_account_id` — on `account_id` WHERE `status = 'ACTIVE'`
- `idx_balance_holds_expires_at` — on `expires_at` WHERE `status = 'ACTIVE'`

---

#### 5.2.5 AccountStatement

**Purpose:** Generated periodic (monthly) account statements.

**Business Rules:**
- Generated on the 1st of each month for the previous month
- Statements are immutable once generated
- PDF format stored in object storage; metadata in database
- Statements retained for 7 years
- Available for download via the app

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| account_id | UUID | FK → BankAccount, NOT NULL | The account |
| period_start | DATE | NOT NULL | Statement period start |
| period_end | DATE | NOT NULL | Statement period end |
| opening_balance | DECIMAL(19,4) | NOT NULL | Balance at period start |
| closing_balance | DECIMAL(19,4) | NOT NULL | Balance at period end |
| total_credits | DECIMAL(19,4) | NOT NULL | Total deposits/credits |
| total_debits | DECIMAL(19,4) | NOT NULL | Total withdrawals/debits |
| total_fees | DECIMAL(19,4) | NOT NULL | Total fees charged |
| interest_earned | DECIMAL(19,4) | NOT NULL | Interest earned (savings) |
| transaction_count | INTEGER | NOT NULL | Number of transactions |
| document_url | VARCHAR(500) | NULLABLE | PDF storage URL |
| generated_at | TIMESTAMPTZ | NOT NULL | When statement was generated |

**Relationships:**
- Many-to-one with BankAccount

**Indexes:**
- `idx_statements_account_id` — on `account_id`
- `uq_statements_account_period` — UNIQUE on `(account_id, period_start, period_end)`

---

#### 5.2.6 AccountAlert

**Purpose:** User-configured alerts for account activity.

**Business Rules:**
- Users can set alerts for low balance, large transactions, deposits, withdrawals
- Threshold amounts are user-configurable
- Alerts trigger notification creation
- Can be enabled/disabled per channel (push, email, SMS)

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| account_id | UUID | FK → BankAccount, NOT NULL | The account |
| type | AlertType enum | NOT NULL | LOW_BALANCE, LARGE_TRANSACTION, DEPOSIT, WITHDRAWAL, BALANCE_UPDATE |
| threshold_amount | DECIMAL(19,4) | NULLABLE | Amount threshold for trigger |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether alert is enabled |
| notify_push | BOOLEAN | NOT NULL, DEFAULT TRUE | Send push notification |
| notify_email | BOOLEAN | NOT NULL, DEFAULT TRUE | Send email |
| notify_sms | BOOLEAN | NOT NULL, DEFAULT FALSE | Send SMS |

**Relationships:**
- Many-to-one with BankAccount

**Indexes:**
- `idx_account_alerts_account_id` — on `account_id` WHERE `is_active = TRUE`

---

### 5.3 Transaction Domain

---

#### 5.3.1 Transaction

**Purpose:** Core financial transaction record representing a single money movement event.

**Business Rules:**
- Every transaction creates at least 2 TransactionLines (double-entry)
- Transaction amounts are always positive; direction is determined by type
- Transactions follow a strict lifecycle: PENDING → PROCESSING → COMPLETED or FAILED
- Reversals create a new counter-transaction
- All transactions are immutable once COMPLETED
- Transactions are categorized automatically or manually
- Reference numbers are user-facing and unique

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| reference_number | VARCHAR(20) | UNIQUE, NOT NULL | User-facing reference (e.g., ATL-20260709-ABC123) |
| account_id | UUID | FK → BankAccount, NOT NULL | Primary account |
| type | TransactionType enum | NOT NULL | DEBIT, CREDIT, TRANSFER, FEE, INTEREST, ADJUSTMENT, REVERSAL |
| status | TransactionStatus enum | NOT NULL, DEFAULT PENDING | Transaction status |
| amount | DECIMAL(19,4) | NOT NULL | Transaction amount |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'USD' | ISO 4217 currency |
| description | VARCHAR(500) | NOT NULL | Transaction description |
| memo | VARCHAR(255) | NULLABLE | User-provided memo |
| category_id | UUID | FK → TransactionCategory, NULLABLE | Spending category |
| counterpart_account_id | UUID | FK → BankAccount, NULLABLE | Other account in transfer |
| external_reference | VARCHAR(100) | NULLABLE | External system reference |
| transfer_id | UUID | FK → Transfer, NULLABLE | Associated transfer |
| card_transaction_id | UUID | FK → CardTransaction, NULLABLE | Associated card transaction |
| processed_at | TIMESTAMPTZ | NULLABLE | When transaction was processed |
| settled_at | TIMESTAMPTZ | NULLABLE | When transaction settled |
| reversed_at | TIMESTAMPTZ | NULLABLE | When transaction was reversed |
| reversal_of_id | UUID | FK → Transaction, NULLABLE | Original transaction if this is a reversal |
| failure_reason | VARCHAR(255) | NULLABLE | Reason for failure |
| metadata | JSONB | NULLABLE | Additional structured data |

**Relationships:**
- Many-to-one with BankAccount
- Many-to-one with BankAccount (counterpart, nullable)
- Many-to-one with TransactionCategory (nullable)
- Many-to-one with Transfer (nullable)
- One-to-many with TransactionLine, TransactionNote, TransactionAttachment
- Self-referencing: reversal_of_id → Transaction

**Indexes:**
- `idx_transactions_account_id` — on `account_id`
- `idx_transactions_reference_number` — UNIQUE on `reference_number`
- `idx_transactions_status` — on `status`
- `idx_transactions_type` — on `type`
- `idx_transactions_created_at` — on `created_at` DESC
- `idx_transactions_account_created` — on `(account_id, created_at DESC)`
- `idx_transactions_transfer_id` — on `transfer_id`
- `idx_transactions_card_transaction_id` — on `card_transaction_id`
- `idx_transactions_category_id` — on `category_id`

**Lifecycle:**
1. PENDING — Transaction created, awaiting processing
2. PROCESSING — Transaction is being processed
3. COMPLETED — Transaction settled successfully
4. FAILED — Transaction failed (insufficient funds, system error)
5. REVERSED — Transaction was reversed (creates a counter-transaction)
6. RETURNED — ACH/wire was returned by the receiving bank

---

#### 5.3.2 TransactionLine

**Purpose:** Individual debit or credit line in the double-entry ledger system.

**Business Rules:**
- Every Transaction has at least 2 lines
- Total debits must equal total credits per transaction
- Lines are immutable once created
- Each line references an account and a direction (DEBIT or CREDIT)
- The ledger balance equation: SUM(debits) = SUM(credits) for all transactions

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| transaction_id | UUID | FK → Transaction, NOT NULL | Parent transaction |
| account_id | UUID | FK → BankAccount, NOT NULL | Account affected |
| direction | Direction enum | NOT NULL | DEBIT, CREDIT |
| amount | DECIMAL(19,4) | NOT NULL | Line amount (always positive) |
| balance_before | DECIMAL(19,4) | NOT NULL | Account balance before this line |
| balance_after | DECIMAL(19,4) | NOT NULL | Account balance after this line |
| entry_number | INTEGER | NOT NULL | Sequence number within transaction |

**Relationships:**
- Many-to-one with Transaction
- Many-to-one with BankAccount

**Indexes:**
- `idx_transaction_lines_transaction_id` — on `transaction_id`
- `idx_transaction_lines_account_id` — on `account_id`

---

#### 5.3.3 PendingTransaction

**Purpose:** Card authorization or other pre-settlement transaction hold.

**Business Rules:**
- Created when a card transaction is authorized but not yet settled
- Creates a BalanceHold on the account
- Expires after 7 days if not settled
- Settles when the corresponding CardTransaction is finalized
- Can be reversed (voided) before settlement

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| account_id | UUID | FK → BankAccount, NOT NULL | Account being debited |
| card_id | UUID | FK → Card, NOT NULL | Card used |
| card_transaction_id | UUID | FK → CardTransaction, NULLABLE | Settled card transaction |
| amount | DECIMAL(19,4) | NOT NULL | Authorized amount |
| merchant_name | VARCHAR(255) | NOT NULL | Merchant name |
| merchant_category_code | VARCHAR(4) | NULLABLE | MCC code |
| status | PendingTransactionStatus enum | NOT NULL, DEFAULT PENDING | PENDING, SETTLED, EXPIRED, VOIDED |
| authorized_at | TIMESTAMPTZ | NOT NULL | When authorization occurred |
| expires_at | TIMESTAMPTZ | NOT NULL | When authorization expires |
| settled_at | TIMESTAMPTZ | NULLABLE | When settled |

**Relationships:**
- Many-to-one with BankAccount
- Many-to-one with Card
- Many-to-one with CardTransaction (nullable)

**Indexes:**
- `idx_pending_transactions_account_id` — on `account_id`
- `idx_pending_transactions_card_id` — on `card_id`
- `idx_pending_transactions_status` — on `status` WHERE `status = 'PENDING'`

---

#### 5.3.4 TransactionCategory

**Purpose:** Spending categories for transaction classification.

**Business Rules:**
- System-defined default categories with optional user-created subcategories
- Categories are hierarchical (parent-child)
- Auto-categorization uses merchant category codes and description patterns
- Users can override auto-categorization

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, NULLABLE | Owner (NULL for system categories) |
| name | VARCHAR(100) | NOT NULL | Category name |
| slug | VARCHAR(100) | NOT NULL | URL-friendly identifier |
| icon | VARCHAR(50) | NULLABLE | Icon identifier |
| color | VARCHAR(7) | NULLABLE | Hex color code |
| parent_id | UUID | FK → TransactionCategory, NULLABLE | Parent for hierarchy |
| is_system | BOOLEAN | NOT NULL, DEFAULT FALSE | System-defined category |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | Display order |

**Relationships:**
- Many-to-one with User (nullable)
- Self-referencing: parent_id → TransactionCategory

**Indexes:**
- `idx_transaction_categories_user_id` — on `user_id`
- `idx_transaction_categories_slug` — on `slug`
- `uq_transaction_categories_user_slug` — UNIQUE on `(user_id, slug)`

---

#### 5.3.5 TransactionNote

**Purpose:** User-added notes attached to transactions.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| transaction_id | UUID | FK → Transaction, NOT NULL | Parent transaction |
| user_id | UUID | FK → User, NOT NULL | Note author |
| content | TEXT | NOT NULL | Note content (max 1000 chars) |

**Relationships:**
- Many-to-one with Transaction
- Many-to-one with User

**Indexes:**
- `idx_transaction_notes_transaction_id` — on `transaction_id`

---

#### 5.3.6 TransactionAttachment

**Purpose:** File attachments (receipts, invoices) for transactions.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| transaction_id | UUID | FK → Transaction, NOT NULL | Parent transaction |
| user_id | UUID | FK → User, NOT NULL | Uploader |
| file_name | VARCHAR(255) | NOT NULL | Original file name |
| file_url | VARCHAR(500) | NOT NULL | Storage URL |
| file_size | INTEGER | NOT NULL | File size in bytes |
| mime_type | VARCHAR(100) | NOT NULL | MIME type |

**Relationships:**
- Many-to-one with Transaction
- Many-to-one with User

**Indexes:**
- `idx_transaction_attachments_transaction_id` — on `transaction_id`

---

### 5.4 Transfer Domain

---

#### 5.4.1 Transfer

**Purpose:** Represents a money transfer between accounts (internal, ACH, wire).

**Business Rules:**
- Internal transfers between Atlas accounts are instant
- ACH transfers take 1-3 business days
- Domestic wire transfers are same-day (if submitted before 4 PM ET)
- International wires take 1-5 business days
- Transfers are processed through a defined lifecycle
- Compliance screening for transfers over $10,000 (CTR) and $3,000 (SAR threshold)

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| reference_number | VARCHAR(20) | UNIQUE, NOT NULL | User-facing reference |
| user_id | UUID | FK → User, NOT NULL | Transfer initiator |
| source_account_id | UUID | FK → BankAccount, NOT NULL | Account to debit |
| destination_account_id | UUID | FK → BankAccount, NULLABLE | Atlas account to credit (internal only) |
| external_account_id | UUID | FK → ExternalAccount, NULLABLE | External destination |
| type | TransferType enum | NOT NULL | INTERNAL, ACH_CREDIT, ACH_DEBIT, WIRE_DOMESTIC, WIRE_INTERNATIONAL, ZELLE |
| status | TransferStatus enum | NOT NULL, DEFAULT PENDING | Transfer status |
| amount | DECIMAL(19,4) | NOT NULL | Transfer amount |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'USD' | Currency code |
| fee_amount | DECIMAL(19,4) | NOT NULL, DEFAULT 0.0000 | Fee charged |
| description | VARCHAR(255) | NULLABLE | Transfer description |
| memo | VARCHAR(140) | NULLABLE | Memo for recipient |
| scheduled_at | TIMESTAMPTZ | NULLABLE | Scheduled execution time |
| processed_at | TIMESTAMPTZ | NULLABLE | When transfer was processed |
| completed_at | TIMESTAMPTZ | NULLABLE | When transfer completed |
| failed_at | TIMESTAMPTZ | NULLABLE | When transfer failed |
| failure_reason | VARCHAR(255) | NULLABLE | Reason for failure |
| compliance_checked | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether compliance check passed |
| metadata | JSONB | NULLABLE | Additional transfer data (SWIFT codes, etc.) |

**Relationships:**
- Many-to-one with User
- Many-to-one with BankAccount (source)
- Many-to-one with BankAccount (destination, nullable)
- Many-to-one with ExternalAccount (nullable)
- One-to-many with Transaction

**Indexes:**
- `idx_transfers_user_id` — on `user_id`
- `idx_transfers_source_account_id` — on `source_account_id`
- `idx_transfers_status` — on `status`
- `idx_transfers_reference_number` — UNIQUE on `reference_number`
- `idx_transfers_created_at` — on `created_at` DESC
- `idx_transfers_scheduled_at` — on `scheduled_at` WHERE `scheduled_at IS NOT NULL`

**Lifecycle:**
1. PENDING — Transfer created, awaiting processing
2. SCHEDULED — Scheduled for future execution
3. PROCESSING — Being processed by the payment rail
4. COMPLETED — Funds transferred successfully
5. FAILED — Transfer failed
6. CANCELLED — Cancelled by user before processing
7. RETURNED — Returned by receiving institution (ACH only)

---

#### 5.4.2 TransferMethod

**Purpose:** Static definitions of available transfer methods and their properties.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Method name |
| code | VARCHAR(20) | UNIQUE, NOT NULL | Method code |
| description | TEXT | NOT NULL | Description |
| min_amount | DECIMAL(19,4) | NOT NULL | Minimum transfer amount |
| max_amount | DECIMAL(19,4) | NOT NULL | Maximum transfer amount |
| daily_limit | DECIMAL(19,4) | NOT NULL | Daily transfer limit |
| monthly_limit | DECIMAL(19,4) | NOT NULL | Monthly transfer limit |
| fee_fixed | DECIMAL(19,4) | NOT NULL, DEFAULT 0.0000 | Fixed fee |
| fee_percentage | DECIMAL(5,4) | NOT NULL, DEFAULT 0.0000 | Percentage fee |
| processing_time_min | INTEGER | NULLABLE | Min processing time (hours) |
| processing_time_max | INTEGER | NULLABLE | Max processing time (hours) |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether method is available |
| supports_international | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether international transfers supported |

**Indexes:**
- `idx_transfer_methods_code` — UNIQUE on `code`

---

#### 5.4.3 TransferSchedule

**Purpose:** Recurring/scheduled transfer configuration.

**Business Rules:**
- Supports daily, weekly, biweekly, monthly, quarterly frequencies
- Scheduled transfers execute at 6:00 AM ET on the scheduled day
- If source account has insufficient funds, transfer is skipped and user is notified
- 3 consecutive skips result in automatic cancellation
- Users can pause and resume schedules

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, NOT NULL | Schedule owner |
| source_account_id | UUID | FK → BankAccount, NOT NULL | Source account |
| destination_account_id | UUID | FK → BankAccount, NULLABLE | Destination (internal) |
| external_account_id | UUID | FK → ExternalAccount, NULLABLE | Destination (external) |
| transfer_type | TransferType enum | NOT NULL | Type of transfer |
| amount | DECIMAL(19,4) | NOT NULL | Transfer amount |
| frequency | ScheduleFrequency enum | NOT NULL | DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY |
| day_of_week | INTEGER | NULLABLE | 0=Sunday, 6=Saturday (weekly/biweekly) |
| day_of_month | INTEGER | NULLABLE | 1-31 (monthly/quarterly) |
| status | ScheduleStatus enum | NOT NULL, DEFAULT ACTIVE | ACTIVE, PAUSED, CANCELLED, COMPLETED |
| next_execution_at | TIMESTAMPTZ | NOT NULL | Next scheduled execution |
| end_date | DATE | NULLABLE | Schedule end date |
| max_executions | INTEGER | NULLABLE | Maximum number of executions |
| execution_count | INTEGER | NOT NULL, DEFAULT 0 | Number of times executed |
| consecutive_failures | INTEGER | NOT NULL, DEFAULT 0 | Consecutive failure count |
| description | VARCHAR(255) | NULLABLE | Schedule description |

**Relationships:**
- Many-to-one with User
- Many-to-one with BankAccount (source)
- Many-to-one with BankAccount (destination, nullable)
- Many-to-one with ExternalAccount (nullable)

**Indexes:**
- `idx_transfer_schedules_user_id` — on `user_id`
- `idx_transfer_schedules_next_execution` — on `next_execution_at` WHERE `status = 'ACTIVE'`

---

#### 5.4.4 ExternalAccount

**Purpose:** External bank accounts linked by users for transfers.

**Business Rules:**
- Linked via Plaid (preferred) or manual micro-deposit verification
- Manual verification requires 2 micro-deposits confirmed by user
- External accounts must be verified before use for transfers
- Account numbers are encrypted at rest
- Users can link up to 5 external accounts

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, NOT NULL | Owner |
| institution_name | VARCHAR(255) | NOT NULL | Bank name |
| account_type | VARCHAR(50) | NOT NULL | CHECKING, SAVINGS |
| account_number_last4 | VARCHAR(4) | NOT NULL | Last 4 digits (display) |
| account_number_encrypted | TEXT | NOT NULL | Encrypted full account number |
| routing_number | VARCHAR(9) | NOT NULL | Bank routing number |
| holder_name | VARCHAR(255) | NOT NULL | Account holder name |
| verification_status | VerificationStatus enum | NOT NULL, DEFAULT PENDING | PENDING, VERIFIED, FAILED |
| verification_method | VerificationMethod enum | NOT NULL | PLAID, MICRO_DEPOSIT |
| plaid_access_token | TEXT | NULLABLE | Encrypted Plaid access token |
| plaid_item_id | VARCHAR(255) | NULLABLE | Plaid item ID |
| verified_at | TIMESTAMPTZ | NULLABLE | When verified |
| is_default | BOOLEAN | NOT NULL, DEFAULT FALSE | Default external account |
| nickname | VARCHAR(100) | NULLABLE | User-assigned nickname |

**Relationships:**
- Many-to-one with User
- One-to-many with Transfer, TransferSchedule

**Indexes:**
- `idx_external_accounts_user_id` — on `user_id`
- `idx_external_accounts_plaid_item_id` — on `plaid_item_id`

---

#### 5.4.5 TransferBeneficiary

**Purpose:** Saved recipient for quick transfers.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, NOT NULL | Owner |
| name | VARCHAR(255) | NOT NULL | Beneficiary display name |
| external_account_id | UUID | FK → ExternalAccount, NULLABLE | Linked external account |
| bank_account_id | UUID | FK → BankAccount, NULLABLE | Atlas account (internal) |
| email | VARCHAR(255) | NULLABLE | Email for Zelle transfers |
| phone | VARCHAR(20) | NULLABLE | Phone for Zelle transfers |
| is_favorite | BOOLEAN | NOT NULL, DEFAULT FALSE | Starred/favorite |

**Relationships:**
- Many-to-one with User
- Many-to-one with ExternalAccount (nullable)
- Many-to-one with BankAccount (nullable)

**Indexes:**
- `idx_transfer_beneficiaries_user_id` — on `user_id`

---

### 5.5 Card Domain

---

#### 5.5.1 Card

**Purpose:** Debit card linked to a bank account.

**Business Rules:**
- Physical cards are mailed; virtual cards are instant
- Each account can have up to 3 cards (1 physical, 2 virtual)
- Card numbers are encrypted at rest; only last 4 digits stored in plaintext
- Cards follow a lifecycle: ISSUED → ACTIVATED → ACTIVE → FROZEN → CLOSED
- Lost/stolen cards are immediately frozen and a replacement issued
- PIN is stored as a separate encrypted hash
- Card numbers pass Luhn validation

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| account_id | UUID | FK → BankAccount, NOT NULL | Linked account |
| user_id | UUID | FK → User, NOT NULL | Card holder |
| card_number_last4 | VARCHAR(4) | NOT NULL | Last 4 digits |
| card_number_encrypted | TEXT | NOT NULL | Encrypted full card number |
| card_number_hash | VARCHAR(255) | NOT NULL | Hash for lookups |
| card_type | CardType enum | NOT NULL | PHYSICAL, VIRTUAL |
| card_brand | CardBrand enum | NOT NULL | VISA, MASTERCARD |
| status | CardStatus enum | NOT NULL, DEFAULT ISSUED | Card status |
| expiration_month | INTEGER | NOT NULL | Expiration month (1-12) |
| expiration_year | INTEGER | NOT NULL | Expiration year (4-digit) |
| pin_hash | VARCHAR(255) | NOT NULL | Encrypted PIN |
| billing_address_line1 | VARCHAR(255) | NOT NULL | Billing address |
| billing_city | VARCHAR(100) | NOT NULL | Billing city |
| billing_state | VARCHAR(2) | NOT NULL | Billing state |
| billing_zip | VARCHAR(10) | NOT NULL | Billing ZIP |
| is_contactless | BOOLEAN | NOT NULL, DEFAULT TRUE | Contactless enabled |
| is_online_enabled | BOOLEAN | NOT NULL, DEFAULT TRUE | Online transactions enabled |
| is_international_enabled | BOOLEAN | NOT NULL, DEFAULT FALSE | International use enabled |
| activated_at | TIMESTAMPTZ | NULLABLE | When card was activated |
| frozen_at | TIMESTAMPTZ | NULLABLE | When card was frozen |
| closed_at | TIMESTAMPTZ | NULLABLE | When card was closed |
| replacement_card_id | UUID | FK → Card, NULLABLE | Replacement card if reissued |
| design_id | UUID | FK → CardDesign, NULLABLE | Selected design |

**Relationships:**
- Many-to-one with BankAccount
- Many-to-one with User
- Self-referencing: replacement_card_id → Card
- One-to-one with CardLimit
- One-to-one with CardControl
- One-to-one with CardActivation
- One-to-many with CardTransaction

**Indexes:**
- `idx_cards_account_id` — on `account_id`
- `idx_cards_user_id` — on `user_id`
- `idx_cards_card_number_hash` — UNIQUE on `card_number_hash`
- `idx_cards_status` — on `status`

**Lifecycle:**
1. ISSUED — Card created, awaiting activation
2. ACTIVATED — Card activated by user
3. ACTIVE — Card fully operational
4. FROZEN — Temporarily frozen (user or admin)
5. CLOSED — Permanently closed (lost, stolen, expired, replaced)

---

#### 5.5.2 CardTransaction

**Purpose:** Individual card purchase or ATM withdrawal.

**Business Rules:**
- Created on authorization; updated on settlement
- Pending card transactions create BalanceHold entries
- Merchant category code used for auto-categorization
- Refunds create a credit CardTransaction
- Chargebacks handled through a separate dispute workflow

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| card_id | UUID | FK → Card, NOT NULL | Card used |
| pending_transaction_id | UUID | FK → PendingTransaction, NULLABLE | Authorization hold |
| transaction_id | UUID | FK → Transaction, NULLABLE | Settled transaction |
| type | CardTransactionType enum | NOT NULL | PURCHASE, ATM_WITHDRAWAL, REFUND, CASHBACK |
| status | CardTransactionStatus enum | NOT NULL, DEFAULT PENDING | AUTHORIZED, SETTLED, DECLINED, REVERSED, REFUNDED |
| amount | DECIMAL(19,4) | NOT NULL | Transaction amount |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'USD' | Currency |
| merchant_name | VARCHAR(255) | NOT NULL | Merchant name |
| merchant_category_code | VARCHAR(4) | NULLABLE | MCC code |
| merchant_city | VARCHAR(100) | NULLABLE | Merchant city |
| merchant_state | VARCHAR(2) | NULLABLE | Merchant state |
| merchant_country | VARCHAR(2) | NULLABLE | Merchant country |
| is_online | BOOLEAN | NOT NULL, DEFAULT FALSE | Online transaction |
| is_international | BOOLEAN | NOT NULL, DEFAULT FALSE | International transaction |
| pos_entry_mode | VARCHAR(20) | NULLABLE | CHIP, SWIPE, CONTACTLESS, MANUAL, ONLINE |
| authorization_code | VARCHAR(10) | NULLABLE | Authorization code from network |
| decline_reason | VARCHAR(100) | NULLABLE | Reason for decline |
| settled_at | TIMESTAMPTZ | NULLABLE | When settled |

**Relationships:**
- Many-to-one with Card
- Many-to-one with PendingTransaction (nullable)
- Many-to-one with Transaction (nullable)

**Indexes:**
- `idx_card_transactions_card_id` — on `card_id`
- `idx_card_transactions_status` — on `status`
- `idx_card_transactions_created_at` — on `created_at` DESC
- `idx_card_transactions_merchant` — on `merchant_name`

---

#### 5.5.3 CardLimit

**Purpose:** Spending limits per card.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| card_id | UUID | FK → Card, UNIQUE, NOT NULL | The card |
| daily_purchase_limit | DECIMAL(19,4) | NOT NULL, DEFAULT 5000.0000 | Daily purchase limit |
| daily_atm_limit | DECIMAL(19,4) | NOT NULL, DEFAULT 1000.0000 | Daily ATM withdrawal limit |
| daily_total_limit | DECIMAL(19,4) | NOT NULL, DEFAULT 5000.0000 | Daily total limit |
| monthly_purchase_limit | DECIMAL(19,4) | NOT NULL, DEFAULT 25000.0000 | Monthly purchase limit |
| single_transaction_limit | DECIMAL(19,4) | NOT NULL, DEFAULT 2500.0000 | Single transaction limit |
| daily_purchase_used | DECIMAL(19,4) | NOT NULL, DEFAULT 0.0000 | Used today (purchases) |
| daily_atm_used | DECIMAL(19,4) | NOT NULL, DEFAULT 0.0000 | Used today (ATM) |
| last_reset_at | TIMESTAMPTZ | NOT NULL | When daily counters were reset |

**Relationships:**
- One-to-one with Card

**Indexes:**
- `idx_card_limits_card_id` — UNIQUE on `card_id`

---

#### 5.5.4 CardControl

**Purpose:** User-configurable card usage controls.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| card_id | UUID | FK → Card, UNIQUE, NOT NULL | The card |
| allow_online_transactions | BOOLEAN | NOT NULL, DEFAULT TRUE | Online purchases |
| allow_international_transactions | BOOLEAN | NOT NULL, DEFAULT FALSE | International purchases |
| allow_atm_withdrawals | BOOLEAN | NOT NULL, DEFAULT TRUE | ATM withdrawals |
| allow_contactless | BOOLEAN | NOT NULL, DEFAULT TRUE | Contactless payments |
| allowed_merchant_categories | TEXT[] | NULLABLE | Allowed MCC codes (NULL = all) |
| blocked_merchant_categories | TEXT[] | NULLABLE | Blocked MCC codes |
| allowed_countries | TEXT[] | NULLABLE | Allowed countries (NULL = all) |
| blocked_countries | TEXT[] | NULLABLE | Blocked countries |
| allow_recurring | BOOLEAN | NOT NULL, DEFAULT TRUE | Recurring/subscription payments |

**Relationships:**
- One-to-one with Card

**Indexes:**
- `idx_card_controls_card_id` — UNIQUE on `card_id`

---

#### 5.5.5 CardDesign

**Purpose:** Physical card design/style options.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Design name |
| description | TEXT | NULLABLE | Design description |
| image_url | VARCHAR(500) | NOT NULL | Card image URL |
| thumbnail_url | VARCHAR(500) | NOT NULL | Thumbnail URL |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether design is available |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | Display order |

**Indexes:**
- `idx_card_designs_is_active` — on `is_active` WHERE `is_active = TRUE`

---

#### 5.5.6 CardActivation

**Purpose:** Tracks card activation process.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| card_id | UUID | FK → Card, UNIQUE, NOT NULL | The card |
| activation_code | VARCHAR(6) | NOT NULL | Last 4 of card + expiration |
| attempts | INTEGER | NOT NULL, DEFAULT 0 | Failed activation attempts |
| max_attempts | INTEGER | NOT NULL, DEFAULT 5 | Maximum attempts before lockout |
| is_activated | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether activated |
| activated_at | TIMESTAMPTZ | NULLABLE | When activated |
| activated_ip | INET | NULLABLE | IP address at activation |
| activated_user_agent | TEXT | NULLABLE | User agent at activation |

**Relationships:**
- One-to-one with Card

**Indexes:**
- `idx_card_activations_card_id` — UNIQUE on `card_id`

---

### 5.6 Crypto Domain

---

#### 5.6.1 CryptoWallet

**Purpose:** Per-user, per-asset, per-network cryptocurrency wallet.

**Business Rules:**
- Wallet addresses are assigned by Atlas's crypto custodian
- Each user can have one wallet per asset-network combination
- Addresses are generated on demand (first deposit or user request)
- Wallet addresses are verified on-chain before activation
- Hot wallet for operational funds; cold storage for reserves

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, NOT NULL | Wallet owner |
| asset_id | UUID | FK → CryptoAsset, NOT NULL | Cryptocurrency asset |
| network_id | UUID | FK → CryptoNetwork, NOT NULL | Blockchain network |
| address | VARCHAR(255) | NOT NULL | Wallet address |
| address_tag | VARCHAR(255) | NULLABLE | Memo/tag for networks that require it (XRP, EOS) |
| status | WalletStatus enum | NOT NULL, DEFAULT ACTIVE | ACTIVE, FROZEN, CLOSED |
| is_internal | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether this is Atlas's hot wallet |
| balance | DECIMAL(36,18) | NOT NULL, DEFAULT 0 | On-chain balance |
| last_synced_at | TIMESTAMPTZ | NULLABLE | Last blockchain sync |
| label | VARCHAR(100) | NULLABLE | User-assigned label |

**Relationships:**
- Many-to-one with User
- Many-to-one with CryptoAsset
- Many-to-one with CryptoNetwork
- One-to-many with CryptoDeposit, CryptoWithdrawal, CryptoTransaction

**Indexes:**
- `idx_crypto_wallets_user_id` — on `user_id`
- `idx_crypto_wallets_address` — on `address`
- `uq_crypto_wallets_user_asset_network` — UNIQUE on `(user_id, asset_id, network_id)`

---

#### 5.6.2 CryptoAsset

**Purpose:** Definitions of supported cryptocurrency assets.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| symbol | VARCHAR(10) | UNIQUE, NOT NULL | Asset symbol (BTC, ETH, etc.) |
| name | VARCHAR(100) | NOT NULL | Full name (Bitcoin, Ethereum) |
| decimals | INTEGER | NOT NULL | Decimal places for amounts |
| min_deposit | DECIMAL(36,18) | NOT NULL | Minimum deposit amount |
| min_withdrawal | DECIMAL(36,18) | NOT NULL | Minimum withdrawal amount |
| withdrawal_fee | DECIMAL(36,18) | NOT NULL | Flat withdrawal fee |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether asset is available |
| icon_url | VARCHAR(500) | NULLABLE | Asset icon |
| coingecko_id | VARCHAR(100) | NULLABLE | CoinGecko API ID for prices |

**Relationships:**
- One-to-many with CryptoWallet, CryptoDeposit, CryptoWithdrawal, CryptoPrice

**Indexes:**
- `idx_crypto_assets_symbol` — UNIQUE on `symbol`

---

#### 5.6.3 CryptoNetwork

**Purpose:** Blockchain network definitions.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Network name (Ethereum, Bitcoin, Tron) |
| chain_id | INTEGER | NULLABLE | EVM chain ID |
| symbol | VARCHAR(10) | NOT NULL | Native token symbol |
| explorer_url | VARCHAR(255) | NOT NULL | Block explorer base URL |
| confirmations_required | INTEGER | NOT NULL | Required confirmations for deposit |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether network is available |
| avg_block_time_seconds | INTEGER | NULLABLE | Average block time |

**Relationships:**
- One-to-many with CryptoWallet

**Indexes:**
- `idx_crypto_networks_name` — UNIQUE on `name`

---

#### 5.6.4 CryptoDeposit

**Purpose:** Incoming cryptocurrency deposit to a user wallet.

**Business Rules:**
- Deposits are detected by monitoring the blockchain
- Minimum confirmations required before crediting (varies by network)
- Deposits below minimum are ignored
- Each deposit is tied to a specific on-chain transaction
- Deposits create a CREDIT Transaction in the user's USD account at the current market rate

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| wallet_id | UUID | FK → CryptoWallet, NOT NULL | Destination wallet |
| asset_id | UUID | FK → CryptoAsset, NOT NULL | Asset deposited |
| transaction_id | UUID | FK → Transaction, NULLABLE | USD credit transaction |
| amount | DECIMAL(36,18) | NOT NULL | Amount deposited (crypto) |
| usd_value | DECIMAL(19,4) | NOT NULL | USD value at time of deposit |
| usd_price | DECIMAL(19,8) | NOT NULL | Price per unit at deposit |
| tx_hash | VARCHAR(255) | NOT NULL | On-chain transaction hash |
| from_address | VARCHAR(255) | NOT NULL | Sender address |
| to_address | VARCHAR(255) | NOT NULL | Destination address |
| confirmations | INTEGER | NOT NULL, DEFAULT 0 | Current confirmation count |
| required_confirmations | INTEGER | NOT NULL | Required confirmations |
| status | CryptoDepositStatus enum | NOT NULL, DEFAULT PENDING | PENDING, CONFIRMED, CREDITED, FAILED |
| detected_at | TIMESTAMPTZ | NOT NULL | When deposit was first detected |
| confirmed_at | TIMESTAMPTZ | NULLABLE | When fully confirmed |
| credited_at | TIMESTAMPTZ | NULLABLE | When credited to user account |
| block_number | BIGINT | NULLABLE | Block number |
| network_fee | DECIMAL(36,18) | NULLABLE | Network fee paid |

**Relationships:**
- Many-to-one with CryptoWallet
- Many-to-one with CryptoAsset
- Many-to-one with Transaction (nullable)

**Indexes:**
- `idx_crypto_deposits_wallet_id` — on `wallet_id`
- `idx_crypto_deposits_tx_hash` — on `tx_hash`
- `idx_crypto_deposits_status` — on `status`
- `idx_crypto_deposits_created_at` — on `created_at` DESC

**Lifecycle:**
1. PENDING — Detected on blockchain, awaiting confirmations
2. CONFIRMED — Required confirmations reached
3. CREDITED — USD value credited to user's account
4. FAILED — Deposit failed (below minimum, invalid, etc.)

---

#### 5.6.5 CryptoWithdrawal

**Purpose:** Outgoing cryptocurrency withdrawal from user account.

**Business Rules:**
- Withdrawals require approval for amounts above a threshold
- User must have sufficient USD balance to cover the withdrawal
- Funds are debited from the user's bank account at current market rate
- Withdrawals are processed through Atlas's hot wallet
- Anti-money laundering (AML) checks performed before processing

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, NOT NULL | Requester |
| wallet_id | UUID | FK → CryptoWallet, NOT NULL | Source wallet |
| asset_id | UUID | FK → CryptoAsset, NOT NULL | Asset withdrawn |
| transaction_id | UUID | FK → Transaction, NULLABLE | USD debit transaction |
| amount | DECIMAL(36,18) | NOT NULL | Amount to withdraw |
| usd_value | DECIMAL(19,4) | NOT NULL | USD value at withdrawal |
| usd_price | DECIMAL(19,8) | NOT NULL | Price per unit |
| fee_amount | DECIMAL(36,18) | NOT NULL | Withdrawal fee (crypto) |
| net_amount | DECIMAL(36,18) | NOT NULL | Amount after fee |
| to_address | VARCHAR(255) | NOT NULL | Destination address |
| address_tag | VARCHAR(255) | NULLABLE | Memo/tag |
| tx_hash | VARCHAR(255) | NULLABLE | On-chain transaction hash |
| status | CryptoWithdrawalStatus enum | NOT NULL, DEFAULT PENDING | PENDING, APPROVED, PROCESSING, COMPLETED, FAILED, CANCELLED |
| approved_by | UUID | FK → User, NULLABLE | Admin who approved |
| approved_at | TIMESTAMPTZ | NULLABLE | When approved |
| processed_at | TIMESTAMPTZ | NULLABLE | When sent on-chain |
| completed_at | TIMESTAMPTZ | NULLABLE | When confirmed on-chain |
| failed_at | TIMESTAMPTZ | NULLABLE | When failed |
| failure_reason | VARCHAR(255) | NULLABLE | Reason for failure |
| block_number | BIGINT | NULLABLE | Block number |
| network_fee | DECIMAL(36,18) | NULLABLE | Network fee paid |
| aml_checked | BOOLEAN | NOT NULL, DEFAULT FALSE | AML screening passed |

**Relationships:**
- Many-to-one with User
- Many-to-one with CryptoWallet
- Many-to-one with CryptoAsset
- Many-to-one with Transaction (nullable)

**Indexes:**
- `idx_crypto_withdrawals_user_id` — on `user_id`
- `idx_crypto_withdrawals_status` — on `status`
- `idx_crypto_withdrawals_tx_hash` — on `tx_hash`
- `idx_crypto_withdrawals_created_at` — on `created_at` DESC

**Lifecycle:**
1. PENDING — Request submitted, awaiting review
2. APPROVED — Approved by admin (or auto-approved if below threshold)
3. PROCESSING — Transaction submitted to blockchain
4. COMPLETED — Transaction confirmed on blockchain
5. FAILED — Withdrawal failed
6. CANCELLED — Cancelled by user or admin

---

#### 5.6.6 CryptoTransaction

**Purpose:** On-chain transaction record for wallet activity.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| wallet_id | UUID | FK → CryptoWallet, NOT NULL | Related wallet |
| tx_hash | VARCHAR(255) | NOT NULL | Transaction hash |
| type | CryptoTxType enum | NOT NULL | DEPOSIT, WITHDRAWAL, INTERNAL |
| amount | DECIMAL(36,18) | NOT NULL | Amount |
| from_address | VARCHAR(255) | NOT NULL | Sender |
| to_address | VARCHAR(255) | NOT NULL | Recipient |
| block_number | BIGINT | NULLABLE | Block number |
| confirmations | INTEGER | NOT NULL, DEFAULT 0 | Confirmation count |
| fee | DECIMAL(36,18) | NULLABLE | Network fee |
| status | CryptoTxStatus enum | NOT NULL | PENDING, CONFIRMED, FAILED |
| detected_at | TIMESTAMPTZ | NOT NULL | When detected |
| confirmed_at | TIMESTAMPTZ | NULLABLE | When confirmed |

**Relationships:**
- Many-to-one with CryptoWallet

**Indexes:**
- `idx_crypto_transactions_wallet_id` — on `wallet_id`
- `idx_crypto_transactions_tx_hash` — on `tx_hash`

---

#### 5.6.7 CryptoPrice

**Purpose:** Cached cryptocurrency USD prices.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| asset_id | UUID | FK → CryptoAsset, NOT NULL | The asset |
| price_usd | DECIMAL(19,8) | NOT NULL | Price in USD |
| price_change_24h | DECIMAL(8,4) | NULLABLE | 24h price change percentage |
| market_cap | DECIMAL(36,2) | NULLABLE | Market cap in USD |
| volume_24h | DECIMAL(36,2) | NULLABLE | 24h trading volume |
| source | VARCHAR(50) | NOT NULL | Price source (coingecko, etc.) |
| fetched_at | TIMESTAMPTZ | NOT NULL | When price was fetched |

**Relationships:**
- Many-to-one with CryptoAsset

**Indexes:**
- `idx_crypto_prices_asset_id` — on `asset_id`
- `idx_crypto_prices_fetched_at` — on `fetched_at` DESC

---

### 5.7 Investment Domain

---

#### 5.7.1 InvestmentAccount

**Purpose:** Investment account wrapper for each user.

**Business Rules:**
- One investment account per user (expandable to multiple)
- Separate from bank accounts
- Linked to a primary bank account for funding

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, UNIQUE, NOT NULL | Account owner |
| status | InvestmentAccountStatus enum | NOT NULL, DEFAULT ACTIVE | Account status |
| funding_account_id | UUID | FK → BankAccount, NULLABLE | Linked bank account for funding |
| total_invested | DECIMAL(19,4) | NOT NULL, DEFAULT 0.0000 | Total amount invested |
| current_value | DECIMAL(19,4) | NOT NULL, DEFAULT 0.0000 | Current portfolio value |
| total_gain_loss | DECIMAL(19,4) | NOT NULL, DEFAULT 0.0000 | Total gain/loss |
| risk_profile | RiskProfile enum | NULLABLE | CONSERVATIVE, MODERATE, AGGRESSIVE |

**Relationships:**
- One-to-one with User
- Many-to-one with BankAccount (funding)
- One-to-many with InvestmentHolding, InvestmentTransaction

**Indexes:**
- `idx_investment_accounts_user_id` — UNIQUE on `user_id`

---

#### 5.7.2 InvestmentHolding

**Purpose:** Individual asset held within an investment account.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| account_id | UUID | FK → InvestmentAccount, NOT NULL | Investment account |
| asset_id | UUID | FK → InvestmentAsset, NOT NULL | The asset held |
| quantity | DECIMAL(19,8) | NOT NULL | Number of shares/units |
| average_cost_basis | DECIMAL(19,4) | NOT NULL | Average purchase price per unit |
| total_cost_basis | DECIMAL(19,4) | NOT NULL | Total amount invested |
| current_price | DECIMAL(19,4) | NOT NULL | Current price per unit |
| current_value | DECIMAL(19,4) | NOT NULL | Current total value |
| gain_loss | DECIMAL(19,4) | NOT NULL | Unrealized gain/loss |
| gain_loss_percentage | DECIMAL(8,4) | NOT NULL | Gain/loss percentage |
| last_price_update_at | TIMESTAMPTZ | NOT NULL | Last price update |

**Relationships:**
- Many-to-one with InvestmentAccount
- Many-to-one with InvestmentAsset

**Indexes:**
- `idx_investment_holdings_account_id` — on `account_id`
- `uq_investment_holdings_account_asset` — UNIQUE on `(account_id, asset_id)`

---

#### 5.7.3 InvestmentTransaction

**Purpose:** Investment trade/transaction record.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| account_id | UUID | FK → InvestmentAccount, NOT NULL | Investment account |
| asset_id | UUID | FK → InvestmentAsset, NOT NULL | Traded asset |
| type | InvestmentTxType enum | NOT NULL | BUY, SELL, DIVIDEND, SPLIT, TRANSFER_IN, TRANSFER_OUT |
| status | InvestmentTxStatus enum | NOT NULL, DEFAULT PENDING | PENDING, EXECUTED, SETTLED, CANCELLED |
| quantity | DECIMAL(19,8) | NOT NULL | Number of units |
| price_per_unit | DECIMAL(19,4) | NOT NULL | Price per unit at execution |
| total_amount | DECIMAL(19,4) | NOT NULL | Total transaction amount |
| fee | DECIMAL(19,4) | NOT NULL, DEFAULT 0.0000 | Transaction fee |
| executed_at | TIMESTAMPTZ | NULLABLE | When trade was executed |
| settled_at | TIMESTAMPTZ | NULLABLE | When trade settled |
| bank_transaction_id | UUID | FK → Transaction, NULLABLE | Funding transaction |

**Relationships:**
- Many-to-one with InvestmentAccount
- Many-to-one with InvestmentAsset
- Many-to-one with Transaction (nullable)

**Indexes:**
- `idx_investment_transactions_account_id` — on `account_id`
- `idx_investment_transactions_created_at` — on `created_at` DESC

---

#### 5.7.4 InvestmentAsset

**Purpose:** Tradeable investment asset definitions (stocks, ETFs, etc.).

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| symbol | VARCHAR(10) | UNIQUE, NOT NULL | Ticker symbol |
| name | VARCHAR(255) | NOT NULL | Full name |
| type | InvestmentAssetType enum | NOT NULL | STOCK, ETF, MUTUAL_FUND, BOND, CRYPTO |
| exchange | VARCHAR(50) | NOT NULL | Exchange (NYSE, NASDAQ, etc.) |
| currency | VARCHAR(3) | NOT NULL, DEFAULT 'USD' | Trading currency |
| current_price | DECIMAL(19,4) | NULLABLE | Current price |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether tradeable |
| is_fractional | BOOLEAN | NOT NULL, DEFAULT TRUE | Fractional shares supported |
| min_investment | DECIMAL(19,4) | NULLABLE | Minimum investment amount |
| icon_url | VARCHAR(500) | NULLABLE | Asset icon |

**Indexes:**
- `idx_investment_assets_symbol` — UNIQUE on `symbol`
- `idx_investment_assets_type` — on `type`

---

### 5.8 Loan Domain

---

#### 5.8.1 Loan

**Purpose:** Active personal loan or line of credit.

**Business Rules:**
- Loan amounts: $500 - $50,000
- Terms: 3, 6, 12, 24, 36, 48, 60 months
- Interest rates vary based on creditworthiness (5.99% - 29.99% APR)
- Payments are auto-deducted from the linked bank account
- 15-day grace period before late fee
- Late fee: $25 or 5% of payment (whichever is less)
- Prepayment allowed without penalty
- Loan status affects user's overall account standing

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, NOT NULL | Borrower |
| account_id | UUID | FK → BankAccount, NOT NULL | Account for disbursement/payments |
| application_id | UUID | FK → LoanApplication, NOT NULL | Original application |
| loan_number | VARCHAR(20) | UNIQUE, NOT NULL | User-facing loan number |
| type | LoanType enum | NOT NULL | PERSONAL, LINE_OF_CREDIT |
| status | LoanStatus enum | NOT NULL | ACTIVE, PAID_OFF, DEFAULTED, CHARGED_OFF, IN_COLLECTIONS |
| principal_amount | DECIMAL(19,4) | NOT NULL | Original loan amount |
| outstanding_balance | DECIMAL(19,4) | NOT NULL | Remaining principal |
| interest_rate | DECIMAL(5,4) | NOT NULL | Annual interest rate |
| term_months | INTEGER | NOT NULL | Loan term in months |
| monthly_payment | DECIMAL(19,4) | NOT NULL | Monthly payment amount |
| total_interest | DECIMAL(19,4) | NOT NULL | Total interest over life |
| total_payable | DECIMAL(19,4) | NOT NULL | Total amount payable |
| next_payment_date | DATE | NOT NULL | Next payment due date |
| next_payment_amount | DECIMAL(19,4) | NOT NULL | Next payment amount |
| payments_made | INTEGER | NOT NULL, DEFAULT 0 | Number of payments made |
| payments_remaining | INTEGER | NOT NULL | Number of payments remaining |
| late_payment_count | INTEGER | NOT NULL, DEFAULT 0 | Number of late payments |
| disbursed_at | TIMESTAMPTZ | NOT NULL | When loan was disbursed |
| maturity_date | DATE | NOT NULL | Loan maturity date |
| paid_off_at | TIMESTAMPTZ | NULLABLE | When fully paid off |
| default_date | DATE | NULLABLE | Date of default |
| autopay_enabled | BOOLEAN | NOT NULL, DEFAULT TRUE | Auto-deduct payment |

**Relationships:**
- Many-to-one with User
- Many-to-one with BankAccount
- Many-to-one with LoanApplication
- One-to-many with LoanPayment, LoanSchedule

**Indexes:**
- `idx_loans_user_id` — on `user_id`
- `idx_loans_status` — on `status`
- `idx_loans_next_payment_date` — on `next_payment_date`
- `idx_loans_loan_number` — UNIQUE on `loan_number`

**Lifecycle:**
1. ACTIVE — Loan is active with remaining balance
2. PAID_OFF — All payments made, balance is zero
3. DEFAULTED — 90+ days past due
4. CHARGED_OFF — Written off as loss
5. IN_COLLECTIONS — Sent to collections agency

---

#### 5.8.2 LoanPayment

**Purpose:** Individual payment record toward a loan.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| loan_id | UUID | FK → Loan, NOT NULL | The loan |
| transaction_id | UUID | FK → Transaction, NULLABLE | Bank transaction |
| payment_number | INTEGER | NOT NULL | Sequential payment number |
| principal_amount | DECIMAL(19,4) | NOT NULL | Principal portion |
| interest_amount | DECIMAL(19,4) | NOT NULL | Interest portion |
| fee_amount | DECIMAL(19,4) | NOT NULL, DEFAULT 0.0000 | Fees (late fee, etc.) |
| total_amount | DECIMAL(19,4) | NOT NULL | Total payment |
| remaining_balance | DECIMAL(19,4) | NOT NULL | Balance after payment |
| status | PaymentStatus enum | NOT NULL | PENDING, COMPLETED, FAILED, LATE |
| due_date | DATE | NOT NULL | Payment due date |
| paid_at | TIMESTAMPTZ | NULLABLE | When payment was made |
| is_late | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether payment was late |
| late_fee_charged | DECIMAL(19,4) | NULLABLE | Late fee amount |

**Relationships:**
- Many-to-one with Loan
- Many-to-one with Transaction (nullable)

**Indexes:**
- `idx_loan_payments_loan_id` — on `loan_id`
- `idx_loan_payments_due_date` — on `due_date`

---

#### 5.8.3 LoanSchedule

**Purpose:** Amortization schedule — planned payments over the loan term.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| loan_id | UUID | FK → Loan, NOT NULL | The loan |
| payment_number | INTEGER | NOT NULL | Payment sequence number |
| due_date | DATE | NOT NULL | Scheduled due date |
| principal_amount | DECIMAL(19,4) | NOT NULL | Planned principal |
| interest_amount | DECIMAL(19,4) | NOT NULL | Planned interest |
| total_amount | DECIMAL(19,4) | NOT NULL | Planned total |
| remaining_balance | DECIMAL(19,4) | NOT NULL | Planned remaining balance |

**Relationships:**
- Many-to-one with Loan

**Indexes:**
- `idx_loan_schedules_loan_id` — on `loan_id`
- `uq_loan_schedules_loan_payment` — UNIQUE on `(loan_id, payment_number)`

---

#### 5.8.4 LoanApplication

**Purpose:** Loan application submitted by a user.

**Business Rules:**
- Applications require income verification and credit check (simulated in demo)
- Applications can be: SUBMITTED, UNDER_REVIEW, APPROVED, DENIED, WITHDRAWN
- Approved applications generate a Loan upon acceptance
- Denied applications include a reason code

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, NOT NULL | Applicant |
| type | LoanType enum | NOT NULL | PERSONAL, LINE_OF_CREDIT |
| requested_amount | DECIMAL(19,4) | NOT NULL | Requested loan amount |
| requested_term_months | INTEGER | NOT NULL | Requested term |
| purpose | VARCHAR(255) | NOT NULL | Stated purpose |
| annual_income | DECIMAL(19,4) | NOT NULL | Self-reported annual income |
| employment_status | EmploymentStatus enum | NOT NULL | FULL_TIME, PART_TIME, SELF_EMPLOYED, RETIRED, OTHER |
| employer_name | VARCHAR(255) | NULLABLE | Employer name |
| credit_score | INTEGER | NULLABLE | Credit score (from check) |
| status | LoanApplicationStatus enum | NOT NULL, DEFAULT SUBMITTED | Application status |
| approved_amount | DECIMAL(19,4) | NULLABLE | Amount approved |
| approved_rate | DECIMAL(5,4) | NULLABLE | Approved interest rate |
| approved_term | INTEGER | NULLABLE | Approved term in months |
| denial_reason | VARCHAR(500) | NULLABLE | Reason for denial |
| reviewed_by | UUID | FK → User, NULLABLE | Admin who reviewed |
| reviewed_at | TIMESTAMPTZ | NULLABLE | When reviewed |
| expires_at | TIMESTAMPTZ | NULLABLE | Offer expiration |

**Relationships:**
- Many-to-one with User
- One-to-many with LoanDocument

**Indexes:**
- `idx_loan_applications_user_id` — on `user_id`
- `idx_loan_applications_status` — on `status`

---

#### 5.8.5 LoanDocument

**Purpose:** Documents uploaded for loan applications.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| application_id | UUID | FK → LoanApplication, NOT NULL | Parent application |
| type | DocumentType enum | NOT NULL | ID_VERIFICATION, INCOME_PROOF, EMPLOYMENT_VERIFICATION, TAX_RETURN, BANK_STATEMENT, OTHER |
| file_name | VARCHAR(255) | NOT NULL | Original file name |
| file_url | VARCHAR(500) | NOT NULL | Storage URL |
| file_size | INTEGER | NOT NULL | File size in bytes |
| mime_type | VARCHAR(100) | NOT NULL | MIME type |
| status | DocumentStatus enum | NOT NULL, DEFAULT UPLOADED | UPLOADED, REVIEWED, APPROVED, REJECTED |
| rejection_reason | VARCHAR(255) | NULLABLE | Reason for rejection |
| reviewed_by | UUID | FK → User, NULLABLE | Admin who reviewed |

**Relationships:**
- Many-to-one with LoanApplication

**Indexes:**
- `idx_loan_documents_application_id` — on `application_id`

---

### 5.9 Notification Domain

---

#### 5.9.1 Notification

**Purpose:** In-app notification for user events.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, NOT NULL | Recipient |
| type | NotificationType enum | NOT NULL | Transaction, Security, Account, Transfer, Card, Crypto, Loan, System, Marketing |
| title | VARCHAR(255) | NOT NULL | Notification title |
| body | TEXT | NOT NULL | Notification body |
| data | JSONB | NULLABLE | Structured data (deep links, IDs) |
| priority | NotificationPriority enum | NOT NULL, DEFAULT NORMAL | LOW, NORMAL, HIGH, URGENT |
| is_read | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether read |
| read_at | TIMESTAMPTZ | NULLABLE | When read |
| archived_at | TIMESTAMPTZ | NULLABLE | When archived |

**Relationships:**
- Many-to-one with User
- One-to-many with NotificationDelivery

**Indexes:**
- `idx_notifications_user_id` — on `user_id`
- `idx_notifications_user_unread` — on `(user_id, is_read)` WHERE `is_read = FALSE`
- `idx_notifications_created_at` — on `created_at` DESC

---

#### 5.9.2 NotificationPreference

**Purpose:** Per-user notification preferences.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, UNIQUE, NOT NULL | Owner |
| email_enabled | BOOLEAN | NOT NULL, DEFAULT TRUE | Email notifications |
| sms_enabled | BOOLEAN | NOT NULL, DEFAULT FALSE | SMS notifications |
| push_enabled | BOOLEAN | NOT NULL, DEFAULT TRUE | Push notifications |
| transaction_alerts | BOOLEAN | NOT NULL, DEFAULT TRUE | Transaction notifications |
| security_alerts | BOOLEAN | NOT NULL, DEFAULT TRUE | Security notifications |
| marketing_emails | BOOLEAN | NOT NULL, DEFAULT FALSE | Marketing emails |
| login_alerts | BOOLEAN | NOT NULL, DEFAULT TRUE | Login notifications |
| balance_alerts | BOOLEAN | NOT NULL, DEFAULT TRUE | Balance threshold alerts |
| transfer_alerts | BOOLEAN | NOT NULL, DEFAULT TRUE | Transfer notifications |

**Relationships:**
- One-to-one with User

**Indexes:**
- `idx_notification_preferences_user_id` — UNIQUE on `user_id`

---

#### 5.9.3 NotificationTemplate

**Purpose:** Message templates for notification generation.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| code | VARCHAR(100) | UNIQUE, NOT NULL | Template identifier |
| name | VARCHAR(255) | NOT NULL | Template name |
| type | NotificationType enum | NOT NULL | Notification type |
| channel | NotificationChannel enum | NOT NULL | IN_APP, EMAIL, SMS, PUSH |
| subject_template | VARCHAR(255) | NOT NULL | Subject/title template with variables |
| body_template | TEXT | NOT NULL | Body template with variables |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether template is active |

**Indexes:**
- `idx_notification_templates_code` — UNIQUE on `code`
- `idx_notification_templates_type_channel` — on `(type, channel)`

---

#### 5.9.4 NotificationDelivery

**Purpose:** Delivery tracking per channel per notification.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| notification_id | UUID | FK → Notification, NOT NULL | Parent notification |
| channel | NotificationChannel enum | NOT NULL | IN_APP, EMAIL, SMS, PUSH |
| status | DeliveryStatus enum | NOT NULL, DEFAULT PENDING | PENDING, SENT, DELIVERED, FAILED, BOUNCED |
| recipient | VARCHAR(255) | NOT NULL | Delivery address (email, phone, device token) |
| sent_at | TIMESTAMPTZ | NULLABLE | When sent |
| delivered_at | TIMESTAMPTZ | NULLABLE | When delivered |
| failed_at | TIMESTAMPTZ | NULLABLE | When failed |
| failure_reason | VARCHAR(255) | NULLABLE | Reason for failure |
| retry_count | INTEGER | NOT NULL, DEFAULT 0 | Number of retries |
| provider | VARCHAR(50) | NULLABLE | Delivery provider (SendGrid, Twilio, etc.) |
| provider_message_id | VARCHAR(255) | NULLABLE | Provider's message ID |

**Relationships:**
- Many-to-one with Notification

**Indexes:**
- `idx_notification_deliveries_notification_id` — on `notification_id`
- `idx_notification_deliveries_status` — on `status` WHERE `status = 'PENDING'`

---

### 5.10 Administration Domain

---

#### 5.10.1 AdminUser

**Purpose:** Staff/administrator user account with elevated privileges.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, UNIQUE, NULLABLE | Linked regular user (optional) |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Admin email |
| first_name | VARCHAR(100) | NOT NULL | First name |
| last_name | VARCHAR(100) | NOT NULL | Last name |
| status | AdminStatus enum | NOT NULL, DEFAULT ACTIVE | ACTIVE, INACTIVE, SUSPENDED |
| last_login_at | TIMESTAMPTZ | NULLABLE | Last login |

**Relationships:**
- Many-to-one with User (nullable)
- Many-to-many with AdminRole (via AdminRole junction)
- One-to-many with AdminAction

**Indexes:**
- `idx_admin_users_email` — UNIQUE on `email`
- `idx_admin_users_status` — on `status`

---

#### 5.10.2 AdminRole

**Purpose:** Named roles for admin access control.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Role name |
| description | TEXT | NULLABLE | Role description |
| is_system | BOOLEAN | NOT NULL, DEFAULT FALSE | System role (cannot be deleted) |

**Relationships:**
- Many-to-many with AdminUser (via junction table)
- Many-to-many with AdminPermission (via AdminRolePermission)

---

#### 5.10.3 AdminPermission

**Purpose:** Granular permissions for admin actions.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| code | VARCHAR(100) | UNIQUE, NOT NULL | Permission code (e.g., accounts:freeze) |
| name | VARCHAR(255) | NOT NULL | Human-readable name |
| description | TEXT | NULLABLE | Description |
| resource | VARCHAR(50) | NOT NULL | Resource type (accounts, loans, users) |
| action | VARCHAR(50) | NOT NULL | Action (read, create, update, delete, approve, freeze) |

---

#### 5.10.4 AdminRolePermission

**Purpose:** Junction table mapping roles to permissions.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| role_id | UUID | FK → AdminRole, NOT NULL | The role |
| permission_id | UUID | FK → AdminPermission, NOT NULL | The permission |

**Unique Constraints:**
- `uq_admin_role_permissions` — UNIQUE on `(role_id, permission_id)`

---

#### 5.10.5 AdminAction

**Purpose:** Immutable log of every administrative action.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| admin_user_id | UUID | FK → AdminUser, NOT NULL | Admin who performed action |
| action | VARCHAR(100) | NOT NULL | Action performed |
| resource_type | VARCHAR(50) | NOT NULL | Resource type affected |
| resource_id | UUID | NOT NULL | ID of affected resource |
| details | JSONB | NULLABLE | Action details (before/after values) |
| ip_address | INET | NOT NULL | Admin's IP address |
| user_agent | TEXT | NOT NULL | Admin's user agent |

**Relationships:**
- Many-to-one with AdminUser

**Indexes:**
- `idx_admin_actions_admin_user_id` — on `admin_user_id`
- `idx_admin_actions_resource` — on `(resource_type, resource_id)`
- `idx_admin_actions_created_at` — on `created_at` DESC

---

### 5.11 Audit Domain

---

#### 5.11.1 AuditLog

**Purpose:** Immutable, comprehensive audit trail of all system events.

**Business Rules:**
- Records are append-only; never modified or deleted
- Retained for 7 years minimum (regulatory requirement)
- Partitioned by month for performance
- Used for compliance reporting and investigation

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| event_id | UUID | FK → AuditEvent, NOT NULL | Event type |
| user_id | UUID | FK → User, NULLABLE | User who triggered event |
| admin_user_id | UUID | FK → AdminUser, NULLABLE | Admin who triggered event |
| resource_type | VARCHAR(50) | NOT NULL | Resource type (user, account, transaction) |
| resource_id | UUID | NOT NULL | Resource ID |
| action | VARCHAR(100) | NOT NULL | Action performed |
| description | TEXT | NOT NULL | Human-readable description |
| old_values | JSONB | NULLABLE | Previous state |
| new_values | JSONB | NULLABLE | New state |
| ip_address | INET | NULLABLE | Client IP |
| user_agent | TEXT | NULLABLE | Client user agent |
| session_id | UUID | NULLABLE | Session ID |
| metadata | JSONB | NULLABLE | Additional context |
| severity | AuditSeverity enum | NOT NULL, DEFAULT INFO | INFO, WARNING, CRITICAL |

**Relationships:**
- Many-to-one with AuditEvent
- Many-to-one with User (nullable)
- Many-to-one with AdminUser (nullable)

**Indexes:**
- `idx_audit_logs_user_id` — on `user_id`
- `idx_audit_logs_resource` — on `(resource_type, resource_id)`
- `idx_audit_logs_event_id` — on `event_id`
- `idx_audit_logs_created_at` — on `created_at` DESC
- `idx_audit_logs_severity` — on `severity` WHERE `severity != 'INFO'`

---

#### 5.11.2 AuditEvent

**Purpose:** Catalog of all auditable event types.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| code | VARCHAR(100) | UNIQUE, NOT NULL | Event code (e.g., USER_CREATED) |
| name | VARCHAR(255) | NOT NULL | Human-readable name |
| category | VARCHAR(50) | NOT NULL | AUTH, ACCOUNT, TRANSACTION, TRANSFER, CARD, CRYPTO, LOAN, ADMIN, SECURITY, SYSTEM |
| description | TEXT | NULLABLE | Event description |
| severity | AuditSeverity enum | NOT NULL, DEFAULT INFO | Default severity |

---

#### 5.11.3 SecurityEvent

**Purpose:** Security-related events requiring investigation or response.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, NULLABLE | Affected user |
| type | SecurityEventType enum | NOT NULL | FAILED_LOGIN, BRUTE_FORCE, SUSPICIOUS_LOCATION, ACCOUNT_LOCKOUT, PASSWORD_BREACH, DEVICE_CHANGE, VELOCITY_CHECK, UNUSUAL_AMOUNT |
| severity | SecuritySeverity enum | NOT NULL | LOW, MEDIUM, HIGH, CRITICAL |
| description | TEXT | NOT NULL | Event description |
| ip_address | INET | NULLABLE | Client IP |
| user_agent | TEXT | NULLABLE | Client user agent |
| location | JSONB | NULLABLE | GeoIP location |
| device_info | JSONB | NULLABLE | Device fingerprint info |
| status | SecurityEventStatus enum | NOT NULL, DEFAULT OPEN | OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE |
| resolved_by | UUID | FK → User, NULLABLE | Admin who resolved |
| resolved_at | TIMESTAMPTZ | NULLABLE | When resolved |
| resolution_notes | TEXT | NULLABLE | Resolution notes |

**Relationships:**
- Many-to-one with User (nullable)

**Indexes:**
- `idx_security_events_user_id` — on `user_id`
- `idx_security_events_type` — on `type`
- `idx_security_events_status` — on `status` WHERE `status = 'OPEN'`
- `idx_security_events_severity` — on `severity`
- `idx_security_events_created_at` — on `created_at` DESC

---

### 5.12 Settings Domain

---

#### 5.12.1 UserPreference

**Purpose:** User-specific UI and application preferences.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → User, UNIQUE, NOT NULL | Owner |
| theme | VARCHAR(10) | NOT NULL, DEFAULT 'system' | light, dark, system |
| locale | VARCHAR(10) | NOT NULL, DEFAULT 'en-US' | Preferred locale |
| timezone | VARCHAR(50) | NOT NULL, DEFAULT 'America/New_York' | Preferred timezone |
| currency_display | VARCHAR(3) | NOT NULL, DEFAULT 'USD' | Display currency |
| date_format | VARCHAR(20) | NOT NULL, DEFAULT 'MM/DD/YYYY' | Date format preference |
| dashboard_layout | JSONB | NULLABLE | Dashboard widget layout |
| default_account_id | UUID | FK → BankAccount, NULLABLE | Default account for display |

**Relationships:**
- One-to-one with User

**Indexes:**
- `idx_user_preferences_user_id` — UNIQUE on `user_id`

---

#### 5.12.2 SystemSetting

**Purpose:** Global system configuration key-value pairs.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| key | VARCHAR(100) | UNIQUE, NOT NULL | Setting key |
| value | TEXT | NOT NULL | Setting value |
| type | SettingType enum | NOT NULL | STRING, INTEGER, BOOLEAN, JSON, DECIMAL |
| description | TEXT | NOT NULL | Setting description |
| is_public | BOOLEAN | NOT NULL, DEFAULT FALSE | Exposed to frontend |
| is_encrypted | BOOLEAN | NOT NULL, DEFAULT FALSE | Value is encrypted |
| category | VARCHAR(50) | NOT NULL | Setting category |

**Indexes:**
- `idx_system_settings_key` — UNIQUE on `key`
- `idx_system_settings_category` — on `category`

---

#### 5.12.3 FeatureFlag

**Purpose:** Feature toggles for gradual rollout and A/B testing.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| key | VARCHAR(100) | UNIQUE, NOT NULL | Flag key |
| name | VARCHAR(255) | NOT NULL | Human-readable name |
| description | TEXT | NULLABLE | Flag description |
| is_enabled | BOOLEAN | NOT NULL, DEFAULT FALSE | Global enable/disable |
| enabled_for_percentage | INTEGER | NOT NULL, DEFAULT 0 | Percentage rollout (0-100) |
| enabled_for_user_ids | UUID[] | NULLABLE | Specific user IDs |
| enabled_for_roles | TEXT[] | NULLABLE | Specific roles |
| starts_at | TIMESTAMPTZ | NULLABLE | Rollout start time |
| ends_at | TIMESTAMPTZ | NULLABLE | Rollout end time |
| metadata | JSONB | NULLABLE | A/B test config |

**Indexes:**
- `idx_feature_flags_key` — UNIQUE on `key`

---

#### 5.12.4 DemoScenario

**Purpose:** Predefined demo scenarios for the Atlas showcase/demo mode.

**Required Fields:**
| Field | Type | Constraints | Description |
|-------|------|------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(100) | UNIQUE, NOT NULL | Scenario name |
| description | TEXT | NOT NULL | Scenario description |
| type | DemoScenarioType enum | NOT NULL | FULL_ONBOARDING, TRANSACTION_HISTORY, CRYPTO_DEPOSIT, LOAN_APPLICATION, CARD_ACTIVATION |
| seed_data | JSONB | NOT NULL | Data configuration for the scenario |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether scenario is available |
| duration_minutes | INTEGER | NULLABLE | Estimated demo duration |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | Display order |

---

## 6. Enumerations

### 6.1 User Enums

#### UserStatus
| Value | Description |
|-------|-------------|
| PENDING | Registered, awaiting email verification |
| ACTIVE | Fully active account |
| VERIFIED | KYC verified |
| LOCKED | Temporarily locked (security) |
| SUSPENDED | Suspended by admin |
| CLOSED | Permanently closed |

#### KycStatus
| Value | Description |
|-------|-------------|
| PENDING | Not yet submitted |
| SUBMITTED | Documents submitted, under review |
| UNDER_REVIEW | Being reviewed by compliance |
| APPROVED | KYC approved |
| REJECTED | KYC rejected |
| EXPIRED | KYC expired, needs renewal |

### 6.2 Account Enums

#### AccountType
| Value | Description |
|-------|-------------|
| CHECKING | Standard checking account |
| SAVINGS | Interest-bearing savings account |

#### AccountStatus
| Value | Description |
|-------|-------------|
| PENDING | Application submitted |
| ACTIVE | Operational |
| RESTRICTED | Limited functionality |
| FROZEN | All transactions blocked |
| CLOSED | Permanently closed |
| DORMANT | No activity for 12+ months |

#### AccountHolderRole
| Value | Description |
|-------|-------------|
| PRIMARY | Primary account holder |
| JOINT | Joint account holder |
| AUTHORIZED_SIGNER | Authorized to transact |

#### AlertType
| Value | Description |
|-------|-------------|
| LOW_BALANCE | Balance below threshold |
| LARGE_TRANSACTION | Transaction above threshold |
| DEPOSIT | Deposit received |
| WITHDRAWAL | Withdrawal made |
| BALANCE_UPDATE | Daily balance update |

#### HoldReason
| Value | Description |
|-------|-------------|
| PENDING_TRANSACTION | Pending transaction hold |
| DISPUTE | Disputed transaction |
| COMPLIANCE | Regulatory compliance hold |
| CARD_AUTH | Card authorization hold |

#### HoldStatus
| Value | Description |
|-------|-------------|
| ACTIVE | Hold is active |
| SETTLED | Hold settled as debit |
| RELEASED | Hold released, funds returned |
| EXPIRED | Hold expired automatically |

### 6.3 Transaction Enums

#### TransactionType
| Value | Description |
|-------|-------------|
| DEBIT | Money out |
| CREDIT | Money in |
| TRANSFER | Account-to-account transfer |
| FEE | Service fee |
| INTEREST | Interest earned/charged |
| ADJUSTMENT | Manual adjustment |
| REVERSAL | Transaction reversal |

#### TransactionStatus
| Value | Description |
|-------|-------------|
| PENDING | Awaiting processing |
| PROCESSING | Being processed |
| COMPLETED | Successfully completed |
| FAILED | Failed |
| REVERSED | Reversed |
| RETURNED | Returned (ACH) |

#### Direction
| Value | Description |
|-------|-------------|
| DEBIT | Debit side of ledger |
| CREDIT | Credit side of ledger |

#### PendingTransactionStatus
| Value | Description |
|-------|-------------|
| PENDING | Awaiting settlement |
| SETTLED | Settled |
| EXPIRED | Authorization expired |
| VOIDED | Voided before settlement |

### 6.4 Transfer Enums

#### TransferType
| Value | Description |
|-------|-------------|
| INTERNAL | Between Atlas accounts |
| ACH_CREDIT | ACH push to external |
| ACH_DEBIT | ACH pull from external |
| WIRE_DOMESTIC | Domestic wire transfer |
| WIRE_INTERNATIONAL | International wire transfer |
| ZELLE | Zelle transfer |

#### TransferStatus
| Value | Description |
|-------|-------------|
| PENDING | Created, awaiting processing |
| SCHEDULED | Scheduled for future |
| PROCESSING | Being processed |
| COMPLETED | Successfully completed |
| FAILED | Transfer failed |
| CANCELLED | Cancelled by user |
| RETURNED | Returned by receiving bank |

#### ScheduleFrequency
| Value | Description |
|-------|-------------|
| DAILY | Every day |
| WEEKLY | Every week |
| BIWEEKLY | Every two weeks |
| MONTHLY | Every month |
| QUARTERLY | Every quarter |

#### ScheduleStatus
| Value | Description |
|-------|-------------|
| ACTIVE | Actively scheduling |
| PAUSED | Temporarily paused |
| CANCELLED | Cancelled |
| COMPLETED | All executions done |

#### VerificationStatus
| Value | Description |
|-------|-------------|
| PENDING | Awaiting verification |
| VERIFIED | Verified and usable |
| FAILED | Verification failed |

#### VerificationMethod
| Value | Description |
|-------|-------------|
| PLAID | Verified via Plaid |
| MICRO_DEPOSIT | Verified via micro-deposits |

### 6.5 Card Enums

#### CardType
| Value | Description |
|-------|-------------|
| PHYSICAL | Physical debit card |
| VIRTUAL | Virtual card number |

#### CardBrand
| Value | Description |
|-------|-------------|
| VISA | Visa network |
| MASTERCARD | Mastercard network |

#### CardStatus
| Value | Description |
|-------|-------------|
| ISSUED | Created, awaiting activation |
| ACTIVATED | Activated by user |
| ACTIVE | Fully operational |
| FROZEN | Temporarily frozen |
| CLOSED | Permanently closed |

#### CardTransactionType
| Value | Description |
|-------|-------------|
| PURCHASE | Point-of-sale or online purchase |
| ATM_WITHDRAWAL | ATM cash withdrawal |
| REFUND | Merchant refund |
| CASHBACK | Cashback at checkout |

#### CardTransactionStatus
| Value | Description |
|-------|-------------|
| AUTHORIZED | Pre-authorized |
| SETTLED | Finalized |
| DECLINED | Declined |
| REVERSED | Authorization reversed |
| REFUNDED | Refunded |

### 6.6 Crypto Enums

#### WalletStatus
| Value | Description |
|-------|-------------|
| ACTIVE | Active and receiving |
| FROZEN | Frozen by admin |
| CLOSED | Permanently closed |

#### CryptoDepositStatus
| Value | Description |
|-------|-------------|
| PENDING | Detected, awaiting confirmations |
| CONFIRMED | Required confirmations reached |
| CREDITED | Credited to user account |
| FAILED | Deposit failed |

#### CryptoWithdrawalStatus
| Value | Description |
|-------|-------------|
| PENDING | Awaiting review |
| APPROVED | Approved |
| PROCESSING | Sent to blockchain |
| COMPLETED | Confirmed on-chain |
| FAILED | Withdrawal failed |
| CANCELLED | Cancelled |

#### CryptoTxType
| Value | Description |
|-------|-------------|
| DEPOSIT | Incoming transaction |
| WITHDRAWAL | Outgoing transaction |
| INTERNAL | Internal transfer |

#### CryptoTxStatus
| Value | Description |
|-------|-------------|
| PENDING | Awaiting confirmations |
| CONFIRMED | Confirmed on-chain |
| FAILED | Transaction failed |

### 6.7 Investment Enums

#### InvestmentAccountStatus
| Value | Description |
|-------|-------------|
| ACTIVE | Operational |
| SUSPENDED | Suspended |
| CLOSED | Closed |

#### InvestmentTxType
| Value | Description |
|-------|-------------|
| BUY | Buy order |
| SELL | Sell order |
| DIVIDEND | Dividend payment |
| SPLIT | Stock split |
| TRANSFER_IN | Transfer in |
| TRANSFER_OUT | Transfer out |

#### InvestmentTxStatus
| Value | Description |
|-------|-------------|
| PENDING | Awaiting execution |
| EXECUTED | Trade executed |
| SETTLED | Trade settled (T+1 or T+2) |
| CANCELLED | Order cancelled |

#### InvestmentAssetType
| Value | Description |
|-------|-------------|
| STOCK | Common stock |
| ETF | Exchange-traded fund |
| MUTUAL_FUND | Mutual fund |
| BOND | Bond |
| CRYPTO | Cryptocurrency |

#### RiskProfile
| Value | Description |
|-------|-------------|
| CONSERVATIVE | Low risk tolerance |
| MODERATE | Medium risk tolerance |
| AGGRESSIVE | High risk tolerance |

### 6.8 Loan Enums

#### LoanType
| Value | Description |
|-------|-------------|
| PERSONAL | Fixed-term personal loan |
| LINE_OF_CREDIT | Revolving credit line |

#### LoanStatus
| Value | Description |
|-------|-------------|
| ACTIVE | Active with remaining balance |
| PAID_OFF | Fully paid |
| DEFAULTED | 90+ days past due |
| CHARGED_OFF | Written off |
| IN_COLLECTIONS | In collections |

#### PaymentStatus
| Value | Description |
|-------|-------------|
| PENDING | Awaiting processing |
| COMPLETED | Successfully processed |
| FAILED | Payment failed |
| LATE | Paid after due date |

#### LoanApplicationStatus
| Value | Description |
|-------|-------------|
| SUBMITTED | Application submitted |
| UNDER_REVIEW | Being reviewed |
| APPROVED | Approved |
| DENIED | Denied |
| WITHDRAWN | Withdrawn by applicant |

#### EmploymentStatus
| Value | Description |
|-------|-------------|
| FULL_TIME | Full-time employed |
| PART_TIME | Part-time employed |
| SELF_EMPLOYED | Self-employed |
| RETIRED | Retired |
| OTHER | Other |

#### DocumentType
| Value | Description |
|-------|-------------|
| ID_VERIFICATION | Government-issued ID |
| INCOME_PROOF | Pay stubs, W-2 |
| EMPLOYMENT_VERIFICATION | Employment letter |
| TAX_RETURN | Tax return |
| BANK_STATEMENT | Bank statement |
| OTHER | Other documentation |

#### DocumentStatus
| Value | Description |
|-------|-------------|
| UPLOADED | Uploaded by user |
| REVIEWED | Reviewed by admin |
| APPROVED | Approved |
| REJECTED | Rejected |

### 6.9 Notification Enums

#### NotificationType
| Value | Description |
|-------|-------------|
| TRANSACTION | Transaction-related |
| SECURITY | Security alerts |
| ACCOUNT | Account updates |
| TRANSFER | Transfer updates |
| CARD | Card activity |
| CRYPTO | Crypto activity |
| LOAN | Loan updates |
| SYSTEM | System announcements |
| MARKETING | Marketing/promotional |

#### NotificationPriority
| Value | Description |
|-------|-------------|
| LOW | Low priority |
| NORMAL | Normal priority |
| HIGH | High priority |
| URGENT | Requires immediate attention |

#### NotificationChannel
| Value | Description |
|-------|-------------|
| IN_APP | In-app notification |
| EMAIL | Email |
| SMS | SMS text |
| PUSH | Mobile push notification |

#### DeliveryStatus
| Value | Description |
|-------|-------------|
| PENDING | Awaiting delivery |
| SENT | Sent to provider |
| DELIVERED | Confirmed delivered |
| FAILED | Delivery failed |
| BOUNCED | Bounced (email) |

### 6.10 Administration Enums

#### AdminStatus
| Value | Description |
|-------|-------------|
| ACTIVE | Active admin |
| INACTIVE | Deactivated |
| SUSPENDED | Suspended |

### 6.11 Audit Enums

#### AuditSeverity
| Value | Description |
|-------|-------------|
| INFO | Informational |
| WARNING | Warning |
| CRITICAL | Critical |

#### SecurityEventType
| Value | Description |
|-------|-------------|
| FAILED_LOGIN | Failed login attempt |
| BRUTE_FORCE | Suspected brute force |
| SUSPICIOUS_LOCATION | Login from unusual location |
| ACCOUNT_LOCKOUT | Account locked |
| PASSWORD_BREACH | Password found in breach database |
| DEVICE_CHANGE | New device detected |
| VELOCITY_CHECK | Too many transactions too fast |
| UNUSUAL_AMOUNT | Unusual transaction amount |

#### SecuritySeverity
| Value | Description |
|-------|-------------|
| LOW | Low risk |
| MEDIUM | Medium risk |
| HIGH | High risk |
| CRITICAL | Critical — immediate action required |

#### SecurityEventStatus
| Value | Description |
|-------|-------------|
| OPEN | New event, not yet reviewed |
| INVESTIGATING | Being investigated |
| RESOLVED | Resolved |
| FALSE_POSITIVE | Determined to be false positive |

### 6.12 Settings Enums

#### SettingType
| Value | Description |
|-------|-------------|
| STRING | String value |
| INTEGER | Integer value |
| BOOLEAN | Boolean value |
| JSON | JSON object |
| DECIMAL | Decimal value |

#### DemoScenarioType
| Value | Description |
|-------|-------------|
| FULL_ONBOARDING | Complete user onboarding flow |
| TRANSACTION_HISTORY | 90 days of transaction history |
| CRYPTO_DEPOSIT | Crypto deposit and conversion |
| LOAN_APPLICATION | Loan application and approval |
| CARD_ACTIVATION | Card issuance and activation |

---

## 7. Banking Rules

### 7.1 Checking Accounts

- **Opening Requirements:** Valid US identity, 18+ years old, US address, valid email and phone
- **Minimum Balance:** $0 (no minimum balance requirement)
- **Monthly Fee:** $0 (fee-free checking)
- **Interest:** None on checking accounts
- **Overdraft Protection:** Opt-in, $50-$500 overdraft limit based on account history
- **Overdraft Fee:** $0 (no overdraft fees — competitive advantage)
- **Daily Transaction Limit:** Unlimited transactions
- **ATM Access:** Free at in-network ATMs; $2.50 out-of-network fee
- **Statement:** Monthly electronic statements; paper statements available for $3/month

### 7.2 Savings Accounts

- **Opening Requirements:** Same as checking; may require linked checking account
- **Minimum Balance:** $0 (no minimum)
- **Interest Rate:** Variable, currently 4.00% APY (competitive rate)
- **Interest Calculation:** Daily balance method, compounded monthly
- **Interest Posting:** Last business day of each month
- **Withdrawal Limit:** 6 free withdrawals per month (Regulation D); $5 per excess withdrawal
- **Monthly Fee:** None
- **Goal-Based Savings:** Users can create savings "buckets" (virtual sub-accounts)

### 7.3 ACH (Automated Clearing House)

- **Processing Window:** Files submitted at 4:00 PM ET; processed next business day
- **Same-Day ACH:** Available for transfers under $100,000; $5 fee
- **ACH Credit (Push):** Send money to external account; 1-3 business days
- **ACH Debit (Pull):** Pull money from external account; 3-5 business days for first pull
- **Daily Limit:** $25,000 for standard; $100,000 for same-day
- **Monthly Limit:** $100,000
- **Return Window:** 2 business days for most returns; 60 days for unauthorized debits
- **NOC (Notification of Change):** Processed automatically; user notified of updated account info

### 7.4 Domestic Wire Transfer

- **Cut-off Time:** 4:00 PM ET for same-day processing
- **Processing Time:** Same business day (if submitted before cut-off)
- **Fee:** $25 per wire
- **Daily Limit:** $100,000
- **Minimum Amount:** $100
- **Required Information:** Beneficiary name, bank name, routing number, account number
- **Fedwire Reference:** Tracked for every domestic wire
- **Irrevocable:** Domestic wires cannot be recalled once processed

### 7.5 International Wire Transfer

- **Cut-off Time:** 2:00 PM ET for same-day processing
- **Processing Time:** 1-5 business days depending on destination
- **Fee:** $45 per wire
- **Daily Limit:** $50,000
- **Minimum Amount:** $100
- **Required Information:** Beneficiary name, bank name, SWIFT/BIC code, IBAN or account number, bank address, intermediary bank (if required)
- **Currency Conversion:** Applied at market rate + 1% FX margin
- **SWIFT Network:** All international wires routed through SWIFT
- **Compliance:** Enhanced due diligence for wires to sanctioned countries

### 7.6 SWIFT

- **SWIFT/BIC Code:** Atlas partner bank SWIFT code used for all international transfers
- **Message Types:** MT103 (customer transfer), MT202 (bank-to-bank), MT940 (statement)
- **Correspondent Banking:** Atlas uses a Tier 1 US bank as correspondent
- **SWIFT gpi:** Supported for tracking international transfers end-to-end
- **Compliance:** All SWIFT messages screened against OFAC SDN list
- **BIC Directory:** Maintained and updated monthly

### 7.7 Card Purchases

- **Authorization:** Real-time authorization via Visa/Mastercard network
- **Authorization Hold:** Up to 7 days for pending settlement
- **Settlement:** Typically 1-3 business days after authorization
- **Decline Reasons:** Insufficient funds, card frozen, merchant blocked, limit exceeded, suspicious activity
- **Currency Conversion:** Applied at network rate + 1% for international purchases
- **Contactless Limit:** $200 per transaction (configurable)
- **Online Purchases:** 3D Secure (3DS) authentication required for high-risk transactions
- **Recurring Payments:** Stored credential indicator required for recurring transactions
- **Refunds:** Processed within 3-5 business days of merchant submission

### 7.8 ATM Withdrawals

- **In-Network:** Free withdrawals at Atlas partner ATM network
- **Out-of-Network:** $2.50 fee from Atlas + potential operator fee
- **Daily Limit:** $1,000 default (user-adjustable up to $2,500)
- **Per-Transaction Limit:** $500 maximum per single withdrawal
- **International ATM:** $5 fee + 1% conversion fee
- **ATM Balance Inquiry:** Free at in-network; $0.50 at out-of-network
- **Deposit ATMs:** Not supported in MVP (future: mobile check deposit instead)

### 7.9 Mobile Check Deposits

- **Availability:** Future feature (not in MVP)
- **Daily Limit:** $5,000 per day
- **Per-Check Limit:** $2,500
- **Monthly Limit:** $10,000
- **Hold Period:** First $225 available next business day; remainder held 2-5 business days
- **Requirements:** Check must be endorsed with "For Mobile Deposit Only at Atlas"
- **Check Types:** Personal checks, government checks, cashier's checks, business checks
- **Excluded:** Third-party checks, foreign checks, stale-dated checks (>6 months old)
- **Image Requirements:** Front and back images, clear and legible

### 7.10 Payroll Deposits

- **Direct Deposit:** Supported via ACH credit
- **Early Direct Deposit:** Funds available up to 2 days early (upon receiving ACH notification)
- **Routing/Account Info:** Available in app for employer setup
- **Split Deposit:** Users can split direct deposit across multiple accounts
- **Payroll Partners:** Compatible with ADP, Gusto, Paychex, and all major payroll providers
- **Government Deposits:** Social Security, VA benefits, tax refunds supported

### 7.11 Beneficiaries

- **Internal Beneficiaries:** Other Atlas users identified by email or phone
- **External Beneficiaries:** Saved external bank accounts (verified)
- **International Beneficiaries:** Saved with SWIFT/BIC and account details
- **Zelle Beneficiaries:** Saved by email or phone
- **Maximum Saved:** 20 beneficiaries per user
- **Verification:** Beneficiary name validated against account holder name

### 7.12 Statements

- **Frequency:** Monthly (1st of each month for previous month)
- **Format:** PDF (primary), CSV (exportable)
- **Availability:** Last 7 years accessible in app
- **Content:** Opening balance, all transactions, closing balance, interest earned, fees charged
- **Paper Statements:** Optional for $3/month
- **Tax Documents:** 1099-INT for interest earned > $10; 1099-MISC for other income
- **Real-Time Balance:** Available in app, updated within seconds of transaction

### 7.13 Ledger Behavior

- **Double-Entry System:** Every transaction creates exactly 2 TransactionLine records
- **Balance Invariant:** SUM(all credits) = SUM(all debits) across the entire ledger
- **Account Invariant:** For each account, balance = SUM(credits) - SUM(debits)
- **Immutability:** TransactionLine records are never modified after creation
- **Correction:** Errors are corrected via ADJUSTMENT or REVERSAL transactions (new records)
- **Consistency:** All balance changes are atomic within a database transaction
- **Concurrency:** Balance updates use optimistic locking (version field) to prevent race conditions

### 7.14 Available Balance vs Current Balance

- **Current Balance:** The actual funds in the account, including all settled transactions
- **Available Balance:** Current Balance - Holds = funds available for new transactions
- **Formula:** `available_balance = current_balance - hold_amount`
- **Overdraft:** If overdraft protection is enabled, available_balance can go negative up to `-overdraft_limit`
- **Pending Credits:** Incoming transfers (ACH credit, deposits) are shown as pending_credits but do not affect current_balance until settled
- **Display:** Both balances shown in the app; available balance is the primary display

### 7.15 Pending Transactions

- **Card Authorizations:** Shown immediately in the app with "Pending" badge
- **Hold on Funds:** Pending transactions create a BalanceHold that reduces available_balance
- **Expiration:** Pending transactions expire after 7 days if not settled
- **Settlement:** When the merchant submits the final transaction, the pending transaction is settled and a permanent Transaction is created
- **Partial Settlements:** Supported (e.g., hotel authorization for $500, settlement for $350)
- **Multiple Settlements:** Supported for split shipments

### 7.16 Settlement

- **Card Settlement:** T+1 to T+3 (merchant-dependent)
- **ACH Settlement:** T+1 to T+3
- **Wire Settlement:** Same-day (domestic), T+1 to T+5 (international)
- **Internal Transfers:** Instant settlement
- **Crypto Settlement:** Based on blockchain confirmation time (varies by network)
- **Interest Settlement:** Calculated daily, posted monthly
- **Fee Settlement:** Debited immediately at time of fee event

### 7.17 Hold Amounts

- **Card Auth Holds:** Created on authorization, amount = authorized amount
- **Dispute Holds:** Created when a transaction is disputed, amount = disputed amount
- **Compliance Holds:** Created by admin for regulatory reasons, amount = specified by admin
- **Hold Expiration:** Card auth: 7 days, Dispute: 45 days, Compliance: 30 days (renewable)
- **Hold Release:** Automatic on expiration, or manual by admin/system on settlement
- **Impact on Balance:** Hold reduces available_balance but does not affect current_balance

---

## 8. Crypto Rules

### 8.1 Supported Assets and Networks

| Asset | Symbol | Network | Network Type | Confirmations Required | Min Deposit | Min Withdrawal | Withdrawal Fee |
|-------|--------|---------|-------------|----------------------|-------------|---------------|---------------|
| Bitcoin | BTC | Bitcoin | Native | 3 | 0.0001 BTC | 0.001 BTC | 0.0005 BTC |
| Ethereum | ETH | Ethereum (ERC-20) | Native | 12 | 0.001 ETH | 0.01 ETH | 0.005 ETH |
| Tether | USDT | Ethereum (ERC-20) | Token | 12 | 10 USDT | 50 USDT | 10 USDT |
| Tether | USDT | Tron (TRC-20) | Token | 20 | 10 USDT | 50 USDT | 1 USDT |
| USD Coin | USDC | Ethereum (ERC-20) | Token | 12 | 10 USDC | 50 USDC | 10 USDC |
| BNB | BNB | BNB Smart Chain (BEP-20) | Native | 15 | 0.01 BNB | 0.1 BNB | 0.005 BNB |
| Solana | SOL | Solana | Native | 1 | 0.01 SOL | 0.1 SOL | 0.01 SOL |

### 8.2 Wallet Address Rules

- Each user gets a unique deposit address per asset-network combination
- Addresses are generated by Atlas's custodial wallet provider
- Bitcoin addresses use SegWit format (bc1q...)
- Ethereum addresses use standard 0x format
- Tron addresses use T format
- Solana addresses use base58 format
- Addresses are verified on-chain before being presented to users
- Address reuse is permitted but not recommended (new addresses generated on request)

### 8.3 Network-Specific Rules

#### Bitcoin
- Native SegWit (bech32) addresses preferred
- 3 confirmations required (~30 minutes average)
- Transaction fees are dynamic, based on mempool congestion
- Replace-by-fee (RBF) supported for pending outgoing transactions

#### Ethereum (ERC-20)
- Standard Ethereum addresses for ETH and all ERC-20 tokens
- 12 confirmations required (~3 minutes average)
- Gas fees estimated at time of withdrawal and locked for 60 seconds
- EIP-1559 fee structure supported

#### Tron (TRC-20)
- Tron addresses for USDT TRC-20
- 20 confirmations required (~1 minute average)
- Energy and bandwidth model for transaction fees
- Significantly lower fees than ERC-20

#### BNB Smart Chain (BEP-20)
- Same address format as Ethereum (0x)
- 15 confirmations required (~45 seconds average)
- BNB used for gas fees

#### Solana
- Base58 encoded addresses
- 1 confirmation required (~400ms average)
- Very low transaction fees
- SPL token standard for tokens

### 8.4 Deposit Rules

- Deposits detected via blockchain monitoring service (polling every 30 seconds for BTC, 12 seconds for ETH)
- Minimum deposit amounts enforced; deposits below minimum are ignored
- Deposits flagged if from known sanctioned addresses (OFAC compliance)
- Deposits from mixing services or suspicious sources flagged for review
- USD value calculated at the time of confirmation (not detection)
- A Transaction record (CREDIT) created in the user's linked bank account upon crediting
- Deposits appear as "Pending" in the app while awaiting confirmations
- Users notified via push notification when deposit is detected and when credited

### 8.5 Withdrawal Rules

- Minimum and maximum withdrawal amounts per asset
- User must have sufficient USD balance (converted at current market rate)
- AML screening performed before processing
- Withdrawals over $10,000 require additional verification
- Hot wallet balance checked before processing; insufficient hot wallet triggers cold storage withdrawal
- Transaction hash provided immediately after broadcast
- Users notified on broadcast and on confirmation
- Failed withdrawals automatically reverse the USD debit

### 8.6 Price and Valuation

- Prices fetched from CoinGecko API every 60 seconds
- Prices cached in the CryptoPrice table
- USD conversion at time of transaction uses the cached price (within 60 seconds)
- Portfolio value recalculated on each price update
- Historical prices stored for tax reporting
- Price displayed to 2 decimal places for USD values

### 8.7 Security and Compliance

- OFAC SDN list checked for all deposit and withdrawal addresses
- Chainalysis or similar service integrated for on-chain risk scoring
- Suspicious transactions flagged and queued for manual review
- Cold storage for 95%+ of custodial funds
- Multi-signature wallets for hot wallet operations
- Withdrawal whitelist feature (users can pre-approve withdrawal addresses)
- 24-hour withdrawal lock on newly added addresses

---

## 9. Audit Rules

### 9.1 Auditable Events

The following events MUST be logged in the AuditLog:

#### Authentication Events
| Event Code | Description | Severity |
|-----------|-------------|----------|
| USER_REGISTERED | New user registration | INFO |
| USER_LOGIN_SUCCESS | Successful login | INFO |
| USER_LOGIN_FAILED | Failed login attempt | WARNING |
| USER_LOGOUT | User logged out | INFO |
| USER_PASSWORD_CHANGED | Password was changed | WARNING |
| USER_PASSWORD_RESET_REQUESTED | Password reset requested | WARNING |
| USER_PASSWORD_RESET_COMPLETED | Password reset completed | WARNING |
| USER_MFA_ENABLED | MFA was enabled | WARNING |
| USER_MFA_DISABLED | MFA was disabled | CRITICAL |
| USER_MFA_FAILED | MFA verification failed | WARNING |
| USER_ACCOUNT_LOCKED | Account was locked | CRITICAL |
| USER_ACCOUNT_UNLOCKED | Account was unlocked | WARNING |
| USER_EMAIL_CHANGED | Email address changed | WARNING |
| USER_PHONE_CHANGED | Phone number changed | WARNING |

#### Account Events
| Event Code | Description | Severity |
|-----------|-------------|----------|
| ACCOUNT_CREATED | New bank account opened | INFO |
| ACCOUNT_STATUS_CHANGED | Account status changed | WARNING |
| ACCOUNT_FROZEN | Account frozen | CRITICAL |
| ACCOUNT_UNFROZEN | Account unfrozen | WARNING |
| ACCOUNT_CLOSED | Account closed | WARNING |
| ACCOUNT_DORMANCY_FLAGGED | Account flagged as dormant | WARNING |
| BALANCE_HOLD_CREATED | Hold placed on funds | WARNING |
| BALANCE_HOLD_RELEASED | Hold released | INFO |
| ACCOUNT_STATEMENT_GENERATED | Monthly statement generated | INFO |
| ACCOUNT_ALERT_TRIGGERED | Account alert triggered | INFO |

#### Transaction Events
| Event Code | Description | Severity |
|-----------|-------------|----------|
| TRANSACTION_CREATED | New transaction initiated | INFO |
| TRANSACTION_COMPLETED | Transaction completed | INFO |
| TRANSACTION_FAILED | Transaction failed | WARNING |
| TRANSACTION_REVERSED | Transaction reversed | CRITICAL |
| TRANSACTION_RETURNED | ACH/wire returned | WARNING |
| TRANSACTION_CATEGORIZED | Transaction category changed | INFO |
| LARGE_TRANSACTION | Transaction above $10,000 | WARNING |

#### Transfer Events
| Event Code | Description | Severity |
|-----------|-------------|----------|
| TRANSFER_CREATED | Transfer initiated | INFO |
| TRANSFER_COMPLETED | Transfer completed | INFO |
| TRANSFER_FAILED | Transfer failed | WARNING |
| TRANSFER_CANCELLED | Transfer cancelled | INFO |
| TRANSFER_RETURNED | Transfer returned | WARNING |
| CTR_FILLED | Currency Transaction Report filed | CRITICAL |
| SAR_FILED | Suspicious Activity Report filed | CRITICAL |
| EXTERNAL_ACCOUNT_LINKED | External account linked | WARNING |
| EXTERNAL_ACCOUNT_VERIFIED | External account verified | WARNING |

#### Card Events
| Event Code | Description | Severity |
|-----------|-------------|----------|
| CARD_ISSUED | New card issued | INFO |
| CARD_ACTIVATED | Card activated | INFO |
| CARD_FROZEN | Card frozen | WARNING |
| CARD_UNFROZEN | Card unfrozen | WARNING |
| CARD_CLOSED | Card closed | WARNING |
| CARD_REPLACED | Card replaced | WARNING |
| CARD_PIN_CHANGED | PIN changed | WARNING |
| CARD_LIMIT_CHANGED | Spending limit changed | WARNING |
| CARD_CONTROL_CHANGED | Card control setting changed | WARNING |
| CARD_DECLINED | Card transaction declined | WARNING |
| CARD_FRAUD_FLAGGED | Potential fraud detected | CRITICAL |

#### Crypto Events
| Event Code | Description | Severity |
|-----------|-------------|----------|
| CRYPTO_WALLET_CREATED | New wallet address generated | INFO |
| CRYPTO_DEPOSIT_DETECTED | Deposit detected on-chain | INFO |
| CRYPTO_DEPOSIT_CONFIRMED | Deposit confirmed | INFO |
| CRYPTO_DEPOSIT_CREDITED | USD value credited | INFO |
| CRYPTO_WITHDRAWAL_REQUESTED | Withdrawal requested | WARNING |
| CRYPTO_WITHDRAWAL_APPROVED | Withdrawal approved | WARNING |
| CRYPTO_WITHDRAWAL_COMPLETED | Withdrawal confirmed on-chain | INFO |
| CRYPTO_WITHDRAWAL_FAILED | Withdrawal failed | WARNING |
| CRYPTO_SUSPICIOUS_ADDRESS | Suspicious address detected | CRITICAL |

#### Loan Events
| Event Code | Description | Severity |
|-----------|-------------|----------|
| LOAN_APPLICATION_SUBMITTED | Application submitted | INFO |
| LOAN_APPLICATION_APPROVED | Application approved | INFO |
| LOAN_APPLICATION_DENIED | Application denied | INFO |
| LOAN_DISBURSED | Loan funds disbursed | INFO |
| LOAN_PAYMENT_RECEIVED | Payment received | INFO |
| LOAN_PAYMENT_MISSED | Payment missed | WARNING |
| LOAN_DEFAULTED | Loan defaulted | CRITICAL |
| LOAN_PAID_OFF | Loan fully paid | INFO |

#### Admin Events
| Event Code | Description | Severity |
|-----------|-------------|----------|
| ADMIN_LOGIN | Admin logged in | WARNING |
| ADMIN_ACTION_PERFORMED | Any admin action | WARNING |
| ADMIN_USER_CREATED | New admin user created | WARNING |
| ADMIN_ROLE_ASSIGNED | Role assigned to admin | WARNING |
| ADMIN_PERMISSION_CHANGED | Permission modified | CRITICAL |

### 9.2 Balance Change Audit

Every balance change MUST be audited with:
- **Before value:** Balance before the change
- **After value:** Balance after the change
- **Change amount:** The delta
- **Cause:** Transaction ID or other reference
- **Timestamp:** Exact time of change
- **Initiator:** User ID, admin ID, or SYSTEM

### 9.3 Data Change Audit

Changes to sensitive data fields MUST be audited:
- Email address changes
- Phone number changes
- Password changes
- Address changes
- Status changes (account, user, card, loan)
- Limit changes (card, transfer)
- Preference changes (security-related)

Each audit entry includes the old value and new value in JSONB fields.

### 9.4 Retention Policy

- **AuditLog:** 7 years minimum (regulatory requirement for financial records)
- **SecurityEvent:** 3 years minimum
- **AdminAction:** 7 years minimum
- **LoginAttempt:** 2 years minimum
- **Archived audit data:** Moved to cold storage after 2 years; accessible within 24 hours on request

### 9.5 Access Control

- Audit logs are read-only for all users including admins
- Only the system (automated processes) can write to audit logs
- Admin users with `audit:read` permission can query audit logs
- Compliance officers have unrestricted read access
- Audit log access is itself audited (meta-audit)

---

## 10. Demo Mode

### 10.1 Overview

Demo Mode allows potential investors and partners to explore Atlas without creating real accounts. Demo mode operates on the same database as production but with isolated, clearly-marked fake data.

### 10.2 Demo Data Characteristics

#### Real (structural) Data
- Database schema and constraints are identical to production
- All entity relationships are enforced
- All business rules are applied
- All validation rules are enforced
- Transaction lifecycle follows the same paths

#### Fake (content) Data
- All personal information is fictitious (generated names, addresses, SSNs)
- All monetary balances are simulated
- All transactions are pre-generated or simulated
- All card numbers are test numbers (not real PANs)
- All crypto addresses are testnet addresses
- All external accounts are test bank accounts
- All loans are simulated with fake credit scores
- All notifications are pre-generated

### 10.3 Demo Identification

- All demo users have `is_demo = TRUE` on the User entity
- All demo bank accounts have `is_demo = TRUE` on the BankAccount entity
- All demo data is tagged with a `demo_scenario_id` in the metadata JSONB field
- Demo data is excluded from production analytics and reporting
- Demo users cannot perform real money movements
- Demo accounts cannot receive real deposits

### 10.4 Demo Scenarios

| Scenario | Description | Seed Data |
|----------|-------------|-----------|
| FULL_ONBOARDING | New user completes registration through account opening | Empty account, guided flow |
| TRANSACTION_HISTORY | User with 90 days of transaction history | 200+ transactions across categories |
| CRYPTO_DEPOSIT | User making their first crypto deposit | Wallets ready, sample deposits |
| LOAN_APPLICATION | User applying for and receiving a loan | Application, approval, disbursement |
| CARD_ACTIVATION | User receiving and activating a debit card | Card issued, awaiting activation |

### 10.5 Demo Data Reset

- Demo data can be reset to initial state via the `DemoScenario` entity
- Reset deletes all demo data for a specific scenario and re-seeds from `seed_data` JSONB
- Reset is triggered by admin or via API endpoint (POST /admin/demo/reset/:scenarioId)
- Individual demo users can reset their own data via the app (visible only in demo mode)
- Reset does not affect non-demo data

### 10.6 Demo Scenario Replay

- Each scenario has a predefined sequence of actions stored in `seed_data`
- Actions include: time-based triggers (e.g., "wait 2 seconds, then create a transaction")
- The replay engine executes actions sequentially, creating realistic data
- Scenarios can be paused, resumed, and fast-forwarded
- Demo clock can be accelerated to show long-term effects (e.g., interest accrual)

### 10.7 Demo Mode Isolation

- Demo users cannot interact with non-demo users (no internal transfers to real accounts)
- Demo transactions do not appear in production reporting
- Demo crypto wallets use testnet only
- Demo card numbers use Visa/Mastercard test number ranges
- Demo mode is indicated by a persistent banner in the UI
- API responses include `X-Demo-Mode: true` header for demo users

---

## 11. Performance Considerations

### 11.1 Expected Table Sizes (Year 1)

| Table | Estimated Rows | Growth Rate | Size Estimate |
|-------|---------------|-------------|---------------|
| User | 50,000 | 5,000/month | 50 MB |
| BankAccount | 75,000 | 7,500/month | 25 MB |
| Transaction | 5,000,000 | 500,000/month | 5 GB |
| TransactionLine | 10,000,000 | 1,000,000/month | 10 GB |
| PendingTransaction | 100,000 | Rolling | 50 MB |
| CardTransaction | 2,000,000 | 200,000/month | 2 GB |
| Transfer | 500,000 | 50,000/month | 500 MB |
| CryptoDeposit | 100,000 | 10,000/month | 100 MB |
| CryptoWithdrawal | 50,000 | 5,000/month | 50 MB |
| AuditLog | 20,000,000 | 2,000,000/month | 20 GB |
| Notification | 10,000,000 | 1,000,000/month | 10 GB |
| LoginAttempt | 2,000,000 | 200,000/month | 2 GB |
| SecurityEvent | 100,000 | 10,000/month | 50 MB |
| Loan | 5,000 | 500/month | 5 MB |
| LoanPayment | 30,000 | 3,000/month | 10 MB |

### 11.2 Index Strategy

#### High-Priority Indexes (Critical Path)
- `transactions.account_id + created_at DESC` — Dashboard transaction list
- `balances.account_id` — Balance lookups (every transaction)
- `cards.card_number_hash` — Card authorization
- `pending_transactions.status` WHERE active — Settlement worker
- `users.email` — Login authentication
- `refresh_tokens.token_hash` — Token validation (every authenticated request)

#### Medium-Priority Indexes
- `audit_logs.created_at DESC` — Admin audit queries
- `audit_logs.resource_type + resource_id` — Entity audit trail
- `notifications.user_id + is_read` — Unread count
- `crypto_deposits.status WHERE pending` — Deposit monitoring worker
- `transfer_schedules.next_execution_at WHERE active` — Scheduler worker

#### Low-Priority Indexes (Can Be Added Later)
- `transactions.category_id` — Spending analytics
- `transactions.merchant_name` — Search
- Trigram indexes on user names for fuzzy search

### 11.3 Query Optimization

#### Common Query Patterns
1. **Dashboard load:** Fetch user → accounts → latest transactions → balances. Use JOIN with account_id index.
2. **Transaction list:** Paginated with cursor-based pagination (created_at DESC). Offset pagination avoided.
3. **Balance check:** Single-row lookup on balances table with account_id unique index. Sub-millisecond.
4. **Card authorization:** Hash lookup on card_number_hash, then status check, then limit check. All indexed.
5. **Audit trail:** Filter by resource_type + resource_id with composite index.

#### Anti-Patterns to Avoid
- No N+1 queries (use JOINs or batch loading)
- No SELECT * on large tables (select only needed columns)
- No unindexed queries on tables > 100k rows
- No subqueries in hot paths (use JOINs)
- No LIKE '%prefix%' queries (use trigram or full-text search)

### 11.4 Archiving Strategy

- **AuditLog:** Partitioned by month. After 2 years, older partitions moved to cold storage (S3/Archive tables)
- **LoginAttempt:** After 2 years, moved to archive tables
- **NotificationDelivery:** After 1 year, delivered records moved to archive
- **TransactionLine:** Never archived (needed for balance calculations)
- **Completed/Closed entities:** Soft-deleted records remain in the active table but are excluded by query scopes

### 11.5 Partitioning Recommendations

#### Time-Based Partitioning
- `audit_logs` — Partition by `created_at` (monthly)
- `login_attempts` — Partition by `created_at` (monthly)
- `notifications` — Partition by `created_at` (monthly)
- `notification_deliveries` — Partition by `created_at` (monthly)
- `crypto_prices` — Partition by `fetched_at` (monthly)

#### Hash-Based Partitioning (Future)
- `transactions` — If row count exceeds 100M, partition by `account_id` hash
- `transaction_lines` — Same as transactions

### 11.6 Read/Write Patterns

| Operation | Pattern | Frequency | Notes |
|-----------|---------|-----------|-------|
| Balance lookup | Read | Very High | Every app load, every transaction |
| Transaction list | Read | High | Dashboard, statements |
| Create transaction | Write | High | Every money movement |
| Login authentication | Read | Medium | Every login |
| Card authorization | Read+Write | High | Real-time, latency-sensitive |
| Audit log write | Write | Very High | Every auditable event |
| Notification read | Read | Medium | App open, mark as read |
| Crypto price fetch | Write | Medium | Every 60 seconds |
| Statement generation | Write | Low | Monthly batch |
| Demo reset | Write | Low | On-demand |

### 11.7 Caching Strategy (Application Level)

- **User session data:** Redis (TTL: 7 days)
- **User preferences:** Redis (TTL: 1 hour, invalidated on update)
- **Feature flags:** Redis (TTL: 5 minutes)
- **Crypto prices:** Redis (TTL: 60 seconds)
- **System settings:** Redis (TTL: 5 minutes)
- **Account balances:** NOT cached (always read from DB for consistency)
- **Card limits:** Redis (TTL: 30 seconds, invalidated on use)

### 11.8 Connection Pooling

- **Application connections:** PgBouncer in transaction mode
- **Pool size:** 20 connections per application instance
- **Max connections:** 200 total (across all instances)
- **Idle timeout:** 300 seconds
- **Query timeout:** 30 seconds (configurable per query type)
- **Long-running queries:** Statement timeout of 60 seconds for reports

---

## 12. Future Expansion

### 12.1 Business Accounts

**Schema Impact:**
- Add `account_subtype` enum: PERSONAL, BUSINESS, SOLE_PROPRIETOR, LLC, CORPORATION, PARTNERSHIP
- Add `business_info` table: entity_name, ein, entity_type, industry, annual_revenue, date_of_formation
- Add `beneficial_owner` table: for KYC of business owners (25%+ ownership)
- Modify `User` to optionally link to a business entity
- No changes needed to Transaction, Transfer, or Card domains

**Migration Strategy:** Add new columns and tables; existing personal accounts get `account_subtype = PERSONAL`.

### 12.2 Joint Accounts

**Schema Impact:**
- Already supported via `AccountHolder` junction table with roles
- Need to add consent and authorization rules for joint account operations
- Add `joint_account_agreement` table for digital signatures
- No schema redesign needed; only business logic changes

### 12.3 Multiple Checking Accounts

**Schema Impact:**
- Already supported; `BankAccount` has no limit on number per user (currently business-rule limited to 3)
- Add `account_purpose` field (PRIMARY, SECONDARY, BUSINESS, SAVINGS_GOAL)
- No schema changes needed

### 12.4 Real Core Banking Integration

**Schema Impact:**
- Add `core_banking_account_id` to `BankAccount` — reference ID in the core banking system (e.g., Column, Synapse, Unit)
- Add `core_banking_transaction_id` to `Transaction` — reference to core banking transaction
- Add `core_banking_sync_log` table — tracks synchronization with core banking
- Add `core_banking_event` table — incoming webhooks from core banking provider
- Modify balance management to delegate to core banking system

**Integration Partners:** Column, SynapseFi, Unit, Lead Bank, Blue Ridge Bank

### 12.5 Plaid Integration

**Schema Impact:**
- Add `plaid_item` table: tracks Plaid connections per user
- Add `plaid_account` table: maps Plaid accounts to Atlas accounts
- Add `plaid_transaction` table: raw Plaid transaction data for reconciliation
- `ExternalAccount` already has `plaid_access_token` and `plaid_item_id` fields
- Add `plaid_sync_cursor` for Plaid's new Sync API

### 12.6 Stripe Treasury Integration

**Schema Impact:**
- Add `stripe_treasury_account_id` to `BankAccount`
- Add `stripe_financial_account` table: Stripe Treasury financial account details
- Add `stripe_transaction` table: Stripe Treasury transaction references
- Modify `Balance` to reflect Stripe-managed balances
- Add `stripe_inbound_transfer` and `stripe_outbound_payment` tables

### 12.7 FedNow Integration

**Schema Impact:**
- Add `fednow_transaction` table: FedNow-specific transaction data
- Add `fednow_request_for_payment` table: RFP messages
- Modify `Transfer` to support FedNow as a new `TransferType` (INSTANT_FEDNOW)
- Add `fednow_participant` table: participating bank directory
- FedNow operates 24/7/365 — no batch processing windows

### 12.8 Real ACH (Nacha)

**Schema Impact:**
- Add `ach_batch` table: ACH file batches
- Add `ach_entry` table: Individual entries within a batch
- Add `ach_return` table: Returned ACH entries with return codes
- Add `ach_noc` table: Notifications of Change
- `Transfer` already has ACH types; these tables provide backend detail
- Add `ach_company_id` and `ach_terminal_id` for origination

### 12.9 Real SWIFT (gpi)

**Schema Impact:**
- Add `swift_message` table: MT103/MT202 message details
- Add `swift_tracking` table: End-to-end tracking for SWIFT gpi
- Add `correspondent_bank` table: Correspondent bank directory
- Modify `Transfer` metadata JSONB to include SWIFT-specific fields
- Add `swift_uetr` field (Unique End-to-End Transaction Reference)

### 12.10 Debit Card Processor Integration

**Schema Impact:**
- Add `card_issuer` table: Card issuing partner details (Marqeta, Galileo, i2c)
- Add `card_issuer_transaction_id` to `CardTransaction`
- Add `card_issuer_event` table: Incoming webhooks from card processor
- Add `card_fulfillment` table: Physical card printing and shipping tracking
- Add `card_digital_wallet` table: Apple Pay, Google Pay, Samsung Pay tokenization
- Modify card authorization flow to delegate to card processor

### 12.11 Real Crypto Custody

**Schema Impact:**
- Add `custody_provider` table: Custodial partner details (Fireblocks, BitGo, Coinbase Custody)
- Add `custody_vault` table: Vault/account details at custody provider
- Add `custody_transaction` table: Custody provider transaction references
- Modify `CryptoWallet` to link to custody provider wallets
- Add `custody_policy` table: Approval policies for withdrawals (M-of-N signatures)
- Add `cold_storage_audit` table: Periodic cold storage balance verification

### 12.12 General Expansion Guidelines

Any future expansion should follow these principles:

1. **Additive changes only:** New tables and columns are added; existing structures are never removed or renamed
2. **Nullable foreign keys:** New integrations use nullable FK fields to maintain backward compatibility
3. **JSONB metadata:** Integration-specific data that doesn't warrant a new column goes in the `metadata` JSONB field
4. **Feature flags:** New features controlled by FeatureFlag entity for gradual rollout
5. **Soft references:** External system IDs stored alongside internal UUIDs
6. **Event sourcing readiness:** All state changes are already captured in AuditLog; future event sourcing can replay from this log
7. **Backward compatibility:** All migrations must be backward-compatible (no breaking changes)
8. **Zero downtime:** All schema changes designed for zero-downtime deployment

---

## Appendix A: Table Count Summary

| Domain | Entity Count |
|--------|-------------|
| Authentication | 8 |
| Account | 6 |
| Transaction | 6 |
| Transfer | 5 |
| Card | 6 |
| Crypto | 7 |
| Investment | 4 |
| Loan | 5 |
| Notification | 4 |
| Administration | 5 |
| Audit | 3 |
| Settings | 4 |
| **Total** | **63** |

## Appendix B: Enum Count Summary

| Category | Enum Count |
|----------|-----------|
| User | 2 |
| Account | 6 |
| Transaction | 4 |
| Transfer | 6 |
| Card | 5 |
| Crypto | 5 |
| Investment | 5 |
| Loan | 6 |
| Notification | 4 |
| Administration | 1 |
| Audit | 4 |
| Settings | 2 |
| **Total** | **50** |

## Appendix C: Index Count Summary

| Domain | Index Count |
|--------|------------|
| Authentication | ~15 |
| Account | ~10 |
| Transaction | ~15 |
| Transfer | ~10 |
| Card | ~10 |
| Crypto | ~10 |
| Investment | ~5 |
| Loan | ~8 |
| Notification | ~6 |
| Administration | ~5 |
| Audit | ~5 |
| Settings | ~4 |
| **Total** | **~103** |

---

*This document is the authoritative source for the Atlas database design. Any changes to the database schema must first be reflected in this document, reviewed by the architecture team, and then implemented in the Prisma schema.*

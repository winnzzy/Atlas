# Investment Platform Architecture

## Overview

The Investment Platform is a production-grade module within Atlas that enables customers to invest in various asset classes. For the MVP, **Cryptocurrency** is the only active investment product. The architecture is designed to support future asset classes (Stocks, ETFs, Bonds, Money Market, Gold) without requiring a redesign.

## Module Structure

```
investments/
├── controllers/
│   └── investment.controller.ts      # REST API endpoints
├── dto/
│   ├── create-asset.dto.ts           # Asset creation DTOs
│   ├── deposit.dto.ts                # Deposit request DTOs
│   ├── withdrawal.dto.ts             # Withdrawal request DTOs
│   ├── wallet.dto.ts                 # Wallet management DTOs
│   ├── price.dto.ts                  # Pricing DTOs
│   ├── portfolio.dto.ts              # Portfolio response DTOs
│   ├── search-investments.dto.ts     # Search/filter DTOs
│   └── index.ts                      # Barrel exports
├── enums/
│   ├── asset-class.enum.ts           # Asset class definitions
│   ├── asset-symbol.enum.ts          # Asset symbol definitions
│   ├── investment-status.enum.ts     # Status enumerations
│   └── index.ts                      # Barrel exports
├── events/
│   └── investment.events.ts          # Domain events
├── exceptions/
│   └── investment-domain.exception.ts # Domain exceptions
├── mappers/
│   └── investment.mapper.ts          # Entity ↔ DTO mapping
├── policies/
│   └── investment.policy.ts          # Business rule enforcement
├── repositories/
│   └── investment.repository.ts      # Data access layer
├── services/
│   ├── asset.service.ts              # Asset management
│   ├── pricing.service.ts            # Price management
│   ├── wallet.service.ts             # Wallet address management
│   ├── deposit.service.ts            # Deposit workflow
│   ├── withdrawal.service.ts         # Withdrawal workflow
│   ├── approval.service.ts           # Admin approval workflow
│   └── portfolio.service.ts          # Portfolio calculations
├── validators/
│   └── investment.validator.ts       # Input validation
└── investments.module.ts             # Module definition
```

## Design Principles

### 1. Orchestration Over Accounting

The Investment Platform **orchestrates** existing modules. It contains **zero accounting logic**. All financial posting flows through:

```
Investment Module → Transaction Engine → Ledger
```

### 2. Asset Class Abstraction

Asset classes are modeled as an enum with CRYPTO as the only active class. Future assets (STOCK, ETF, BOND, MONEY_MARKET, GOLD) are defined as placeholders:

```typescript
enum AssetClass {
  CRYPTO = 'CRYPTO',         // Active
  STOCK = 'STOCK',           // Placeholder
  ETF = 'ETF',               // Placeholder
  BOND = 'BOND',             // Placeholder
  MONEY_MARKET = 'MONEY_MARKET', // Placeholder
  GOLD = 'GOLD',             // Placeholder
}
```

### 3. Event-Driven Architecture

Every significant action emits a domain event:

| Event | Trigger |
|-------|---------|
| `InvestmentCreated` | New investment record created |
| `InvestmentDepositRequested` | Customer requests deposit |
| `InvestmentDepositApproved` | Admin approves deposit |
| `InvestmentWithdrawalRequested` | Customer requests withdrawal |
| `InvestmentWithdrawalApproved` | Admin approves withdrawal |
| `PortfolioUpdated` | Portfolio recalculated |
| `AssetPriceUpdated` | Admin updates asset price |
| `WalletAddressChanged` | Admin changes wallet address |

### 4. Admin-Only Wallet Management

Wallet addresses are managed exclusively from the admin backend. Customers can view addresses for deposits but cannot modify them.

### 5. Manual Pricing (MVP)

Pricing is manual in the MVP phase. Admin updates prices directly. The architecture supports future integration with market APIs.

## Data Flow

### Deposit Flow

```
Customer → Investments → Choose Asset → Display Wallet Address
→ Customer sends crypto → Pending Deposit → Admin Approval
→ Transaction Created → Ledger Posting → Portfolio Updated
```

### Withdrawal Flow

```
Customer → Request Withdrawal → Destination Wallet
→ Admin Approval → Transaction → Ledger → Portfolio Updated
```

## Integration Points

| Module | Integration |
|--------|-------------|
| **Transactions** | All money movement creates transactions |
| **Ledger** | Transactions post to ledger for double-entry accounting |
| **Auth** | JWT authentication and role-based access |
| **Accounts** | Customer account association |
| **Prisma** | Database access via Prisma ORM |

## Supported Crypto Assets

| Symbol | Name | Network |
|--------|------|---------|
| BTC | Bitcoin | Bitcoin |
| ETH | Ethereum | Ethereum |
| USDT (ERC20) | Tether | Ethereum |
| USDT (TRC20) | Tether | Tron |
| USDC | USD Coin | Ethereum |
| BNB | Binance Coin | BNB Chain |
| SOL | Solana | Solana |
| XRP | Ripple | XRP Ledger |

## Security

- All endpoints require JWT authentication
- Admin endpoints require ADMIN or SUPER_ADMIN roles
- Wallet address changes are audited
- All approvals require admin role
- Portfolio read access is restricted to the owning customer or admins

## Audit Trail

Every action is audited:
- Deposits (request + approval)
- Withdrawals (request + approval)
- Price updates
- Wallet changes
- Portfolio adjustments
- Asset status changes
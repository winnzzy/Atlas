# Portfolio Management

## Overview

Each customer has a single portfolio that aggregates all their investment holdings. The portfolio provides a comprehensive view of investment performance including total value, asset allocation, profit/loss tracking, and individual holding details.

## Portfolio Structure

```
Customer
  └── Portfolio
        ├── Total Value (USD)
        ├── Asset Allocation (%)
        ├── Total Invested (USD)
        ├── Total Profit/Loss
        │     ├── Realized P/L
        │     └── Unrealized P/L
        └── Holdings[]
              ├── Asset (BTC, ETH, etc.)
              ├── Quantity
              ├── Average Cost (USD)
              ├── Current Price (USD)
              ├── Current Value (USD)
              └── Profit/Loss (USD)
```

## Portfolio Calculations

### Total Portfolio Value

```
Total Value = Σ (Holding.Quantity × CurrentPrice)
```

### Average Cost

When multiple deposits exist for the same asset:

```
Average Cost = Total Invested / Total Quantity
Total Invested = Σ (Deposit.Amount × Deposit.Price)
```

### Unrealized Profit/Loss

```
Unrealized P/L = Current Value - Invested Amount
Unrealized P/L = (CurrentPrice × Quantity) - (AverageCost × Quantity)
```

### Realized Profit/Loss

Tracked when withdrawals occur:

```
Realized P/L = WithdrawalAmount - (AverageCost × WithdrawalQuantity)
```

### Asset Allocation

```
Allocation % = (AssetValue / TotalPortfolioValue) × 100
```

## API Endpoints

### Get Portfolio

```
GET /api/v1/investments/portfolio
Authorization: Bearer <token>

Response:
{
  "id": "uuid",
  "userId": "uuid",
  "totalValueUsd": 50000,
  "totalCostBasisUsd": 45000,
  "totalProfitLossUsd": 5000,
  "totalProfitLossPct": 11.11,
  "totalRealizedPnl": 1000,
  "holdings": [...],
  "currency": "USD",
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-01-15T10:30:00Z"
}
```

### Get Holding

```
GET /api/v1/investments/portfolio/holdings/:productId
Authorization: Bearer <token>

Response:
{
  "productId": "uuid",
  "symbol": "BTC",
  "name": "Bitcoin",
  "assetClass": "CRYPTO",
  "quantity": 0.5,
  "averageCost": 40000,
  "currentPrice": 45000,
  "currentValue": 22500,
  "totalCost": 20000,
  "unrealizedPnl": 2500,
  "unrealizedPnlPct": 12.5,
  "realizedPnl": 0,
  "allocationPct": 45
}
```

### Get Portfolio Transactions

```
GET /api/v1/investments/portfolio/transactions?productId=<optional>&type=<optional>
Authorization: Bearer <token>

Response:
[ ...PortfolioTransactionResponseDto ]
```

## Business Rules

1. Portfolio is automatically created when a customer makes their first deposit
2. Portfolio is recalculated on every deposit approval, withdrawal, and price update
3. Portfolio value is denominated in the account's base currency (USD)
4. Zero-quantity holdings are excluded from active portfolio but retained for history
5. Customers can only view their own portfolio
6. Admins can view any customer's portfolio
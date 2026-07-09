# @atlas/banking-ui

Domain-specific UI components for Atlas banking features.

## Overview

This package contains banking-specific React components built on top of `@atlas/ui` primitives. All components are designed for financial data display with proper formatting, accessibility, and dark mode support.

## Components

### Display

| Component | Description |
|-----------|-------------|
| `AmountDisplay` | Fiat currency amount with proper formatting |
| `CryptoAmountDisplay` | Cryptocurrency amount with optional USD equivalent |
| `BalanceCard` | Account balance with trend indicator |
| `StatCard` | KPI metric with trend and icon |

### Lists

| Component | Description |
|-----------|-------------|
| `TransactionRow` | Single transaction line item |
| `TransactionList` | Scrollable transaction list with loading states |
| `AccountCard` | Bank account summary card |
| `AccountSelector` | Selectable account list |
| `CryptoPriceCard` | Crypto asset with price and 24h change |
| `CryptoAssetList` | List of crypto assets |
| `ActivityFeed` | Security/account activity timeline |

### Utilities

| Component | Description |
|-----------|-------------|
| `CategoryBadge` | Color-coded transaction category |
| `ProgressBar` | Animated progress indicator |
| `EmptyState` | Placeholder for empty data |
| `DateRangePicker` | Date range selection with presets |

## Usage

```tsx
import {
  AmountDisplay,
  BalanceCard,
  TransactionList,
  CategoryBadge,
} from '@atlas/banking-ui';

function Dashboard() {
  return (
    <div>
      <BalanceCard
        title="Main Account"
        balance={{ amount: 12500.50, currency: 'USD' }}
        trend="up"
        trendPercent={5.2}
      />
      <TransactionList
        transactions={[...]}
        loading={false}
      />
    </div>
  );
}
```

## Design Principles

- **Zero business logic** — Components are pure display
- **Readonly props** — All props interfaces use `readonly`
- **Accessible** — ARIA labels, keyboard navigation
- **Dark mode** — Full dark mode support via CSS variables
- **Responsive** — Mobile-first layouts
- **Formatted** — Bank-grade number formatting via `utils/format`

## Storybook

Run Storybook to preview all components:

```bash
pnpm storybook
```

## Exports

All components, types, and utilities are exported from the package root:

```tsx
import { AmountDisplay, formatMoney, type Money } from '@atlas/banking-ui';
# Cryptocurrency Investment Guide

## Overview

Cryptocurrency is the only active asset class in the Investment Platform MVP. This document covers the supported crypto assets, their characteristics, and how they are managed within the platform.

## Supported Assets

| Symbol | Name | Network | Decimals | Status |
|--------|------|---------|----------|--------|
| BTC | Bitcoin | Bitcoin | 8 | Active |
| ETH | Ethereum | Ethereum | 18 | Active |
| USDT_ERC20 | Tether (ERC20) | Ethereum | 6 | Active |
| USDT_TRC20 | Tether (TRC20) | Tron | 6 | Active |
| USDC | USD Coin | Ethereum | 6 | Active |
| BNB | Binance Coin | BNB Chain | 18 | Active |
| SOL | Solana | Solana | 9 | Active |
| XRP | Ripple | XRP Ledger | 6 | Active |

## Asset Properties

Each crypto asset has the following properties:

- **Symbol**: Unique identifier (e.g., BTC, ETH)
- **Name**: Full name (e.g., Bitcoin, Ethereum)
- **Asset Class**: Always CRYPTO for MVP
- **Network**: Blockchain network (e.g., Bitcoin, Ethereum, Tron)
- **Decimals**: Decimal precision for the asset
- **Status**: ACTIVE, SUSPENDED, DISABLED, or DELISTED
- **Minimum Deposit**: Minimum amount for deposits
- **Minimum Withdrawal**: Minimum amount for withdrawals
- **Withdrawal Fee**: Fee charged for withdrawals

## USDT Network Variants

USDT exists on multiple networks. Each variant is treated as a separate asset:

- **USDT (ERC20)**: Runs on Ethereum network. Higher gas fees, wider compatibility.
- **USDT (TRC20)**: Runs on Tron network. Lower fees, faster transactions.

Customers must select the correct network variant when depositing or withdrawing USDT.

## Deposits

1. Customer selects a crypto asset (e.g., BTC)
2. Platform displays the wallet address for that asset's network
3. Customer sends crypto from their external wallet
4. Customer submits deposit request with transaction details
5. Admin verifies the deposit on the blockchain
6. Admin approves the deposit
7. Transaction is created and posted to the ledger
8. Portfolio is updated with the new holding

### Deposit Requirements

- Amount must meet minimum deposit requirement
- Asset must be ACTIVE
- Customer must have an active account

## Withdrawals

1. Customer selects asset and amount to withdraw
2. Customer provides destination wallet address
3. Customer submits withdrawal request
4. Admin reviews and approves the withdrawal
5. Transaction is created and posted to the ledger
6. Portfolio is updated
7. Admin processes the actual blockchain transfer (manual for MVP)

### Withdrawal Requirements

- Amount must meet minimum withdrawal requirement
- Customer must have sufficient balance
- Withdrawal fee is deducted from the withdrawal amount
- Asset must be ACTIVE

## Pricing

Prices are denominated in USD. Admin manually updates prices:

- **Current Price**: Latest price per unit
- **24h Change**: Percentage change in last 24 hours
- **Market Cap**: Not tracked for MVP

## Future Asset Classes

The following are modeled but not active:

| Class | Status | Description |
|-------|--------|-------------|
| STOCK | Placeholder | Individual company stocks |
| ETF | Placeholder | Exchange-traded funds |
| BOND | Placeholder | Government and corporate bonds |
| MONEY_MARKET | Placeholder | Money market instruments |
| GOLD | Placeholder | Physical and digital gold |

These can be enabled in the future without modifying the core architecture.
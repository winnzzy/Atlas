# Pricing Service

## Overview

The Pricing Service manages asset prices within the Investment Platform. For the MVP, pricing is manual — administrators update prices directly through the admin API. The architecture is designed to support automated market price feeds in the future.

## Price Properties

| Property | Type | Description |
|----------|------|-------------|
| Asset Symbol | string | The asset being priced (e.g., BTC) |
| Current Price | decimal | Current price in USD |
| Previous Price | decimal | Previous price for change calculation |
| 24h Change | decimal | Percentage change in last 24 hours |
| 24h High | decimal | Highest price in last 24 hours |
| 24h Low | decimal | Lowest price in last 24 hours |
| Updated At | timestamp | Last price update timestamp |
| Updated By | string | Admin who last updated the price |

## Admin Operations

### Update Price

```
POST /api/v1/investments/admin/prices
Authorization: Bearer <admin-token>

{
  "productSymbol": "BTC",
  "price": 45000,
  "marketCap": 850000000000,
  "volume24h": 32000000000
}
```

### Get Current Prices

```
GET /api/v1/investments/admin/prices
Authorization: Bearer <admin-token>
```

### Get Product Price

```
GET /api/v1/investments/admin/prices/:productId
Authorization: Bearer <admin-token>
```

## Portfolio Impact

When prices are updated, a new price record is persisted and an asset price event is emitted:

1. Admin updates BTC price
2. PricingService emits `AssetPriceUpdated` event
3. Consumers can recalculate downstream portfolio views

## Business Rules

1. Only admins can update prices
2. Price changes emit `AssetPriceUpdated` event
3. Each price update is audited with timestamp and admin ID
5. Price must be greater than zero
6. 24h change and percentage are calculated from previous price snapshot

## Future Enhancements

- Automated price feeds from market APIs (CoinGecko, CoinMarketCap)
- Real-time WebSocket price streaming
- Historical price data storage
- Price alerts for customers
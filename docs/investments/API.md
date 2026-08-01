# Investment Platform API Reference

## Base URL

`/api/v1/investments`

## Authentication

- All endpoints require JWT Bearer authentication.
- Admin endpoints require `ADMIN` or `SUPER_ADMIN` role.

## Customer Endpoints

### Portfolio

- `GET /portfolio`
  - Response `200`: `PortfolioResponseDto`
- `GET /portfolio/holdings/:productId`
  - Response `200`: `HoldingResponseDto | null`
- `GET /portfolio/transactions?productId=&type=`
  - Response `200`: `PortfolioTransactionResponseDto[]`

### Deposits

- `POST /deposits`
  - Request: `CreateDepositDto`
    - `productSymbol: string`
    - `amount: number`
    - `txHash?: string`
    - `description?: string`
  - Response `201`: `DepositResponseDto`
- `GET /deposits`
  - Response `200`: `DepositResponseDto[]`
- `GET /deposits/:id`
  - Response `200`: `DepositResponseDto`

### Withdrawals

- `POST /withdrawals`
  - Request: `CreateWithdrawalDto`
    - `productSymbol: string`
    - `amount: number`
    - `toAddress: string`
    - `toMemo?: string`
    - `description?: string`
  - Response `201`: `WithdrawalResponseDto`
- `GET /withdrawals`
  - Response `200`: `WithdrawalResponseDto[]`
- `GET /withdrawals/:id`
  - Response `200`: `WithdrawalResponseDto`

### Asset Discovery

- `GET /assets`
  - Response `200`: `AssetResponseDto[]` (active assets)
- `GET /assets/:id`
  - Response `200`: `AssetResponseDto`
- `GET /assets/:id/wallets`
  - Response `200`: `WalletResponseDto[]`

## Admin Endpoints

### Asset Management

- `POST /admin/assets`
  - Request: `CreateAssetDto`
  - Response `201`: `AssetResponseDto`
- `GET /admin/assets?assetClass=&status=`
  - Response `200`: `AssetResponseDto[]`
- `GET /admin/assets/:id`
  - Response `200`: `AssetResponseDto`
- `PATCH /admin/assets/:id/enable`
  - Response `200`: `AssetResponseDto`
- `PATCH /admin/assets/:id/disable`
  - Response `200`: `AssetResponseDto`
- `PATCH /admin/assets/:id/suspend`
  - Response `200`: `AssetResponseDto`
- `PATCH /admin/assets/:id/freeze`
  - Response `200`: `AssetResponseDto`

### Wallet Management

- `POST /admin/wallets`
  - Request: `CreateWalletDto`
  - Response `201`: `WalletResponseDto`
- `GET /admin/wallets?productId=&status=&network=`
  - Response `200`: `WalletResponseDto[]`
- `GET /admin/wallets/:id`
  - Response `200`: `WalletResponseDto`
- `PATCH /admin/wallets/:id`
  - Request: `UpdateWalletDto`
  - Response `200`: `WalletResponseDto`
- `PATCH /admin/wallets/:id/activate`
  - Response `200`: `WalletResponseDto`
- `PATCH /admin/wallets/:id/deactivate`
  - Response `200`: `WalletResponseDto`

### Pricing

- `POST /admin/prices`
  - Request: `UpdatePriceDto`
  - Response `201`: `PriceResponseDto`
- `GET /admin/prices`
  - Response `200`: `PriceResponseDto[]`
- `GET /admin/prices/:productId`
  - Response `200`: `PriceResponseDto`

### Approvals

- `POST /admin/deposits/:id/approve`
  - Request body: `{ notes?: string }`
  - Response `200`: `DepositResponseDto`
- `POST /admin/deposits/:id/reject`
  - Request body: `{ reason: string }`
  - Response `200`: `DepositResponseDto`
- `POST /admin/withdrawals/:id/approve`
  - Request body: `{ notes?: string }`
  - Response `200`: `WithdrawalResponseDto`
- `POST /admin/withdrawals/:id/reject`
  - Request body: `{ reason: string }`
  - Response `200`: `WithdrawalResponseDto`
- `GET /admin/deposits?userId=&productId=&status=`
  - Response `200`: `DepositResponseDto[]`
- `GET /admin/withdrawals?userId=&productId=&status=`
  - Response `200`: `WithdrawalResponseDto[]`

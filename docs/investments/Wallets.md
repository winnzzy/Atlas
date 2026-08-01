# Wallet Management

## Overview

Wallet addresses are the entry point for cryptocurrency deposits. Each supported crypto asset has one or more wallet addresses managed exclusively by administrators. Customers can view wallet addresses to send deposits but cannot modify them.

## Wallet Properties

| Property | Description |
|----------|-------------|
| Asset | The crypto asset this wallet is for |
| Network | Blockchain network (e.g., Bitcoin, Ethereum, Tron) |
| Address | The blockchain wallet address |
| Memo/Tag | Optional tag required for some networks (e.g., XRP) |
| QR Placeholder | Placeholder for future QR code generation |
| Status | ACTIVE or INACTIVE |

## Wallet Status

| Status | Description |
|--------|-------------|
| ACTIVE | Wallet is accepting deposits |
| INACTIVE | Wallet is not accepting deposits |

## Admin Operations

### Create Wallet

Admin creates a new wallet address for an asset/network combination.

```
POST /api/v1/investments/admin/wallets
Authorization: Bearer <admin-token>

{
  "productId": "uuid",
  "network": "Bitcoin",
  "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "memo": null
}
```

### Update Wallet

Admin updates wallet details (address, status, memo).

```
PATCH /api/v1/investments/admin/wallets/:id
Authorization: Bearer <admin-token>

{
  "address": "new-address",
  "memo": "optional-memo"
}
```

### List Wallets

Admin can list all wallets with filters.

```
GET /api/v1/investments/admin/wallets?productId=<uuid>&status=ACTIVE&network=Bitcoin
Authorization: Bearer <admin-token>
```

## Customer View

Customers can view active wallet addresses for deposits:

```
GET /api/v1/investments/assets/:id/wallets
Authorization: Bearer <customer-token>

Response:
[ ...WalletResponseDto ]
```

## Business Rules

1. Only admins can create, update, or delete wallet addresses
2. Customers can only view active wallets
3. Wallet address changes emit a `WalletAddressChanged` event
4. Each wallet change is audited
5. A wallet cannot be deactivated if there are pending deposits
6. Wallet addresses must be unique per network/address combination
7. Some networks (e.g., XRP, EOS) require a memo/tag in addition to the address

## Security

- Wallet addresses are stored in the database
- All wallet mutations require admin authentication
- Wallet changes are logged in the audit trail
- No private keys are stored (the platform only manages public deposit addresses)
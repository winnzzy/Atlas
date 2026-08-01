# Card API Surface

## Endpoints

- GET /cards
- POST /cards
- GET /cards/:cardId
- PATCH /cards/:cardId
- POST /cards/:cardId/activate
- POST /cards/:cardId/freeze
- POST /cards/:cardId/unfreeze
- POST /cards/:cardId/lock
- POST /cards/:cardId/unlock
- DELETE /cards/:cardId
- POST /cards/:cardId/replace
- POST /cards/:cardId/reveal
- POST /cards/:cardId/change-pin
- POST /cards/:cardId/regenerate-cvv
- POST /cards/:cardId/authorize
- POST /cards/:cardId/transactions/:transactionId/capture
- POST /cards/:cardId/transactions/:transactionId/complete
- POST /cards/:cardId/transactions/:transactionId/refund
- POST /cards/:cardId/transactions/:transactionId/reverse
- POST /cards/:cardId/transactions/:transactionId/chargeback
- GET /cards/:cardId/transactions

## Search

Card search supports:
- masked card number
- status
- card type
- account
- customer
- merchant
- date range
- transaction linkage

Card transaction search supports:
- cardId
- type
- status
- merchant
- transactionId
- account/customer
- date range

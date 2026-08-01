# Card Authorization Flow

## Flow

1. Card validation
2. Account validation
3. Balance and limits check
4. Create hold via Ledger hold engine
5. Create transaction via Transactions module
6. Emit card authorization event

## Hold Behavior

- Holds are created in Ledger using `createHold`.
- Holds are linked to card transaction metadata.
- Holds are released during capture settlement or authorization reversal.

## Declines

Common decline reasons:
- INSUFFICIENT_FUNDS
- EXCEEDS_LIMIT
- CARD_FROZEN
- BLOCKED_MERCHANT
- SUSPICIOUS_ACTIVITY

Declined authorizations are stored as card transaction records with decline reason.

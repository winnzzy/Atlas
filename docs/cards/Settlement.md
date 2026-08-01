# Card Settlement Flow

## Capture Path

1. Authorized card transaction selected for capture.
2. Capture transaction posted through Transactions module (CARD_CAPTURE).
3. Hold released in Ledger.
4. Card transaction marked CAPTURED.
5. Completion operation can move transaction to COMPLETED.

## Refund Path

1. Refund requested for captured/completed transaction.
2. Refund transaction posted through Transactions module (CARD_REFUND).
3. Card transaction marked REFUNDED.

## Reversal Path

1. Reversal request validated.
2. Transaction reversal delegated to Transactions module.
3. Authorization hold released if transaction still in authorization state.
4. Card transaction marked REVERSED.

## Accounting Boundary

Settlement does not write journal entries directly from cards.
All posting is done by Transactions, which delegates to Ledger.

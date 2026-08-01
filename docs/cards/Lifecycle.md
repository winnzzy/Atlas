# Card Lifecycle

## States

- REQUESTED
- PENDING_VERIFICATION
- ISSUED
- ACTIVATED
- FROZEN
- LOCKED
- EXPIRED
- CANCELLED
- REISSUED

## Allowed Transitions

- REQUESTED -> PENDING_VERIFICATION | ISSUED
- PENDING_VERIFICATION -> ISSUED | ACTIVATED
- ISSUED -> ACTIVATED | FROZEN | CANCELLED
- ACTIVATED -> FROZEN | LOCKED | CANCELLED | REISSUED
- FROZEN -> ACTIVATED | LOCKED | CANCELLED
- LOCKED -> ACTIVATED | CANCELLED
- REISSUED -> terminal
- EXPIRED -> terminal
- CANCELLED -> terminal

## Operational Notes

- Physical cards typically start at PENDING_VERIFICATION.
- Virtual cards are issued immediately.
- Reissue marks original card as REISSUED and opens a replacement card.

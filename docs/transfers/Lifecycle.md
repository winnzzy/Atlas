# Transfer Lifecycle

## States

- Created
- Validated
- Pending Approval
- Queued
- Submitted
- Processing
- Sent
- Pending Settlement
- Settled
- Completed
- Failed
- Cancelled
- Returned
- Reversed
- Expired

## Flow

Created -> Validated -> Pending Approval -> Queued -> Submitted -> Processing -> Sent -> Pending Settlement -> Settled -> Completed

## Notes

- Scheduled and future-dated transfers remain queued until execution.
- Returned and reversed transfers are terminal workflow outcomes.
- Settlement timestamps are tracked separately from transaction posting timestamps.

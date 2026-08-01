# Transfer Sequence Diagrams

## Immediate Transfer

Client -> Transfer Controller -> Transfer Service -> Policy/Validator -> Transaction Service -> Ledger -> Events

## Scheduled Transfer

Client -> Transfer Controller -> Transfer Service -> Repository (queued state) -> Future execution -> Transaction Service -> Ledger -> Events

## Beneficiary Lifecycle

Client -> Transfer Controller -> Transfer Service -> Repository -> Events

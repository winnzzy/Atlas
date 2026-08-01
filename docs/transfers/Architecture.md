# Transfer Engine Architecture

The Transfer Engine is a workflow orchestration layer for ACH, wire, SWIFT, and internal transfers. It does not perform accounting. All financial posting is delegated to the Transaction Engine, which in turn delegates accounting to the Ledger.

## Principles

- Transfers are workflow state machines.
- Transactions are accounting-backed financial records.
- The Transfer Engine validates beneficiaries, policies, routing, and limits before calling the Transaction Engine.
- The Transaction Engine is the only layer allowed to initiate ledger posting.

## Modules

- Controller: REST API and Swagger annotations.
- Service: Orchestrates policy checks, beneficiary checks, and transaction creation.
- Repository: In-memory persistence for transfer and beneficiary records.
- Policy: Validates transfer eligibility and cancel/reverse rules.
- Validator: Routing number, SWIFT/BIC, IBAN, and amount checks.
- Mapper: Domain record to API DTO conversion.
- Events: Lifecycle and beneficiary domain events.

## Data Flow

1. Authenticated user submits a transfer request.
2. Policy and beneficiary validation run.
3. Idempotency and reference uniqueness are checked.
4. The Transfer Engine creates a transfer record.
5. Immediate transfers call the Transaction Engine.
6. The Transaction Engine posts the ledger-backed transaction.
7. The Transfer Engine records settlement state and emits events.

## Guardrails

- No direct balance mutation.
- No accounting logic inside the Transfer Engine.
- No duplicate reference numbers.
- No duplicate idempotency keys.
- All transfer failures leave the ledger unchanged.

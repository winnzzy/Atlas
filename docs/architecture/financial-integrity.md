# Financial Integrity

## Transaction Lifecycle

1. An authenticated request enters the backend with a request ID, correlation ID, and optional idempotency key.
2. The integration layer validates ownership and account status before invoking the ledger.
3. The ledger posts the journal and emits domain events.
4. Account balance mirrors are updated in the same orchestration flow.
5. Financial audit rows are written through the audit schema.
6. Notification hooks consume the emitted financial events.

## Posting Lifecycle

- Journals are validated for balanced debits and credits.
- Duplicate posting IDs and duplicate idempotency keys are rejected.
- Posting results are replay-safe when the same idempotency key and fingerprint are reused.

## Balance Lifecycle

- Ledger is the source of truth.
- Account balances are treated as mirrors of successful ledger postings.
- Holds adjust available and held balances without mutating the ledger directly.

## Failure Recovery

- If account synchronization or audit logging fails after a ledger post, the in-memory ledger snapshot is restored.
- Idempotency entries are expired automatically and revalidated on every request.

## Idempotency Strategy

- The request fingerprint is derived from method, path, authenticated user, and stable request body serialization.
- Completed responses are cached and replayed for duplicate requests.
- Reused keys with different fingerprints are rejected.

## Concurrency Strategy

- Ledger posting uses ledger-level validation and optimistic request deduplication.
- Account balance mirrors are updated inside a database transaction.
- Session revocation and request replay are protected by the same idempotency and context primitives.
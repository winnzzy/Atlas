# Transfer Business Rules

- Transfers must validate source account ownership and source account status.
- Internal transfers require a destination Atlas account.
- ACH, wire, and SWIFT transfers require either a beneficiary or external account details.
- Routing numbers must be 9 digits when present.
- SWIFT/BIC codes must follow the standard 8 or 11 character format.
- IBAN support is future-ready and validated when supplied.
- No duplicate reference numbers.
- No duplicate idempotency keys.
- Scheduled transfers may queue without immediate posting.
- Every successful immediate transfer creates a transaction and therefore a balanced ledger journal.
- Transfer cancellation and reversal must respect workflow state transitions.

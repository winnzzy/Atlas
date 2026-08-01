# Card Processing Engine - Architecture

## Overview

The Card Processing Engine is an orchestration layer that manages card lifecycle and card transaction workflows.

It does not perform accounting directly.

Accounting delegation:
- Cards -> Transactions
- Transactions -> Ledger

Ledger remains the only accounting engine.

## Module Structure

- cards.module.ts: Nest module wiring.
- controllers/card.controller.ts: API endpoints for lifecycle and card payments.
- services/card.service.ts: workflow orchestration.
- repositories/card.repository.ts: persistence abstraction (in-memory for now).
- policies/card.policy.ts: lifecycle and authorization policy checks.
- validators/card.validator.ts: PAN/CVV/PIN/amount validations.
- mappers/card.mapper.ts: API response mapping.
- events/card.events.ts: domain event contracts.

## Integration Boundaries

- AccountsModule: account existence and ownership checks.
- TransactionsModule: accounting-backed card authorization/capture/refund/reversal postings.
- LedgerModule: hold creation/release for authorization and settlement flow.

## Core Principles

- No duplicate ledger or transaction logic.
- No direct balance mutation in cards.
- Hold management reuses Ledger hold primitives.
- API responses never expose full PAN except demo-only reveal endpoint.
- Card security data exposed via tokenization/masking only.

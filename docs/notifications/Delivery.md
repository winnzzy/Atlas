# Notification Delivery

## Flow

1. Domain event mapped into NotificationContext.
2. Template resolved and rendered.
3. Notification persisted with source metadata.
4. Channel deliveries queued.
5. Providers execute delivery.
6. Status and audit events written.

## Supported States

- QUEUED
- PROCESSING
- DELIVERED
- READ
- FAILED
- EXPIRED
- CANCELLED

## Active Providers

- IN_APP provider abstraction
- EMAIL provider abstraction

## Provider Abstraction

Each provider implements:

- channel identifier
- provider name
- deliver(recipient, title, body)

## Reliability Guarantees

- Per-channel failures are captured with failure reason.
- Notification status resolves to DELIVERED when at least one channel succeeds.
- Notification status resolves to FAILED when all selected channels fail.
- Empty channel selection resolves to CANCELLED.

## Audit Events

Audit records are stored for each lifecycle transition with optional channel and reason context.

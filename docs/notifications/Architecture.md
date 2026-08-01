# Notification Platform Architecture

## Purpose

The Notification Platform is an event-driven downstream consumer of business domain events.

It provides multi-channel notification orchestration without introducing business logic or direct business data mutation.

## Design Principles

- Consume events only.
- Never mutate domain state in business modules.
- Never block business transaction flows on notification failures.
- Keep channels and providers pluggable.
- Keep template content externalized and versioned.

## Core Components

- NotificationsModule: composition root for controller, services, repository, mapper, validator, and policy.
- NotificationEventHandler: subscribes to domain events and maps them into notification contexts.
- NotificationService: orchestrates template resolution, preference evaluation, and delivery dispatch.
- NotificationPreferencesService: manages per-user category and channel preferences.
- NotificationTemplateService: resolves versioned templates and renders variables.
- NotificationDeliveryService: queues and executes delivery through active channel providers.
- NotificationRepository: persistence for notifications, deliveries, templates, preferences, and audit events.

## Channel Model

- Active channels: IN_APP, EMAIL.
- Ready channels: SMS, PUSH, WEBHOOK represented in enums and policies; activation is controlled by channel policy/provider registration.

## Boundaries

- Notifications read domain events and user contact data only.
- Notifications do not post ledger entries.
- Notifications do not create, update, or delete business entities.

## Delivery Lifecycle

- Notification created with QUEUED status.
- Delivery records progress through QUEUED and PROCESSING.
- Notification final state reflects aggregate outcome: DELIVERED, FAILED, READ, or CANCELLED.
- Every lifecycle transition is audited.

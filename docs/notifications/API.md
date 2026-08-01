# Notifications API

## Base Path

/api/notifications

## Endpoints

- GET /notifications
  - Search by recipient, channel, status, type, date range, and priority.
- GET /notifications/{id}
  - Fetch notification detail including deliveries and audit events.
- PATCH /notifications/{id}/read
  - Mark a notification as READ.
- PATCH /notifications/{id}/cancel
  - Mark a notification as CANCELLED.
- GET /notifications/preferences/{userId}
  - List user notification preferences.
- PATCH /notifications/preferences/{userId}
  - Update one preference tuple.
- GET /notifications/templates/catalog
  - List template catalog.
- POST /notifications/templates
  - Upsert template definition.
- POST /notifications/templates/preview
  - Render template preview with variables.

## Search Filters

- recipientId
- channel
- status
- type
- priority
- from
- to
- limit
- offset

## Security

Controller is annotated with bearer auth contract.

## Error Model

Service and validator errors surface as standard Nest HTTP exceptions.

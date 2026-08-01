# Notification Templates

## Capabilities

- Reusable templates keyed by code.
- Channel-aware variants.
- Localization through language key.
- Versioned template records.
- Runtime variable interpolation.
- Preview endpoint for rendered output.

## Template Model

- code
- name
- type
- channel
- language
- version
- subjectTemplate
- bodyTemplate
- variables
- isActive

## Validation Rules

- Template code must be lowercase with letters, numbers, dots, underscores, or dashes.
- Subject and body templates are required.
- MARKETING templates are restricted to EMAIL channel.

## Rendering

Template tokens use double-curly format.

Example: {{transactionId}}

Missing variables render as empty strings.

## Seeded Catalog

Default templates are ensured for IN_APP and EMAIL channels across supported domain event template codes.

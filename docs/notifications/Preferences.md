# Notification Preferences

## Scope

Preferences are per-user, per-notification-type, and per-channel.

## Preference Fields

- type
- channel
- enabled
- quietHoursStart
- quietHoursEnd
- timezone
- language

## Defaults

- MARKETING disabled by default.
- IN_APP and EMAIL enabled by default for non-marketing categories.
- SMS, PUSH, WEBHOOK disabled until channel activation.

## Quiet Hours

- Optional quiet hours are stored as HH:mm.
- Both start and end are required together.
- Non-urgent notifications are suppressed during quiet hours.
- URGENT notifications bypass quiet-hour suppression.

## Workflow

1. Load user preferences.
2. If none exist, create full default matrix.
3. Evaluate channel eligibility by type, enabled flag, and quiet-hour policy.
4. Select channels for delivery.

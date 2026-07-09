# Customer Profile Usage Guide

## Web routes

- `/profile`
- `/profile/preferences`
- `/profile/security`
- `/profile/activity`

All pages live under the dashboard app shell and currently use `MockCustomerProfileGateway` from `apps/web/src/features/customer-profile/gateway.ts`.

## Replacing the mock gateway later

1. Instantiate `ProfileApiClient` from `packages/api-client/src/profile/profile-client.ts`.
2. Replace the mock gateway implementation with an authenticated gateway that forwards requests to the API client.
3. Keep the page-level view components unchanged; they already depend on shared contracts instead of raw transport shapes.

## Reusable UI surfaces

- `ProfileAvatar`
- `VerificationBadge`
- `EditableProfileCard`
- `PreferenceCard`
- `SecurityTimeline`
- `DeviceCard`
- `SessionCard`
- `SettingsGroup`

These components are exported from `@atlas/banking-ui` and can be reused by future account, onboarding, or support features.
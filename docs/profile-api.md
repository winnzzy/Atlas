# Customer Profile API

## Endpoints

- `GET /api/v1/profile`: Returns the current customer profile.
- `PATCH /api/v1/profile`: Updates personal, contact, address, employment, and tax information.
- `GET /api/v1/profile/preferences`: Returns language, currency, notification, theme, and accessibility preferences.
- `PATCH /api/v1/profile/preferences`: Updates customer preferences.
- `GET /api/v1/profile/security`: Returns security controls, connected devices, sessions, and recent events.
- `PATCH /api/v1/profile/security`: Updates mutable security controls such as MFA state, login alerts, biometric unlock, and session timeout.
- `GET /api/v1/profile/activity`: Returns recent profile and security activity.

## OpenAPI

- Swagger UI remains available at `/api/docs`.
- Every profile endpoint is annotated in the controller with operation summaries and typed response DTOs.

## Auth boundary

- The current implementation intentionally does not require JWT or login.
- The controller resolves a customer id via `ProfileContextService`, which is the seam to replace when the Auth module is introduced.
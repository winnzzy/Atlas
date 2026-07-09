# Customer Profile Module

The Customer Profile module is Atlas milestone 7 and the first complete customer-facing vertical slice that spans shared contracts, API surface, reusable UI, and app pages.

## Scope

- Backend endpoints at `/api/v1/profile`, `/api/v1/profile/preferences`, `/api/v1/profile/security`, and `/api/v1/profile/activity`.
- Shared contracts in `packages/types/src/domain/profile.types.ts`.
- Reusable banking profile widgets in `packages/banking-ui/src/components`.
- Customer profile pages in `apps/web/src/app/(dashboard)/profile/**`.

## Backend design

- The module is implemented in `apps/backend/src/profile` with controller, service, repository, DTOs, Swagger response classes, and unit tests.
- Persistence reuses the existing Prisma `User`, `UserSetting`, `NotificationPreference`, `UserSession`, `LoginHistory`, `SecurityEvent`, and `KycDocument` models.
- Fields not yet normalized in Prisma, such as address and employment details, are stored under `User.metadata` so the feature can ship without a broad schema migration.
- `ProfileContextService` isolates the current mock authenticated customer id so auth can replace it later without changing controller or repository contracts.

## Frontend design

- The web app consumes a `MockCustomerProfileGateway` for now.
- The gateway boundary is intentionally shaped so it can switch to `ProfileApiClient` when auth and live fetch flows are introduced.
- Pages compose `@atlas/ui` primitives with `@atlas/banking-ui` profile-specific widgets.

## Validation

- Backend validation uses `class-validator` DTOs.
- Frontend fixtures and update shapes are validated with Zod in `apps/web/src/features/customer-profile/schemas.ts`.
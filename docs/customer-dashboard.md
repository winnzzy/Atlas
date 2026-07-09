# Customer Dashboard

The customer dashboard is the first full Atlas vertical slice. It ships as a route at `apps/web/src/app/(dashboard)/dashboard/page.tsx` and is backed entirely by typed fixtures in `apps/web/src/features/customer-dashboard/fixtures.ts`.

## What it includes

- Welcome header with greeting, customer placeholder, current date, and last login.
- Financial overview statistic cards for available balance, current balance, checking, savings, crypto, and net worth.
- Quick actions grid for transfer, deposit, withdraw, statements, cards, and crypto.
- Recent transactions table with client-side search plus filter and pagination placeholders.
- Recent crypto activity table.
- Cards, investment, loan, and notification summary widgets.

## Architecture

- Shared design primitives come from `@atlas/ui`; no base components are duplicated in the feature layer.
- Heavy interactive widgets are lazy loaded with `next/dynamic` to keep the initial dashboard bundle smaller.
- Transaction search uses `useDeferredValue`, `startTransition`, and `useMemo` to reduce unnecessary recomputation.
- Notifications are locally dismissible without requiring a backend.

## Accessibility

- Interactive controls use native buttons and inputs from the Atlas UI package.
- Tables include captions and maintain keyboard-friendly controls.
- Status and financial context are exposed as text, not color alone.

## Files

- `apps/web/src/features/customer-dashboard/dashboard-page-content.tsx`
- `apps/web/src/features/customer-dashboard/dashboard-widgets.tsx`
- `apps/web/src/features/customer-dashboard/recent-transactions-widget.tsx`
- `apps/web/src/features/customer-dashboard/notification-widget.tsx`
- `apps/web/src/features/customer-dashboard/fixtures.ts`
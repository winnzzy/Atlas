# Customer Dashboard Usage Guide

## Route usage

The dashboard page consumes a single typed fixture object:

```tsx
import { CustomerDashboardPage, customerDashboardData } from '@/features/customer-dashboard';

export default function DashboardPage() {
  return <CustomerDashboardPage data={customerDashboardData} />;
}
```

## Extending the dashboard

- Add or update fixture content in `apps/web/src/features/customer-dashboard/fixtures.ts`.
- Keep new widgets in the feature folder and continue composing them from `@atlas/ui` primitives.
- Preserve the lazy-loading boundary for interactive widgets such as large tables or notification feeds.

## Storybook stories

- `apps/web/src/features/customer-dashboard/dashboard-page.stories.tsx`
- `apps/web/src/features/customer-dashboard/dashboard-widgets.stories.tsx`

These stories avoid Storybook-specific type imports so they can live in the repo before the Storybook toolchain is wired.
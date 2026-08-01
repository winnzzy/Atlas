'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AdminShell,
  PageContainer,
  defaultAdminSidebarConfig,
  defaultProfileMenuItems,
  type BreadcrumbItem,
  type CommandItem,
} from '@atlas/ui';
import { AdminGlobalSearch } from '@/features/admin/components/global-search';

const currentAdmin = {
  id: 'admin-1',
  name: 'Sarah Mitchell',
  email: 'sarah.mitchell@atlasbank.com',
  initials: 'SM',
};

export default function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const activeHref = React.useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return '/admin';
    return `/admin/${segments[1]}`;
  }, [pathname]);

  const breadcrumbs = React.useMemo<readonly BreadcrumbItem[]>(() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return [];

    const items: BreadcrumbItem[] = [{ label: 'Admin', href: '/admin' }];
    if (segments.length >= 2) {
      const segment = segments[1] ?? 'dashboard';
      items.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: `/admin/${segment}`,
        isCurrent: segments.length === 2,
      });
    }

    if (segments.length >= 3) {
      const segment = segments[2] ?? '';
      items.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        isCurrent: true,
      });
    }

    return items;
  }, [pathname]);

  const commands = React.useMemo<readonly CommandItem[]>(
    () => [
      { id: 'cmd-admin-dashboard', label: 'Admin Dashboard', type: 'navigation', href: '/admin' },
      {
        id: 'cmd-admin-customers',
        label: 'Customers',
        type: 'navigation',
        href: '/admin/customers',
      },
      { id: 'cmd-admin-accounts', label: 'Accounts', type: 'navigation', href: '/admin/accounts' },
      { id: 'cmd-admin-cards', label: 'Cards', type: 'navigation', href: '/admin/cards' },
      {
        id: 'cmd-admin-transactions',
        label: 'Transactions',
        type: 'navigation',
        href: '/admin/transactions',
      },
      {
        id: 'cmd-admin-transfers',
        label: 'Transfers',
        type: 'navigation',
        href: '/admin/transfers',
      },
      {
        id: 'cmd-admin-investments',
        label: 'Investments',
        type: 'navigation',
        href: '/admin/investments',
      },
      {
        id: 'cmd-admin-notifications',
        label: 'Notifications',
        type: 'navigation',
        href: '/admin/notifications',
      },
      { id: 'cmd-admin-audit', label: 'Audit', type: 'navigation', href: '/admin/audit' },
      { id: 'cmd-admin-reports', label: 'Reports', type: 'navigation', href: '/admin/reports' },
      { id: 'cmd-admin-settings', label: 'Settings', type: 'navigation', href: '/admin/settings' },
    ],
    [],
  );

  return (
    <AdminShell
      sidebarConfig={defaultAdminSidebarConfig}
      user={currentAdmin}
      profileItems={defaultProfileMenuItems}
      breadcrumbs={breadcrumbs}
      commands={commands}
      activeHref={activeHref}
      environment="development"
      onNavigate={(href) => {
        router.push(href);
      }}
    >
      <PageContainer>
        <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border-default)] pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Enterprise Administration Console
          </p>
          <AdminGlobalSearch />
        </div>
        {children}
      </PageContainer>
    </AdminShell>
  );
}

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  AdminShell,
  PageContainer,
  defaultAdminSidebarConfig,
  defaultProfileMenuItems,
} from '@atlas/ui';

const mockAdmin = {
  id: 'admin-1',
  name: 'Sarah Mitchell',
  email: 'sarah.mitchell@atlasbank.com',
  initials: 'SM',
};

export default function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname();

  const activeHref = React.useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    // /admin -> /admin, /admin/customers/xxx -> /admin/customers
    if (segments.length <= 1) return '/admin';
    return `/admin/${segments[1]}`;
  }, [pathname]);

  return (
    <AdminShell
      sidebarConfig={defaultAdminSidebarConfig}
      user={mockAdmin}
      profileItems={defaultProfileMenuItems}
      activeHref={activeHref}
      environment="development"
      onNavigate={(href) => {
        window.location.href = href;
      }}
    >
      <PageContainer>{children}</PageContainer>
    </AdminShell>
  );
}

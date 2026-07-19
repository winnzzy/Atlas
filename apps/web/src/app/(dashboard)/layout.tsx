'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  DashboardShell,
  PageContainer,
  defaultDashboardSidebarConfig,
  defaultProfileMenuItems,
} from '@atlas/ui';

const mockUser = {
  id: '1',
  name: 'Jordan Parker',
  email: 'jordan.parker@atlasbank.com',
  initials: 'JP',
};

export default function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname();
  const activeHref = React.useMemo(() => {
    if (pathname.startsWith('/dashboard/profile/preferences'))
      return '/dashboard/profile/preferences';
    if (pathname.startsWith('/dashboard/profile/security')) return '/dashboard/profile/security';
    if (pathname.startsWith('/dashboard/profile/activity')) return '/dashboard/profile/activity';
    if (pathname.startsWith('/dashboard/profile')) return '/dashboard/profile';
    return pathname;
  }, [pathname]);

  return (
    <DashboardShell
      sidebarConfig={defaultDashboardSidebarConfig}
      user={mockUser}
      profileItems={defaultProfileMenuItems}
      activeHref={activeHref}
      environment="development"
      onNavigate={(href) => {
        window.location.href = href;
      }}
    >
      <PageContainer>{children}</PageContainer>
    </DashboardShell>
  );
}

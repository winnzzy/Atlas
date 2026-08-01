'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  DashboardShell,
  PageContainer,
  defaultDashboardSidebarConfig,
  defaultProfileMenuItems,
} from '@atlas/ui';
import { useAuth } from '@/components/providers/auth-provider';

export default function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const activeHref = React.useMemo(() => {
    if (pathname.startsWith('/dashboard/profile/preferences'))
      return '/dashboard/profile/preferences';
    if (pathname.startsWith('/dashboard/profile/security')) return '/dashboard/profile/security';
    if (pathname.startsWith('/dashboard/profile/activity')) return '/dashboard/profile/activity';
    if (pathname.startsWith('/dashboard/profile')) return '/dashboard/profile';
    return pathname;
  }, [pathname]);

  const profileItems = React.useMemo(
    () => [
      ...defaultProfileMenuItems,
      {
        id: 'logout',
        label: 'Sign out',
        variant: 'danger' as const,
        onClick: () => {
          void logout();
        },
      },
    ],
    [logout],
  );

  return (
    <DashboardShell
      sidebarConfig={defaultDashboardSidebarConfig}
      user={user ? { name: `${user.firstName} ${user.lastName}`, email: user.email, initials: user.initials, role: user.role } : undefined}
      profileItems={profileItems}
      activeHref={activeHref}
      environment="development"
      onNavigate={(href) => {
        router.push(href);
      }}
    >
      <PageContainer>{children}</PageContainer>
    </DashboardShell>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The admin sign-in page must render before authentication, so it renders
  // outside the guarded chrome. Every other /admin route requires an admin.
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

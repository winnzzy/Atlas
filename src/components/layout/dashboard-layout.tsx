'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from './header';
import { MobileNavigation } from './mobile-navigation';
import { Sidebar } from './sidebar';
import { PageContainer } from './page-container';
import { useAuth } from '@/providers/auth-provider';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, ready, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (window.location.pathname.startsWith('/admin') && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isAdmin, ready, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">
        Loading Atlas workspace…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <PageContainer>
        <div className="flex flex-col gap-5">
          <Header onToggleMobile={() => setMobileOpen((value) => !value)} />
          <MobileNavigation open={mobileOpen} />
          <div className="flex gap-6">
            <Sidebar />
            <div className="min-w-0 flex-1 space-y-6">{children}</div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

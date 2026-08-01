'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Badge, Button, Card, CardContent } from '@atlas/ui';
import { StatCard } from '@atlas/banking-ui';
import {
  Activity,
  ArrowLeftRight,
  Bell,
  Briefcase,
  CheckCircle2,
  CreditCard,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { AdminPage } from '@/features/admin/components/admin-page';
import { useAdminAnalytics, useAdminOverview, useAuditLogs } from '@/features/admin/hooks';

const healthTone: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  ok: 'success',
  degraded: 'warning',
  down: 'danger',
};

function toNumber(value: number | undefined): string {
  return (value ?? 0).toLocaleString();
}

function toUsd(value: number | undefined): string {
  return `$${(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function AdminDashboardPage(): React.JSX.Element {
  const router = useRouter();
  const overviewQuery = useAdminOverview();
  const analyticsQuery = useAdminAnalytics();
  const auditQuery = useAuditLogs({ limit: 8, offset: 0 });

  const overview = overviewQuery.data;
  const analytics = analyticsQuery.data;

  return (
    <AdminPage
      title="Enterprise Admin Dashboard"
      description="Operations, finance, compliance, and support command center"
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push('/admin/reports')}>
            Open Reports
          </Button>
          <Button size="sm" onClick={() => router.push('/admin/customers')}>
            Manage Customers
          </Button>
        </div>
      }
    >
      {overviewQuery.isError ? (
        <Alert variant="danger" title="Dashboard load failed">
          Unable to load dashboard overview from backend.
        </Alert>
      ) : null}

      <section className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border-default)] bg-[linear-gradient(135deg,var(--color-primary-600),var(--color-primary-700))] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              Control tower
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Command center for risk, operations, and growth
            </h2>
            <p className="mt-2 text-sm text-white/80">
              Executive-grade oversight with daily volume, approvals, and customer health in one
              view.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => router.push('/admin/transfers')}
            >
              Approvals
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => router.push('/admin/reports')}
            >
              Reports
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Customers"
          value={toNumber(overview?.totalCustomers)}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Accounts"
          value={toNumber(overview?.activeAccounts)}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          title="Daily Volume"
          value={toUsd(overview?.dailyVolume)}
          icon={<ArrowLeftRight className="h-5 w-5" />}
        />
        <StatCard
          title="Transfers"
          value={toNumber(overview?.totalTransfers)}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          title="Transactions"
          value={toNumber(analytics?.dailyKpis['transactionCount'])}
          icon={<ArrowLeftRight className="h-5 w-5" />}
        />
        <StatCard
          title="Card Volume"
          value={toNumber(overview?.totalCardTransactions)}
          icon={<CreditCard className="h-5 w-5" />}
        />
        <StatCard
          title="Investments"
          value={toNumber(overview?.totalInvestments)}
          icon={<Briefcase className="h-5 w-5" />}
        />
        <StatCard
          title="Notifications"
          value={toNumber(overview?.pendingNotifications)}
          icon={<Bell className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.8fr]">
        <Card
          variant="elevated"
          className="border-white/60 bg-[var(--color-bg-primary)] xl:col-span-1"
        >
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Recent Activity
              </h2>
              <Button size="sm" variant="ghost" onClick={() => router.push('/admin/audit')}>
                View Audit
              </Button>
            </div>
            <div className="space-y-2">
              {(auditQuery.data?.items ?? []).map((event, index) => (
                <div
                  key={`${String(event['id'] ?? index)}`}
                  className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-[var(--color-text-primary)]">
                      {String(event['action'] ?? 'event')}
                    </p>
                    <Badge variant="outline">{String(event['severity'] ?? 'INFO')}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {String(event['description'] ?? '')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card variant="elevated" className="border-white/60 bg-[var(--color-bg-primary)]">
            <CardContent className="p-4">
              <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
                System Health
              </h2>
              <div className="space-y-2">
                {Object.entries(overview?.systemHealth ?? {}).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 py-2.5"
                  >
                    <p className="text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                      {key}
                    </p>
                    <Badge
                      variant={
                        typeof value === 'string' ? (healthTone[value] ?? 'default') : 'default'
                      }
                    >
                      {String(value)}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => router.push('/admin/transfers')}>
                  Pending Approvals
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/admin/notifications')}
                >
                  Queue
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push('/admin/settings')}>
                  Settings
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push('/admin/reports')}>
                  Growth
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            <Card variant="elevated" className="border-white/60 bg-[var(--color-bg-primary)]">
              <CardContent className="p-4">
                <p className="text-xs text-[var(--color-text-secondary)]">Monthly Volume</p>
                <p className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">
                  {toUsd(overview?.monthlyVolume)}
                </p>
              </CardContent>
            </Card>
            <Card variant="elevated" className="border-white/60 bg-[var(--color-bg-primary)]">
              <CardContent className="p-4">
                <p className="text-xs text-[var(--color-text-secondary)]">Revenue</p>
                <p className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">
                  {toUsd(overview?.revenue)}
                </p>
              </CardContent>
            </Card>
            <Card variant="elevated" className="border-white/60 bg-[var(--color-bg-primary)]">
              <CardContent className="p-4">
                <p className="text-xs text-[var(--color-text-secondary)]">Pending Approvals</p>
                <p className="mt-1 flex items-center gap-2 text-xl font-semibold text-[var(--color-text-primary)]">
                  {toNumber(overview?.pendingApprovals)}
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}

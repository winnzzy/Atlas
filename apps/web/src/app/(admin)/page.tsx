'use client';

import React from 'react';
import { StatCard, AmountDisplay, ProgressBar } from '@atlas/banking-ui';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@atlas/ui';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ArrowLeftRight,
  CreditCard,
  Bitcoin,
  Landmark,
  Wallet,
} from 'lucide-react';
import {
  mockDashboardMetrics,
  mockSystemHealth,
  mockSystemAlerts,
  revenueChartData,
  transactionVolumeData,
} from '@/features/admin/fixtures';

const statusColor: Record<string, string> = {
  operational: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  degraded: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  down: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const alertColor: Record<string, string> = {
  info: 'border-l-blue-500',
  warning: 'border-l-amber-500',
  critical: 'border-l-red-500',
};

export default function AdminOverviewPage() {
  const m = mockDashboardMetrics;
  const healthEntries = Object.entries(mockSystemHealth).filter(
    ([k]) => !['uptime', 'responseTime', 'errorRate'].includes(k),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Operations Overview
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Real-time platform health and key performance indicators
        </p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={m.totalUsers.toLocaleString()}
          trend={m.usersChange > 0 ? 'up' : 'down'}
          trendValue={`${m.usersChange}%`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Transaction Volume"
          value={`$${(m.transactionVolume / 1_000_000).toFixed(1)}M`}
          trend={m.transactionVolumeChange > 0 ? 'up' : 'down'}
          trendValue={`${m.transactionVolumeChange}%`}
          icon={<ArrowLeftRight className="h-5 w-5" />}
        />
        <StatCard
          title="Revenue"
          value={`$${(m.totalRevenue / 1_000_000).toFixed(2)}M`}
          trend={m.revenueChange > 0 ? 'up' : 'down'}
          trendValue={`${m.revenueChange}%`}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Active Cards"
          value={m.activeCards.toLocaleString()}
          trend={m.cardsChange > 0 ? 'up' : 'down'}
          trendValue={`${m.cardsChange}%`}
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-[var(--color-text-secondary)]">Total Deposits</span>
            </div>
            <div className="flex items-baseline justify-between">
              <AmountDisplay money={{ amount: m.totalDeposits, currency: 'USD' }} size="sm" />
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                {m.depositsChange}%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <ArrowLeftRight className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-[var(--color-text-secondary)]">Total Withdrawals</span>
            </div>
            <div className="flex items-baseline justify-between">
              <AmountDisplay money={{ amount: m.totalWithdrawals, currency: 'USD' }} size="sm" />
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                {m.withdrawalsChange}%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Bitcoin className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-[var(--color-text-secondary)]">Crypto AUM</span>
            </div>
            <div className="flex items-baseline justify-between">
              <AmountDisplay
                money={{ amount: m.cryptoAssetsUnderManagement, currency: 'USD' }}
                size="sm"
              />
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                {m.cryptoChange}%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Landmark className="h-5 w-5 text-indigo-500" />
              <span className="text-sm text-[var(--color-text-secondary)]">Loan Portfolio</span>
            </div>
            <div className="flex items-baseline justify-between">
              <AmountDisplay money={{ amount: m.loanPortfolio, currency: 'USD' }} size="sm" />
              <span className="flex items-center gap-1 text-xs text-red-600">
                <TrendingDown className="h-3 w-3" />
                {Math.abs(m.loanChange)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue & Deposits Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenueChartData.map((d) => (
                <div key={d.month} className="flex items-center gap-4">
                  <span className="w-8 text-xs text-[var(--color-text-tertiary)]">{d.month}</span>
                  <div className="flex-1 space-y-1">
                    <ProgressBar
                      value={(d.revenue / 300000) * 100}
                      size="sm"
                      color="default"
                      label={`$${(d.revenue / 1000).toFixed(0)}K`}
                    />
                    <ProgressBar
                      value={(d.deposits / 2000000) * 100}
                      size="sm"
                      color="success"
                      label={`$${(d.deposits / 1000000).toFixed(1)}M`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-4 text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Uptime: <strong>{mockSystemHealth.uptime}%</strong>
              </span>
              <span className="text-[var(--color-text-secondary)]">
                Latency: <strong>{mockSystemHealth.responseTime}ms</strong>
              </span>
            </div>
            <div className="space-y-3">
              {healthEntries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm capitalize text-[var(--color-text-secondary)]">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <Badge className={statusColor[value as string]}>{value as string}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Volume + Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Transaction Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactionVolumeData.map((d) => (
                <div key={d.day} className="flex items-center gap-4">
                  <span className="w-8 text-xs text-[var(--color-text-tertiary)]">{d.day}</span>
                  <div className="flex-1">
                    <ProgressBar value={(d.count / 1700) * 100} size="sm" color="default" />
                  </div>
                  <span className="w-20 text-right text-xs text-[var(--color-text-secondary)]">
                    {d.count.toLocaleString()} txns
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockSystemAlerts.map((a) => (
                <div key={a.id} className={`border-l-4 pl-3 py-2 ${alertColor[a.severity]}`}>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        a.severity === 'critical'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : a.severity === 'warning'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }
                    >
                      {a.severity}
                    </Badge>
                    {a.resolved && (
                      <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        resolved
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-primary)]">{a.message}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
                    {a.source} &middot; {new Date(a.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

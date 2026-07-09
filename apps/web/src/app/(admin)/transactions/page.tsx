'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Input } from '@atlas/ui';
import { AmountDisplay, StatCard } from '@atlas/banking-ui';
import {
  ArrowLeftRight,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { mockTransactions } from '@/features/admin/fixtures';

const statusColor: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  reversed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const statusIcon: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="h-3.5 w-3.5" />,
  pending: <Clock className="h-3.5 w-3.5" />,
  failed: <XCircle className="h-3.5 w-3.5" />,
  reversed: <RotateCcw className="h-3.5 w-3.5" />,
  processing: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
};

export default function TransactionsPage() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filtered = React.useMemo(() => {
    return mockTransactions.filter((t) => {
      const matchSearch =
        !search ||
        `${t.customerName} ${t.description} ${t.reference}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const totalVolume = mockTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const completedCount = mockTransactions.filter((t) => t.status === 'completed').length;
  const pendingCount = mockTransactions.filter(
    (t) => t.status === 'pending' || t.status === 'processing',
  ).length;
  const failedCount = mockTransactions.filter((t) => t.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Transaction Monitoring
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Real-time transaction feed and monitoring
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Volume"
          value={`$${(totalVolume / 1_000).toFixed(0)}K`}
          icon={<ArrowLeftRight className="h-5 w-5" />}
        />
        <StatCard
          title="Completed"
          value={completedCount.toString()}
          trend="up"
          trendValue="12%"
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <StatCard
          title="Pending"
          value={pendingCount.toString()}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="Failed"
          value={failedCount.toString()}
          icon={<XCircle className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Transactions</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="reversed">Reversed</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Date
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Customer
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Type
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Description
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Counterparty
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Status
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Reference
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--color-text-secondary)]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <td className="py-3 text-[var(--color-text-secondary)] whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-medium text-[var(--color-text-primary)]">
                      {t.customerName}
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className="capitalize">
                        {t.type.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 text-[var(--color-text-primary)] max-w-[200px] truncate">
                      {t.description}
                    </td>
                    <td className="py-3 text-[var(--color-text-secondary)]">{t.counterparty}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[t.status]}`}
                      >
                        {statusIcon[t.status]}
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs font-mono text-[var(--color-text-tertiary)]">
                      {t.reference}
                    </td>
                    <td className="py-3 text-right">
                      <AmountDisplay
                        money={{ amount: t.amount, currency: 'USD' }}
                        size="sm"
                        showSign
                        colorize
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

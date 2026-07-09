'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Input } from '@atlas/ui';
import { AmountDisplay, StatCard } from '@atlas/banking-ui';
import { Landmark, Search, CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import { mockAccounts } from '@/features/admin/fixtures';

const statusColor: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  frozen: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function AccountsPage() {
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');

  const filtered = React.useMemo(() => {
    return mockAccounts.filter((a) => {
      const matchSearch =
        !search ||
        `${a.customerName} ${a.accountNumber} ${a.type}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || a.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [search, typeFilter]);

  const totalBalance = mockAccounts.reduce((sum, a) => sum + a.balance, 0);
  const activeAccounts = mockAccounts.filter((a) => a.status === 'active').length;
  const frozenAccounts = mockAccounts.filter((a) => a.status === 'frozen').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Account Management
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Monitor and manage all customer accounts
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Accounts"
          value={mockAccounts.length.toString()}
          icon={<Landmark className="h-5 w-5" />}
        />
        <StatCard
          title="Active"
          value={activeAccounts.toString()}
          trend="up"
          trendValue="3.1%"
          icon={<CreditCard className="h-5 w-5" />}
        />
        <StatCard
          title="Total Balance"
          value={`$${(totalBalance / 1_000).toFixed(0)}K`}
          trend="up"
          trendValue="8.7%"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Frozen"
          value={frozenAccounts.toString()}
          icon={<AlertCircle className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Accounts</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <Input
                  placeholder="Search accounts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="business">Business</option>
                <option value="investment">Investment</option>
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
                    Account
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Customer
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Type
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Status
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--color-text-secondary)]">
                    Balance
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--color-text-secondary)]">
                    Available
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <td className="py-3">
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {a.accountNumber}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        Routing: {a.routingNumber}
                      </p>
                    </td>
                    <td className="py-3 text-[var(--color-text-primary)]">{a.customerName}</td>
                    <td className="py-3">
                      <Badge variant="outline" className="capitalize">
                        {a.type}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge className={statusColor[a.status]}>{a.status}</Badge>
                    </td>
                    <td className="py-3 text-right">
                      <AmountDisplay money={{ amount: a.balance, currency: 'USD' }} size="sm" />
                    </td>
                    <td className="py-3 text-right">
                      <AmountDisplay
                        money={{ amount: a.availableBalance, currency: 'USD' }}
                        size="sm"
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

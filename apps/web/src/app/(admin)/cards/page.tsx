'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Input } from '@atlas/ui';
import { StatCard } from '@atlas/banking-ui';
import { CreditCard, Search, Snowflake, CheckCircle } from 'lucide-react';
import { mockCards } from '@/features/admin/fixtures';

const statusColor: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  frozen: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const brandColor: Record<string, string> = {
  visa: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  mastercard: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  amex: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
};

export default function CardsPage() {
  const [search, setSearch] = React.useState('');

  const filtered = React.useMemo(() => {
    if (!search) return mockCards;
    return mockCards.filter((c) =>
      `${c.customerName} ${c.last4} ${c.brand}`.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search]);

  const activeCards = mockCards.filter((c) => c.status === 'active').length;
  const frozenCards = mockCards.filter((c) => c.status === 'frozen').length;
  const totalSpent = mockCards.reduce((sum, c) => sum + c.spent, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Card Management
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Manage physical and virtual cards
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Cards"
          value={mockCards.length.toString()}
          icon={<CreditCard className="h-5 w-5" />}
        />
        <StatCard
          title="Active"
          value={activeCards.toString()}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <StatCard
          title="Frozen"
          value={frozenCards.toString()}
          icon={<Snowflake className="h-5 w-5" />}
        />
        <StatCard
          title="Total Spent"
          value={`$${(totalSpent / 1_000).toFixed(1)}K`}
          trend="up"
          trendValue="8.3%"
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Cards</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
              <Input
                placeholder="Search cards..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider opacity-70">
                    Atlas {c.type === 'virtual' ? 'Virtual' : ''} Card
                  </span>
                  <Badge className={brandColor[c.brand]}>{c.brand}</Badge>
                </div>
                <p className="mt-6 font-mono text-lg tracking-widest">•••• •••• •••• {c.last4}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div>
                    <p className="opacity-70 text-xs">Cardholder</p>
                    <p className="font-medium">{c.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="opacity-70 text-xs">Expires</p>
                    <p className="font-medium">
                      {new Date(c.expiresAt).toLocaleDateString('en-US', {
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Badge className={statusColor[c.status]}>{c.status}</Badge>
                  <div className="text-right text-xs opacity-70">
                    <p>
                      ${c.spent.toLocaleString()} / ${c.limit.toLocaleString()} spent
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

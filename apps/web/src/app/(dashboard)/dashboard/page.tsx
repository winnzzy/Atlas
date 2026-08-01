'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRightLeft,
  BadgeCheck,
  BriefcaseBusiness,
  CreditCard,
  Landmark,
  Wallet2,
} from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@atlas/ui';
import { QueryState } from '@/features/admin/components/query-state';
import { DataTable, type DataTableColumn } from '@/features/admin/components/data-table';
import {
  useCustomerAccounts,
  useCustomerCards,
  useCustomerNotifications,
  useCustomerPortfolio,
  useCustomerTransactions,
} from '@/features/customer/hooks';

type GenericRow = Record<string, unknown>;

const pickItems = (value: unknown): Array<GenericRow> => {
  if (Array.isArray(value)) {
    return value.filter(
      (entry): entry is GenericRow => Boolean(entry) && typeof entry === 'object',
    );
  }
  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as Record<string, unknown>)['items'])
  ) {
    return ((value as Record<string, unknown>)['items'] as unknown[]).filter(
      (entry): entry is GenericRow => Boolean(entry) && typeof entry === 'object',
    );
  }
  return [];
};

export default function DashboardPage(): React.JSX.Element {
  const router = useRouter();
  const accountsQuery = useCustomerAccounts({ page: 1, limit: 6 });
  const transactionsQuery = useCustomerTransactions({ limit: 8 });
  const cardsQuery = useCustomerCards({ limit: 6 });
  const notificationsQuery = useCustomerNotifications({ limit: 6 });
  const portfolioQuery = useCustomerPortfolio();

  const accountRows = pickItems(accountsQuery.data);
  const transactionRows = pickItems(transactionsQuery.data);
  const cardRows = pickItems(cardsQuery.data);
  const notificationRows = pickItems(notificationsQuery.data);

  const balanceTotal = accountRows.reduce(
    (sum, row) => sum + Number(row['currentBalance'] ?? 0),
    0,
  );
  const pendingTransactions = transactionRows.filter(
    (row) => String(row['status']) === 'PENDING',
  ).length;
  const activeCards = cardRows.filter((row) => String(row['status']).includes('ACTIVE')).length;

  const txColumns: Array<DataTableColumn<GenericRow>> = [
    {
      id: 'reference',
      label: 'Reference',
      accessor: (row) => String(row['reference'] ?? row['id'] ?? ''),
      render: (row) => (
        <span className="font-mono text-[11px]">
          {String(row['reference'] ?? row['id'] ?? '-')}
        </span>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      accessor: (row) => String(row['type'] ?? ''),
      render: (row) => String(row['type'] ?? '-'),
    },
    {
      id: 'amount',
      label: 'Amount',
      align: 'right',
      accessor: (row) => Number(row['amount'] ?? 0),
      render: (row) => `${row['amount'] ?? '-'} ${row['currency'] ?? ''}`,
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (row) => String(row['status'] ?? ''),
      render: (row) => (
        <Badge variant={String(row['status']) === 'COMPLETED' ? 'success' : 'warning'}>
          {String(row['status'] ?? '-')}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <section className="overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border-default)] bg-[linear-gradient(135deg,var(--color-primary-600),var(--color-primary-700))] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90">
              <BadgeCheck className="h-3.5 w-3.5" />
              Prime client workspace
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Customer Dashboard</h1>
            <p className="mt-2 text-sm text-white/80">
              Live visibility into balances, transfers, cards, and portfolio positioning.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => router.push('/dashboard/transfers')}
            >
              New Transfer
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => router.push('/dashboard/cards')}
            >
              Manage Cards
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => router.push('/dashboard/profile')}
            >
              Profile
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-[var(--radius-lg)] border border-white/15 bg-white/10 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">Total balance</p>
            <p className="mt-2 text-2xl font-semibold">{balanceTotal.toLocaleString()}</p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-white/15 bg-white/10 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">Pending</p>
            <p className="mt-2 text-2xl font-semibold">{pendingTransactions}</p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-white/15 bg-white/10 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">Active cards</p>
            <p className="mt-2 text-2xl font-semibold">{activeCards}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetricCard
          title="Accounts"
          value={accountRows.length}
          icon={<Wallet2 className="h-4 w-4" />}
        />
        <SummaryMetricCard
          title="Transfers"
          value={pendingTransactions}
          icon={<ArrowRightLeft className="h-4 w-4" />}
        />
        <SummaryMetricCard
          title="Cards"
          value={activeCards}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <SummaryMetricCard
          title="Portfolio"
          value={notificationRows.length}
          icon={<BriefcaseBusiness className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <Card variant="elevated" className="border-white/60 bg-[var(--color-bg-primary)]">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Recent Transactions</CardTitle>
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-bg-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
                <Landmark className="h-3.5 w-3.5" />
                Clearing in real time
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <QueryState
              isLoading={transactionsQuery.isLoading}
              isError={transactionsQuery.isError}
              onRetry={() => void transactionsQuery.refetch()}
            >
              <DataTable rows={transactionRows} columns={txColumns} pageSize={6} />
            </QueryState>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card variant="elevated" className="border-white/60 bg-[var(--color-bg-primary)]">
            <CardHeader>
              <CardTitle className="text-base">Portfolio Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryState
                isLoading={portfolioQuery.isLoading}
                isError={portfolioQuery.isError}
                onRetry={() => void portfolioQuery.refetch()}
              >
                <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
                  <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
                    <span>Value</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {String((portfolioQuery.data ?? {})['totalValue'] ?? '-')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
                    <span>Cash Balance</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {String((portfolioQuery.data ?? {})['cashBalance'] ?? '-')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
                    <span>Positions</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {Array.isArray((portfolioQuery.data ?? {})['positions'])
                        ? ((portfolioQuery.data ?? {})['positions'] as unknown[]).length
                        : 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
                    <span>Notifications</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {notificationRows.length}
                    </span>
                  </div>
                </div>
              </QueryState>
            </CardContent>
          </Card>

          <Card variant="elevated" className="border-white/60 bg-[var(--color-bg-primary)]">
            <CardHeader>
              <CardTitle className="text-base">Service Center</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => router.push('/dashboard/cards')}
              >
                Cards & controls
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => router.push('/dashboard/profile')}
              >
                Profile & security
                <BadgeCheck className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryMetricCard({
  title,
  value,
  icon,
}: {
  readonly title: string;
  readonly value: number | string;
  readonly icon: React.ReactNode;
}) {
  return (
    <Card variant="elevated" className="border-white/60 bg-[var(--color-bg-primary)]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          <div className="rounded-full bg-[var(--color-bg-secondary)] p-2 text-[var(--color-text-secondary)]">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-[var(--color-text-primary)]">{value}</p>
      </CardContent>
    </Card>
  );
}

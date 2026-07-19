'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            Customer Dashboard
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Live account, card, transfer, investment, and alert visibility.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push('/dashboard/transfers')}>
            New Transfer
          </Button>
          <Button size="sm" variant="outline" onClick={() => router.push('/dashboard/cards')}>
            Manage Cards
          </Button>
          <Button size="sm" variant="outline" onClick={() => router.push('/dashboard/profile')}>
            Profile
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{accountRows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{balanceTotal.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pendingTransactions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{activeCards}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Transactions</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Portfolio Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState
              isLoading={portfolioQuery.isLoading}
              isError={portfolioQuery.isError}
              onRetry={() => void portfolioQuery.refetch()}
            >
              <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                <p>Value: {String((portfolioQuery.data ?? {})['totalValue'] ?? '-')}</p>
                <p>Cash Balance: {String((portfolioQuery.data ?? {})['cashBalance'] ?? '-')}</p>
                <p>
                  Positions:{' '}
                  {Array.isArray((portfolioQuery.data ?? {})['positions'])
                    ? ((portfolioQuery.data ?? {})['positions'] as unknown[]).length
                    : 0}
                </p>
                <p>Notifications: {notificationRows.length}</p>
              </div>
            </QueryState>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

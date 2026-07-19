'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@atlas/ui';
import { QueryState } from '@/features/admin/components/query-state';
import { DataTable, type DataTableColumn } from '@/features/admin/components/data-table';
import {
  useCustomerAccount,
  useCustomerAccountHolds,
  useCustomerAccountStatements,
  useCustomerAccountTransactions,
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

export default function DashboardAccountDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  const accountQuery = useCustomerAccount(id);
  const transactionsQuery = useCustomerAccountTransactions(id, { limit: 50 });
  const statementsQuery = useCustomerAccountStatements(id, { limit: 20 });
  const holdsQuery = useCustomerAccountHolds(id);

  const txColumns: Array<DataTableColumn<GenericRow>> = [
    {
      id: 'reference',
      label: 'Reference',
      accessor: (row) => String(row['reference'] ?? ''),
      render: (row) => String(row['reference'] ?? '-'),
    },
    {
      id: 'type',
      label: 'Type',
      accessor: (row) => String(row['type'] ?? ''),
      render: (row) => String(row['type'] ?? '-'),
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (row) => String(row['status'] ?? ''),
      render: (row) => String(row['status'] ?? '-'),
    },
    {
      id: 'amount',
      label: 'Amount',
      align: 'right',
      accessor: (row) => Number(row['amount'] ?? 0),
      render: (row) => `${row['amount'] ?? '-'} ${row['currency'] ?? ''}`,
    },
  ];

  const statementColumns: Array<DataTableColumn<GenericRow>> = [
    {
      id: 'id',
      label: 'Statement',
      accessor: (row) => String(row['id'] ?? ''),
      render: (row) => String(row['id'] ?? '-'),
    },
    {
      id: 'periodStart',
      label: 'From',
      accessor: (row) => String(row['periodStart'] ?? ''),
      render: (row) => String(row['periodStart'] ?? '-'),
    },
    {
      id: 'periodEnd',
      label: 'To',
      accessor: (row) => String(row['periodEnd'] ?? ''),
      render: (row) => String(row['periodEnd'] ?? '-'),
    },
  ];

  const holdColumns: Array<DataTableColumn<GenericRow>> = [
    {
      id: 'id',
      label: 'Hold ID',
      accessor: (row) => String(row['id'] ?? ''),
      render: (row) => String(row['id'] ?? '-'),
    },
    {
      id: 'reason',
      label: 'Reason',
      accessor: (row) => String(row['reason'] ?? ''),
      render: (row) => String(row['reason'] ?? '-'),
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (row) => String(row['status'] ?? ''),
      render: (row) => String(row['status'] ?? '-'),
    },
    {
      id: 'amount',
      label: 'Amount',
      align: 'right',
      accessor: (row) => Number(row['amount'] ?? 0),
      render: (row) => String(row['amount'] ?? '-'),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Account Detail</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryState
            isLoading={accountQuery.isLoading}
            isError={accountQuery.isError}
            onRetry={() => void accountQuery.refetch()}
          >
            <pre className="overflow-auto text-xs text-[var(--color-text-secondary)]">
              {JSON.stringify(accountQuery.data ?? {}, null, 2)}
            </pre>
          </QueryState>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryState
            isLoading={transactionsQuery.isLoading}
            isError={transactionsQuery.isError}
            onRetry={() => void transactionsQuery.refetch()}
          >
            <DataTable rows={pickItems(transactionsQuery.data)} columns={txColumns} pageSize={10} />
          </QueryState>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statements</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState
              isLoading={statementsQuery.isLoading}
              isError={statementsQuery.isError}
              onRetry={() => void statementsQuery.refetch()}
            >
              <DataTable
                rows={pickItems(statementsQuery.data)}
                columns={statementColumns}
                pageSize={8}
              />
            </QueryState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Holds</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryState
              isLoading={holdsQuery.isLoading}
              isError={holdsQuery.isError}
              onRetry={() => void holdsQuery.refetch()}
            >
              <DataTable rows={pickItems(holdsQuery.data)} columns={holdColumns} pageSize={8} />
            </QueryState>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

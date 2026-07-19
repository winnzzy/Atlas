'use client';

import Link from 'next/link';
import React from 'react';
import { Badge, Input } from '@atlas/ui';
import { QueryState } from '@/features/admin/components/query-state';
import { DataTable, type DataTableColumn } from '@/features/admin/components/data-table';
import { useDebouncedValue } from '@/features/admin/hooks/use-debounced-value';
import { useCustomerAccounts } from '@/features/customer/hooks';

type AccountRow = Record<string, unknown>;

const pickItems = (value: unknown): Array<AccountRow> => {
  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as Record<string, unknown>)['items'])
  ) {
    return ((value as Record<string, unknown>)['items'] as unknown[]).filter(
      (entry): entry is AccountRow => Boolean(entry) && typeof entry === 'object',
    );
  }
  return [];
};

export default function DashboardAccountsPage(): React.JSX.Element {
  const [statusInput, setStatusInput] = React.useState('');
  const [typeInput, setTypeInput] = React.useState('');
  const status = useDebouncedValue(statusInput, 300);
  const type = useDebouncedValue(typeInput, 300);

  const accountsQuery = useCustomerAccounts({ status, type, page: 1, limit: 50 });
  const rows = pickItems(accountsQuery.data);

  const columns: Array<DataTableColumn<AccountRow>> = [
    {
      id: 'id',
      label: 'Account ID',
      accessor: (row) => String(row['id'] ?? ''),
      render: (row) => {
        const id = String(row['id'] ?? '');
        return (
          <Link
            className="font-mono text-[11px] text-[var(--color-text-primary)]"
            href={`/dashboard/account/${id}`}
          >
            {id || '-'}
          </Link>
        );
      },
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
      render: (row) => (
        <Badge variant={String(row['status']) === 'ACTIVE' ? 'success' : 'warning'}>
          {String(row['status'] ?? '-')}
        </Badge>
      ),
    },
    {
      id: 'availableBalance',
      label: 'Available',
      align: 'right',
      accessor: (row) => Number(row['availableBalance'] ?? 0),
      render: (row) => String(row['availableBalance'] ?? '-'),
    },
    {
      id: 'currentBalance',
      label: 'Current',
      align: 'right',
      accessor: (row) => Number(row['currentBalance'] ?? 0),
      render: (row) => String(row['currentBalance'] ?? '-'),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Accounts</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Server-side account listing with filters and direct detail routing.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={typeInput}
          onChange={(event) => setTypeInput(event.target.value)}
          className="h-9 w-48 text-xs"
          placeholder="Type"
          aria-label="Filter account type"
        />
        <Input
          value={statusInput}
          onChange={(event) => setStatusInput(event.target.value)}
          className="h-9 w-48 text-xs"
          placeholder="Status"
          aria-label="Filter account status"
        />
      </div>

      <QueryState
        isLoading={accountsQuery.isLoading}
        isError={accountsQuery.isError}
        onRetry={() => void accountsQuery.refetch()}
      >
        <DataTable rows={rows} columns={columns} pageSize={20} />
      </QueryState>
    </div>
  );
}

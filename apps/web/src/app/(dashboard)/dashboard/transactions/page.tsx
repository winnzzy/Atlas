'use client';

import React from 'react';
import { Badge, Button, Input } from '@atlas/ui';
import { QueryState } from '@/features/admin/components/query-state';
import { DataTable, type DataTableColumn } from '@/features/admin/components/data-table';
import { useDebouncedValue } from '@/features/admin/hooks/use-debounced-value';
import { useCustomerMutations, useCustomerTransactions } from '@/features/customer/hooks';

type TxRow = Record<string, unknown>;

const pickItems = (value: unknown): Array<TxRow> => {
  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as Record<string, unknown>)['items'])
  ) {
    return ((value as Record<string, unknown>)['items'] as unknown[]).filter(
      (entry): entry is TxRow => Boolean(entry) && typeof entry === 'object',
    );
  }
  return [];
};

export default function DashboardTransactionsPage(): React.JSX.Element {
  const [referenceInput, setReferenceInput] = React.useState('');
  const [statusInput, setStatusInput] = React.useState('');
  const [typeInput, setTypeInput] = React.useState('');

  const reference = useDebouncedValue(referenceInput, 300);
  const status = useDebouncedValue(statusInput, 300);
  const type = useDebouncedValue(typeInput, 300);

  const transactionsQuery = useCustomerTransactions({ reference, status, type, limit: 100 });
  const { cancelTransfer } = useCustomerMutations();

  const columns: Array<DataTableColumn<TxRow>> = [
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
      id: 'status',
      label: 'Status',
      accessor: (row) => String(row['status'] ?? ''),
      render: (row) => (
        <Badge variant={String(row['status']) === 'COMPLETED' ? 'success' : 'warning'}>
          {String(row['status'] ?? '-')}
        </Badge>
      ),
    },
    {
      id: 'amount',
      label: 'Amount',
      align: 'right',
      accessor: (row) => Number(row['amount'] ?? 0),
      render: (row) => `${row['amount'] ?? '-'} ${row['currency'] ?? ''}`,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            cancelTransfer.mutate({ id: String(row['id'] ?? ''), reason: 'user cancellation' })
          }
        >
          Cancel Linked Transfer
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Transactions</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Server-side transaction search with debounced filters.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={referenceInput}
          onChange={(event) => setReferenceInput(event.target.value)}
          className="h-9 w-64 text-xs"
          placeholder="Reference"
          aria-label="Filter by transaction reference"
        />
        <Input
          value={statusInput}
          onChange={(event) => setStatusInput(event.target.value)}
          className="h-9 w-40 text-xs"
          placeholder="Status"
          aria-label="Filter by status"
        />
        <Input
          value={typeInput}
          onChange={(event) => setTypeInput(event.target.value)}
          className="h-9 w-40 text-xs"
          placeholder="Type"
          aria-label="Filter by type"
        />
      </div>

      <QueryState
        isLoading={transactionsQuery.isLoading}
        isError={transactionsQuery.isError}
        onRetry={() => void transactionsQuery.refetch()}
      >
        <DataTable rows={pickItems(transactionsQuery.data)} columns={columns} pageSize={20} />
      </QueryState>
    </div>
  );
}

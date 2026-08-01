'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Input } from '@atlas/ui';
import { Search } from 'lucide-react';
import { adminApi } from '@/features/admin/api';
import { AdminPage } from '@/features/admin/components/admin-page';
import { DataTable, type DataTableColumn } from '@/features/admin/components/data-table';
import { DetailDrawer } from '@/features/admin/components/detail-drawer';
import { QueryState } from '@/features/admin/components/query-state';
import { useAdminMutation, useAdminTransactions } from '@/features/admin/hooks';
import { useDebouncedValue } from '@/features/admin/hooks/use-debounced-value';
import type { TransactionSearchResult } from '@/features/admin/types';

type TransactionRow = TransactionSearchResult['items'][number];

export default function TransactionsPage(): React.JSX.Element {
  const [referenceInput, setReferenceInput] = React.useState('');
  const [statusInput, setStatusInput] = React.useState('');
  const [typeInput, setTypeInput] = React.useState('');
  const [selected, setSelected] = React.useState<TransactionRow | null>(null);
  const [ledgerAccountId, setLedgerAccountId] = React.useState('');

  const reference = useDebouncedValue(referenceInput, 350);
  const status = useDebouncedValue(statusInput, 350);
  const type = useDebouncedValue(typeInput, 350);

  const transactionQuery = useAdminTransactions({ reference, status, type, limit: 100 });
  const lookupQuery = useQuery({
    queryKey: ['admin', 'transaction-reference', reference],
    queryFn: () => adminApi.getTransactionByReference(reference),
    enabled: reference.length > 2,
    retry: 2,
  });
  const ledgerQuery = useQuery({
    queryKey: ['admin', 'ledger-view', ledgerAccountId],
    queryFn: () => adminApi.getLedgerView(ledgerAccountId),
    enabled: ledgerAccountId.length > 0,
    retry: 2,
  });
  const { reverseTransaction } = useAdminMutation();

  const columns: Array<DataTableColumn<TransactionRow>> = [
    {
      id: 'reference',
      label: 'Reference',
      sortable: true,
      accessor: (row) => row.reference,
      render: (row) => (
        <button
          type="button"
          className="font-mono text-[11px] text-[var(--color-text-primary)]"
          onClick={() => setSelected(row)}
        >
          {row.reference}
        </button>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      sortable: true,
      accessor: (row) => row.type,
      render: (row) => row.type,
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      accessor: (row) => row.status,
      render: (row) => (
        <Badge variant={row.status === 'COMPLETED' ? 'success' : 'warning'}>{row.status}</Badge>
      ),
    },
    {
      id: 'accountId',
      label: 'Account',
      sortable: true,
      accessor: (row) => row.accountId,
      render: (row) => row.accountId,
    },
    {
      id: 'amount',
      label: 'Amount',
      sortable: true,
      accessor: (row) => Number(row.amount),
      render: (row) => `${row.amount} ${row.currency}`,
    },
    {
      id: 'createdAt',
      label: 'Created',
      sortable: true,
      accessor: (row) => new Date(row.createdAt).getTime(),
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="inline-flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => setLedgerAccountId(row.accountId)}>
            Ledger
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              reverseTransaction.mutate({ transactionId: row.id, reason: 'admin reversal' })
            }
          >
            Reverse
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPage
      title="Transactions"
      description="Search, reference lookup, and ledger-linked transaction controls"
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
            <Input
              value={referenceInput}
              onChange={(event) => setReferenceInput(event.target.value)}
              className="h-9 w-72 pl-8 text-xs"
              placeholder="Reference lookup"
            />
          </div>
          <Input
            value={statusInput}
            onChange={(event) => setStatusInput(event.target.value)}
            className="h-9 w-32 text-xs"
            placeholder="Status"
          />
          <Input
            value={typeInput}
            onChange={(event) => setTypeInput(event.target.value)}
            className="h-9 w-40 text-xs"
            placeholder="Type"
          />
        </div>
      }
    >
      <QueryState
        isLoading={transactionQuery.isLoading}
        isError={transactionQuery.isError}
        onRetry={() => void transactionQuery.refetch()}
      >
        <DataTable rows={transactionQuery.data?.items ?? []} columns={columns} pageSize={20} />
      </QueryState>

      <DetailDrawer
        open={Boolean(selected)}
        title="Transaction Details"
        onClose={() => setSelected(null)}
        sections={[
          { title: 'Transaction', value: selected ?? {} },
          { title: 'Reference Lookup', value: lookupQuery.data ?? {} },
          { title: 'Ledger View', value: ledgerQuery.data ?? [] },
        ]}
      />
    </AdminPage>
  );
}

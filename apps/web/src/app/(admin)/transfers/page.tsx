'use client';

import React from 'react';
import { Badge, Button, Input } from '@atlas/ui';
import { AdminPage } from '@/features/admin/components/admin-page';
import { DataTable, type DataTableColumn } from '@/features/admin/components/data-table';
import { DetailDrawer } from '@/features/admin/components/detail-drawer';
import { QueryState } from '@/features/admin/components/query-state';
import { useAdminMutation, useAdminTransfers } from '@/features/admin/hooks';
import { useDebouncedValue } from '@/features/admin/hooks/use-debounced-value';
import type { TransferSearchResult } from '@/features/admin/types';

type TransferRow = TransferSearchResult['items'][number];

export default function TransfersPage(): React.JSX.Element {
  const [statusInput, setStatusInput] = React.useState('');
  const [typeInput, setTypeInput] = React.useState('');
  const [selected, setSelected] = React.useState<TransferRow | null>(null);

  const status = useDebouncedValue(statusInput, 350);
  const type = useDebouncedValue(typeInput, 350);

  const transfersQuery = useAdminTransfers({ status, type, limit: 100 });
  const { retryTransfer, cancelTransfer } = useAdminMutation();

  const columns: Array<DataTableColumn<TransferRow>> = [
    {
      id: 'reference',
      label: 'Reference',
      sortable: true,
      accessor: (row) => row.reference ?? row.id,
      render: (row) => (
        <button
          type="button"
          className="font-mono text-[11px] text-[var(--color-text-primary)]"
          onClick={() => setSelected(row)}
        >
          {row.reference ?? row.id}
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
      id: 'sourceAccountId',
      label: 'Source Account',
      accessor: (row) => row.sourceAccountId,
      render: (row) => row.sourceAccountId,
    },
    {
      id: 'beneficiary',
      label: 'Beneficiary',
      accessor: (row) => row.beneficiaryName ?? row.swiftCode ?? '',
      render: (row) => row.beneficiaryName ?? row.swiftCode ?? '-',
    },
    {
      id: 'amount',
      label: 'Amount',
      sortable: true,
      accessor: (row) => Number(row.amount),
      render: (row) => `${row.amount} ${row.currency}`,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="inline-flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => retryTransfer.mutate(row.id)}>
            Retry
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              cancelTransfer.mutate({ transferId: row.id, reason: 'admin cancellation' })
            }
          >
            Cancel
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPage
      title="Transfers"
      description="ACH, Wire, and SWIFT transfer operations"
      actions={
        <div className="flex items-center gap-2">
          <Input
            value={typeInput}
            onChange={(event) => setTypeInput(event.target.value)}
            className="h-9 w-36 text-xs"
            placeholder="Type"
          />
          <Input
            value={statusInput}
            onChange={(event) => setStatusInput(event.target.value)}
            className="h-9 w-36 text-xs"
            placeholder="Status"
          />
        </div>
      }
    >
      <QueryState
        isLoading={transfersQuery.isLoading}
        isError={transfersQuery.isError}
        onRetry={() => void transfersQuery.refetch()}
      >
        <DataTable rows={transfersQuery.data?.items ?? []} columns={columns} pageSize={20} />
      </QueryState>

      <DetailDrawer
        open={Boolean(selected)}
        title="Transfer Details"
        onClose={() => setSelected(null)}
        sections={[{ title: 'Transfer', value: selected ?? {} }]}
      />
    </AdminPage>
  );
}

'use client';

import React from 'react';
import { Badge, Button, Input } from '@atlas/ui';
import { QueryState } from '@/features/admin/components/query-state';
import { DataTable, type DataTableColumn } from '@/features/admin/components/data-table';
import { DetailDrawer } from '@/features/admin/components/detail-drawer';
import { useDebouncedValue } from '@/features/admin/hooks/use-debounced-value';
import {
  useCustomerCardTransactions,
  useCustomerCards,
  useCustomerMutations,
} from '@/features/customer/hooks';

type CardRow = Record<string, unknown>;

const pickItems = (value: unknown): Array<CardRow> => {
  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as Record<string, unknown>)['items'])
  ) {
    return ((value as Record<string, unknown>)['items'] as unknown[]).filter(
      (entry): entry is CardRow => Boolean(entry) && typeof entry === 'object',
    );
  }
  return [];
};

export default function DashboardCardsPage(): React.JSX.Element {
  const [statusInput, setStatusInput] = React.useState('');
  const [selectedCardId, setSelectedCardId] = React.useState<string | null>(null);

  const status = useDebouncedValue(statusInput, 300);
  const cardsQuery = useCustomerCards({ status, limit: 100 });
  const { freezeCard, unfreezeCard } = useCustomerMutations();
  const cardTransactionsQuery = useCustomerCardTransactions(selectedCardId ?? '', { limit: 30 });

  const columns: Array<DataTableColumn<CardRow>> = [
    {
      id: 'id',
      label: 'Card',
      accessor: (row) => String(row['id'] ?? ''),
      render: (row) => (
        <button
          type="button"
          className="font-mono text-[11px] text-[var(--color-text-primary)]"
          onClick={() => setSelectedCardId(String(row['id'] ?? ''))}
        >
          {String(row['id'] ?? '-')}
        </button>
      ),
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
      id: 'cardType',
      label: 'Type',
      accessor: (row) => String(row['cardType'] ?? row['type'] ?? ''),
      render: (row) => String(row['cardType'] ?? row['type'] ?? '-'),
    },
    {
      id: 'last4',
      label: 'Masked',
      accessor: (row) => String(row['last4'] ?? ''),
      render: (row) => `****${String(row['last4'] ?? '----')}`,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="inline-flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              freezeCard.mutate({ id: String(row['id'] ?? ''), reason: 'user request' })
            }
          >
            Freeze
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => unfreezeCard.mutate(String(row['id'] ?? ''))}
          >
            Unfreeze
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Cards</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Card controls, status visibility, and card transaction drill-down.
        </p>
      </div>

      <Input
        value={statusInput}
        onChange={(event) => setStatusInput(event.target.value)}
        className="h-9 w-44 text-xs"
        placeholder="Status"
        aria-label="Filter card status"
      />

      <QueryState
        isLoading={cardsQuery.isLoading}
        isError={cardsQuery.isError}
        onRetry={() => void cardsQuery.refetch()}
      >
        <DataTable rows={pickItems(cardsQuery.data)} columns={columns} pageSize={20} />
      </QueryState>

      <DetailDrawer
        open={Boolean(selectedCardId)}
        title="Card Transactions"
        onClose={() => setSelectedCardId(null)}
        sections={[
          { title: 'Card ID', value: selectedCardId ?? '' },
          { title: 'Transactions', value: pickItems(cardTransactionsQuery.data) },
        ]}
      />
    </div>
  );
}

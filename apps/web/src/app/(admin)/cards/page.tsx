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
import { useAdminMutation } from '@/features/admin/hooks';
import { useDebouncedValue } from '@/features/admin/hooks/use-debounced-value';

type CardRow = {
  readonly id: string;
  readonly holderId: string;
  readonly masked: string;
  readonly type: string;
  readonly network: string;
  readonly status: string;
  readonly isDemo: boolean;
  readonly raw: Record<string, unknown>;
};

export default function CardsPage(): React.JSX.Element {
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<CardRow | null>(null);
  const [revealResult, setRevealResult] = React.useState<Record<string, unknown> | null>(null);
  const debouncedSearch = useDebouncedValue(search, 350);
  const { applyCardAction } = useAdminMutation();

  const cardsQuery = useQuery({
    queryKey: ['admin', 'cards-table', debouncedSearch],
    queryFn: async () => {
      const customers = await adminApi.getCustomers({ q: debouncedSearch, limit: 20, offset: 0 });
      const cardLists = await Promise.all(
        customers.items.map(async (customer) => {
          const cards = await adminApi.getCustomerCards(customer.id);
          return cards.map((item) => ({
            id: String(item['id']),
            holderId: customer.id,
            masked: `****${String(item['lastFour'] ?? '----')}`,
            type: String(item['type'] ?? 'UNKNOWN'),
            network: String(item['network'] ?? 'UNKNOWN'),
            status: String(item['status'] ?? 'UNKNOWN'),
            isDemo: Boolean(item['isDemo'] ?? false),
            raw: item,
          }));
        }),
      );

      return cardLists.flat();
    },
    retry: 2,
  });

  const columns: Array<DataTableColumn<CardRow>> = [
    {
      id: 'card',
      label: 'Card',
      sortable: true,
      accessor: (row) => row.masked,
      render: (row) => (
        <button
          type="button"
          className="font-medium text-[var(--color-text-primary)]"
          onClick={() => setSelected(row)}
        >
          {row.masked}
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
      id: 'network',
      label: 'Network',
      sortable: true,
      accessor: (row) => row.network,
      render: (row) => row.network,
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      accessor: (row) => row.status,
      render: (row) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'warning'}>{row.status}</Badge>
      ),
    },
    {
      id: 'holder',
      label: 'Holder',
      accessor: (row) => row.holderId,
      render: (row) => row.holderId,
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
            onClick={() => applyCardAction.mutate({ cardId: row.id, action: 'FREEZE' })}
          >
            Freeze
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyCardAction.mutate({ cardId: row.id, action: 'REPLACE' })}
          >
            Replace
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyCardAction.mutate({ cardId: row.id, action: 'CANCEL' })}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!row.isDemo}
            onClick={() => {
              if (!row.isDemo) return;
              applyCardAction
                .mutateAsync({ cardId: row.id, action: 'REVEAL_PAN' })
                .then((result) => setRevealResult(result as Record<string, unknown>));
            }}
          >
            Reveal PAN
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPage
      title="Cards"
      description="Card issuance lifecycle controls and risk operations"
      actions={
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 w-72 pl-8 text-xs"
            placeholder="Search by customer"
          />
        </div>
      }
    >
      <QueryState
        isLoading={cardsQuery.isLoading}
        isError={cardsQuery.isError}
        onRetry={() => void cardsQuery.refetch()}
      >
        <DataTable rows={cardsQuery.data ?? []} columns={columns} pageSize={20} />
      </QueryState>

      <DetailDrawer
        open={Boolean(selected)}
        title="Card Details"
        onClose={() => setSelected(null)}
        sections={[
          { title: 'Card', value: selected?.raw ?? {} },
          { title: 'Reveal Result', value: revealResult ?? {} },
        ]}
      />
    </AdminPage>
  );
}

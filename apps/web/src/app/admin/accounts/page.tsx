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

type AccountRow = {
  readonly id: string;
  readonly accountNumber: string;
  readonly type: string;
  readonly status: string;
  readonly currency: string;
  readonly ownerId: string;
  readonly raw: Record<string, unknown>;
};

export default function AccountsPage(): React.JSX.Element {
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState<AccountRow | null>(null);
  const debouncedSearch = useDebouncedValue(search, 350);
  const { applyAccountAction } = useAdminMutation();

  const rowsQuery = useQuery({
    queryKey: ['admin', 'accounts-table', debouncedSearch],
    queryFn: async () => {
      const customers = await adminApi.getCustomers({ q: debouncedSearch, limit: 20, offset: 0 });
      const accountLists = await Promise.all(
        customers.items.map(async (customer) => {
          const accounts = await adminApi.getCustomerAccounts(customer.id);
          return accounts.map((item) => ({
            id: String(item['id']),
            accountNumber: String(item['accountNumber'] ?? item['name'] ?? ''),
            type: String(item['type'] ?? item['accountType'] ?? ''),
            status: String(item['status'] ?? 'UNKNOWN'),
            currency: String(item['currency'] ?? 'USD'),
            ownerId: customer.id,
            raw: item,
          }));
        }),
      );

      return accountLists.flat();
    },
    retry: 2,
  });

  const columns: Array<DataTableColumn<AccountRow>> = [
    {
      id: 'account',
      label: 'Account',
      sortable: true,
      accessor: (row) => row.accountNumber,
      render: (row) => (
        <button
          type="button"
          className="font-medium text-[var(--color-text-primary)]"
          onClick={() => setSelected(row)}
        >
          {row.accountNumber}
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
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'warning'}>{row.status}</Badge>
      ),
    },
    {
      id: 'currency',
      label: 'Currency',
      accessor: (row) => row.currency,
      render: (row) => row.currency,
    },
    { id: 'owner', label: 'Owner', accessor: (row) => row.ownerId, render: (row) => row.ownerId },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="inline-flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyAccountAction.mutate({ accountId: row.id, action: 'FREEZE' })}
          >
            Freeze
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyAccountAction.mutate({ accountId: row.id, action: 'UNFREEZE' })}
          >
            Unfreeze
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyAccountAction.mutate({ accountId: row.id, action: 'LOCK' })}
          >
            Lock
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyAccountAction.mutate({ accountId: row.id, action: 'UNLOCK' })}
          >
            Unlock
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyAccountAction.mutate({ accountId: row.id, action: 'CLOSE' })}
          >
            Close
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyAccountAction.mutate({ accountId: row.id, action: 'ARCHIVE' })}
          >
            Archive
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPage
      title="Accounts"
      description="Operational controls for account lifecycle and status"
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
        isLoading={rowsQuery.isLoading}
        isError={rowsQuery.isError}
        onRetry={() => void rowsQuery.refetch()}
      >
        <DataTable rows={rowsQuery.data ?? []} columns={columns} pageSize={20} />
      </QueryState>

      <DetailDrawer
        open={Boolean(selected)}
        title="Account Details"
        onClose={() => setSelected(null)}
        sections={[{ title: 'Account', value: selected?.raw ?? {} }]}
      />
    </AdminPage>
  );
}

'use client';

import React from 'react';
import { Badge, Button, Input } from '@atlas/ui';
import { Search } from 'lucide-react';
import { AdminPage } from '@/features/admin/components/admin-page';
import { DataTable, type DataTableColumn } from '@/features/admin/components/data-table';
import { DetailDrawer } from '@/features/admin/components/detail-drawer';
import { QueryState } from '@/features/admin/components/query-state';
import { useAdminCustomers, useAdminMutation, useCustomerProfile } from '@/features/admin/hooks';
import { useDebouncedValue } from '@/features/admin/hooks/use-debounced-value';
import type { CustomerListItem } from '@/features/admin/types';

const PAGE_SIZE = 50;

export default function CustomersPage(): React.JSX.Element {
  const [search, setSearch] = React.useState('');
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 350);

  const customersQuery = useAdminCustomers(debouncedSearch, PAGE_SIZE, 0);
  const profileQuery = useCustomerProfile(selectedCustomerId);
  const { applyCustomerAction } = useAdminMutation();

  const columns: Array<DataTableColumn<CustomerListItem>> = [
    {
      id: 'name',
      label: 'Customer',
      sortable: true,
      accessor: (row) => `${row.firstName} ${row.lastName}`,
      render: (row) => (
        <button
          type="button"
          className="font-medium text-[var(--color-text-primary)]"
          onClick={() => setSelectedCustomerId(row.id)}
        >
          {row.firstName} {row.lastName}
        </button>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      sortable: true,
      accessor: (row) => row.email,
      render: (row) => <span className="text-[var(--color-text-secondary)]">{row.email}</span>,
    },
    {
      id: 'phone',
      label: 'Phone',
      accessor: (row) => row.phone ?? '',
      render: (row) => (
        <span className="text-[var(--color-text-secondary)]">{row.phone ?? '-'}</span>
      ),
    },
    {
      id: 'kyc',
      label: 'KYC',
      accessor: (row) => row.kycStatus ?? '',
      render: (row) => <Badge variant="outline">{row.kycStatus ?? 'UNKNOWN'}</Badge>,
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
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            applyCustomerAction.mutate({
              userId: row.id,
              action: row.status === 'ACTIVE' ? 'SUSPEND' : 'REACTIVATE',
            });
          }}
        >
          {row.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
        </Button>
      ),
    },
  ];

  return (
    <AdminPage
      title="Customers"
      description="Search, filter, and operate on customer records"
      actions={
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 w-80 pl-8 text-xs"
            placeholder="Search customer by name, email, phone"
          />
        </div>
      }
    >
      <QueryState
        isLoading={customersQuery.isLoading}
        isError={customersQuery.isError}
        onRetry={() => void customersQuery.refetch()}
      >
        <DataTable rows={customersQuery.data?.items ?? []} columns={columns} pageSize={20} />
      </QueryState>

      <DetailDrawer
        open={Boolean(selectedCustomerId)}
        title="Customer Details"
        onClose={() => setSelectedCustomerId(null)}
        sections={[
          { title: 'Profile', value: profileQuery.data?.['profile'] ?? {} },
          { title: 'Accounts', value: profileQuery.data?.['accounts'] ?? [] },
          { title: 'Cards', value: profileQuery.data?.['cards'] ?? [] },
          { title: 'Investments', value: profileQuery.data?.['investments'] ?? [] },
          { title: 'Recent Activity', value: profileQuery.data?.['transactions'] ?? [] },
          { title: 'Notifications', value: profileQuery.data?.['notifications'] ?? [] },
        ]}
      />
    </AdminPage>
  );
}

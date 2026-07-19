'use client';

import React from 'react';
import { Badge, Button, Input } from '@atlas/ui';
import { QueryState } from '@/features/admin/components/query-state';
import { DataTable, type DataTableColumn } from '@/features/admin/components/data-table';
import { useDebouncedValue } from '@/features/admin/hooks/use-debounced-value';
import { useCustomerMutations, useCustomerNotifications } from '@/features/customer/hooks';

type NotificationRow = Record<string, unknown>;

const pickItems = (value: unknown): Array<NotificationRow> => {
  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as Record<string, unknown>)['items'])
  ) {
    return ((value as Record<string, unknown>)['items'] as unknown[]).filter(
      (entry): entry is NotificationRow => Boolean(entry) && typeof entry === 'object',
    );
  }
  return [];
};

export default function DashboardNotificationsPage(): React.JSX.Element {
  const [statusInput, setStatusInput] = React.useState('');
  const [channelInput, setChannelInput] = React.useState('');

  const status = useDebouncedValue(statusInput, 300);
  const channel = useDebouncedValue(channelInput, 300);

  const notificationsQuery = useCustomerNotifications({ status, channel, limit: 100 });
  const { markNotificationRead } = useCustomerMutations();

  const columns: Array<DataTableColumn<NotificationRow>> = [
    {
      id: 'id',
      label: 'ID',
      accessor: (row) => String(row['id'] ?? ''),
      render: (row) => <span className="font-mono text-[11px]">{String(row['id'] ?? '-')}</span>,
    },
    {
      id: 'channel',
      label: 'Channel',
      accessor: (row) => String(row['channel'] ?? ''),
      render: (row) => String(row['channel'] ?? '-'),
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (row) => String(row['status'] ?? ''),
      render: (row) => (
        <Badge variant={String(row['status']).includes('READ') ? 'success' : 'warning'}>
          {String(row['status'] ?? '-')}
        </Badge>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      accessor: (row) => String(row['type'] ?? ''),
      render: (row) => String(row['type'] ?? '-'),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => markNotificationRead.mutate(String(row['id'] ?? ''))}
        >
          Mark Read
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Notifications</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Server-side notification stream with read actions and status filters.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={channelInput}
          onChange={(event) => setChannelInput(event.target.value)}
          className="h-9 w-44 text-xs"
          placeholder="Channel"
          aria-label="Filter notification channel"
        />
        <Input
          value={statusInput}
          onChange={(event) => setStatusInput(event.target.value)}
          className="h-9 w-44 text-xs"
          placeholder="Status"
          aria-label="Filter notification status"
        />
      </div>

      <QueryState
        isLoading={notificationsQuery.isLoading}
        isError={notificationsQuery.isError}
        onRetry={() => void notificationsQuery.refetch()}
      >
        <DataTable rows={pickItems(notificationsQuery.data)} columns={columns} pageSize={20} />
      </QueryState>
    </div>
  );
}

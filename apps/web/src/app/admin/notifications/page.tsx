'use client';

import React from 'react';
import { Badge, Button, Input } from '@atlas/ui';
import { AdminPage } from '@/features/admin/components/admin-page';
import { DataTable, type DataTableColumn } from '@/features/admin/components/data-table';
import { DetailDrawer } from '@/features/admin/components/detail-drawer';
import { QueryState } from '@/features/admin/components/query-state';
import { useAdminMutation, useNotificationQueue } from '@/features/admin/hooks';
import { useDebouncedValue } from '@/features/admin/hooks/use-debounced-value';
import type { NotificationQueueResponse } from '@/features/admin/types';

type NotificationRow = NotificationQueueResponse['items'][number];

export default function NotificationsPage(): React.JSX.Element {
  const [statusInput, setStatusInput] = React.useState('');
  const [channelInput, setChannelInput] = React.useState('');
  const [selected, setSelected] = React.useState<NotificationRow | null>(null);

  const status = useDebouncedValue(statusInput, 350);
  const channel = useDebouncedValue(channelInput, 350);

  const queueQuery = useNotificationQueue({ status, channel, limit: 100 });
  const { retryNotification } = useAdminMutation();

  const columns: Array<DataTableColumn<NotificationRow>> = [
    {
      id: 'id',
      label: 'ID',
      sortable: true,
      accessor: (row) => row.id,
      render: (row) => (
        <button
          type="button"
          className="font-mono text-[11px] text-[var(--color-text-primary)]"
          onClick={() => setSelected(row)}
        >
          {row.id}
        </button>
      ),
    },
    {
      id: 'recipientId',
      label: 'Recipient',
      sortable: true,
      accessor: (row) => row.recipientId,
      render: (row) => row.recipientId,
    },
    {
      id: 'type',
      label: 'Type',
      sortable: true,
      accessor: (row) => row.type,
      render: (row) => row.type,
    },
    {
      id: 'channel',
      label: 'Channel',
      sortable: true,
      accessor: (row) => row.channel,
      render: (row) => row.channel,
    },
    {
      id: 'status',
      label: 'Status',
      sortable: true,
      accessor: (row) => row.status,
      render: (row) => (
        <Badge variant={row.status === 'SENT' ? 'success' : 'warning'}>{row.status}</Badge>
      ),
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
        <Button
          size="sm"
          variant="outline"
          disabled={row.status !== 'FAILED'}
          onClick={() => retryNotification.mutate(row.id)}
        >
          Retry
        </Button>
      ),
    },
  ];

  return (
    <AdminPage
      title="Notifications"
      description="Queue monitoring, failed delivery management, and retry controls"
      actions={
        <div className="flex items-center gap-2">
          <Input
            value={channelInput}
            onChange={(event) => setChannelInput(event.target.value)}
            className="h-9 w-40 text-xs"
            placeholder="Channel"
          />
          <Input
            value={statusInput}
            onChange={(event) => setStatusInput(event.target.value)}
            className="h-9 w-40 text-xs"
            placeholder="Status"
          />
        </div>
      }
    >
      <QueryState
        isLoading={queueQuery.isLoading}
        isError={queueQuery.isError}
        onRetry={() => void queueQuery.refetch()}
      >
        <DataTable rows={queueQuery.data?.items ?? []} columns={columns} pageSize={20} />
      </QueryState>

      <DetailDrawer
        open={Boolean(selected)}
        title="Notification Details"
        onClose={() => setSelected(null)}
        sections={[{ title: 'Notification', value: selected ?? {} }]}
      />
    </AdminPage>
  );
}

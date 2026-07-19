'use client';

import React from 'react';
import { Badge, Input } from '@atlas/ui';
import { AdminPage } from '@/features/admin/components/admin-page';
import { DataTable, type DataTableColumn } from '@/features/admin/components/data-table';
import { DetailDrawer } from '@/features/admin/components/detail-drawer';
import { QueryState } from '@/features/admin/components/query-state';
import { useAuditLogs } from '@/features/admin/hooks';
import { useDebouncedValue } from '@/features/admin/hooks/use-debounced-value';
import type { AdminAuditResponse } from '@/features/admin/types';

type AuditRow = AdminAuditResponse['items'][number];

export default function AuditPage(): React.JSX.Element {
  const [actorInput, setActorInput] = React.useState('');
  const [actionInput, setActionInput] = React.useState('');
  const [selected, setSelected] = React.useState<AuditRow | null>(null);

  const actor = useDebouncedValue(actorInput, 350);
  const action = useDebouncedValue(actionInput, 350);

  const logsQuery = useAuditLogs({ actor, action, limit: 100 });

  const readString = (row: AuditRow, key: string): string => {
    const value = row[key];
    return typeof value === 'string' ? value : '-';
  };

  const readTimestamp = (row: AuditRow, key: string): number => {
    const value = row[key];
    if (typeof value !== 'string') return 0;
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const columns: Array<DataTableColumn<AuditRow>> = [
    {
      id: 'id',
      label: 'ID',
      sortable: true,
      accessor: (row) => readString(row, 'id'),
      render: (row) => (
        <button
          type="button"
          className="font-mono text-[11px] text-[var(--color-text-primary)]"
          onClick={() => setSelected(row)}
        >
          {readString(row, 'id')}
        </button>
      ),
    },
    {
      id: 'actor',
      label: 'Actor',
      sortable: true,
      accessor: (row) => readString(row, 'actor'),
      render: (row) => readString(row, 'actor'),
    },
    {
      id: 'action',
      label: 'Action',
      sortable: true,
      accessor: (row) => readString(row, 'action'),
      render: (row) => readString(row, 'action'),
    },
    {
      id: 'severity',
      label: 'Severity',
      sortable: true,
      accessor: (row) => readString(row, 'severity'),
      render: (row) => {
        const severity = readString(row, 'severity');
        return <Badge variant={severity === 'HIGH' ? 'warning' : 'secondary'}>{severity}</Badge>;
      },
    },
    {
      id: 'createdAt',
      label: 'Created',
      sortable: true,
      accessor: (row) => readTimestamp(row, 'createdAt'),
      render: (row) => {
        const timestamp = readTimestamp(row, 'createdAt');
        return timestamp > 0 ? new Date(timestamp).toLocaleString() : '-';
      },
    },
  ];

  return (
    <AdminPage
      title="Audit"
      description="Security, admin action timeline, and compliance visibility"
      actions={
        <div className="flex items-center gap-2">
          <Input
            value={actorInput}
            onChange={(event) => setActorInput(event.target.value)}
            className="h-9 w-52 text-xs"
            placeholder="Actor"
          />
          <Input
            value={actionInput}
            onChange={(event) => setActionInput(event.target.value)}
            className="h-9 w-52 text-xs"
            placeholder="Action"
          />
        </div>
      }
    >
      <QueryState
        isLoading={logsQuery.isLoading}
        isError={logsQuery.isError}
        onRetry={() => void logsQuery.refetch()}
      >
        <DataTable rows={logsQuery.data?.items ?? []} columns={columns} pageSize={20} />
      </QueryState>

      <DetailDrawer
        open={Boolean(selected)}
        title="Audit Event"
        onClose={() => setSelected(null)}
        sections={[{ title: 'Event', value: selected ?? {} }]}
      />
    </AdminPage>
  );
}

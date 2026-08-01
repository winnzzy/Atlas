'use client';

import React from 'react';
import { Button } from '@atlas/ui';
import { AdminPage } from '@/features/admin/components/admin-page';
import { DataTable, type DataTableColumn } from '@/features/admin/components/data-table';
import { QueryState } from '@/features/admin/components/query-state';
import { useAdminReport } from '@/features/admin/hooks';

type ReportRow = Record<string, unknown>;

const REPORT_TYPES = [
  'daily-financial-summary',
  'suspicious-transactions',
  'transfer-failures',
  'liquidity-breaches',
] as const;

export default function ReportsPage(): React.JSX.Element {
  const [reportType, setReportType] =
    React.useState<(typeof REPORT_TYPES)[number]>('daily-financial-summary');
  const [dateFrom, setDateFrom] = React.useState(() =>
    new Date(Date.now() - 86400000 * 7).toISOString().slice(0, 10),
  );
  const [dateTo, setDateTo] = React.useState(() => new Date().toISOString().slice(0, 10));

  const reportQuery = useAdminReport(reportType, dateFrom, dateTo);

  const rows = React.useMemo<Array<ReportRow>>(() => {
    const result = reportQuery.data;
    if (!result || !Array.isArray(result.rows)) {
      return [];
    }
    return result.rows.map((row) => {
      if (row && typeof row === 'object') {
        return row as ReportRow;
      }
      return { value: row };
    });
  }, [reportQuery.data]);

  const columns = React.useMemo<Array<DataTableColumn<ReportRow>>>(() => {
    const keys = rows.length > 0 ? Object.keys(rows[0] ?? {}) : ['value'];
    return keys.map((key) => ({
      id: key,
      label: key,
      accessor: (row) => {
        const value = row[key];
        return typeof value === 'string' || typeof value === 'number'
          ? value
          : JSON.stringify(value ?? null);
      },
      render: (row) => {
        const value = row[key];
        if (typeof value === 'string' || typeof value === 'number') {
          return String(value);
        }
        return <span className="font-mono text-[11px]">{JSON.stringify(value ?? null)}</span>;
      },
    }));
  }, [rows]);

  return (
    <AdminPage
      title="Reports"
      description="Operational and risk reporting with export-ready datasets"
      actions={
        <div className="flex items-center gap-2">
          {REPORT_TYPES.map((type) => (
            <Button
              key={type}
              size="sm"
              variant={type === reportType ? 'primary' : 'outline'}
              onClick={() => setReportType(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      }
    >
      <div className="mb-3 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
        <label className="flex items-center gap-2">
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-8 rounded-md border border-[var(--color-border-primary)] bg-transparent px-2 text-xs"
          />
        </label>
        <label className="flex items-center gap-2">
          To
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-8 rounded-md border border-[var(--color-border-primary)] bg-transparent px-2 text-xs"
          />
        </label>
      </div>

      <QueryState
        isLoading={reportQuery.isLoading}
        isError={reportQuery.isError}
        onRetry={() => void reportQuery.refetch()}
      >
        <DataTable rows={rows} columns={columns} pageSize={20} />
      </QueryState>
    </AdminPage>
  );
}

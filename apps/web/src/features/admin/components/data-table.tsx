import React from 'react';
import { Button, Checkbox } from '@atlas/ui';

export type DataTableColumn<T> = {
  readonly id: string;
  readonly label: string;
  readonly render: (row: T) => React.ReactNode;
  readonly accessor?: (row: T) => string | number;
  readonly sortable?: boolean;
  readonly defaultVisible?: boolean;
  readonly align?: 'left' | 'right';
};

export type DataTableProps<T> = {
  readonly rows: readonly T[];
  readonly columns: readonly DataTableColumn<T>[];
  readonly pageSize?: number;
  readonly stickyTopClassName?: string;
};

export function DataTable<T>({
  rows,
  columns,
  pageSize = 20,
  stickyTopClassName = 'top-0',
}: DataTableProps<T>): React.JSX.Element {
  const [sort, setSort] = React.useState<{ id: string; direction: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = React.useState(0);
  const [visibleMap, setVisibleMap] = React.useState<Record<string, boolean>>(() => {
    return Object.fromEntries(columns.map((column) => [column.id, column.defaultVisible ?? true]));
  });

  React.useEffect(() => {
    setPage(0);
  }, [rows.length]);

  const visibleColumns = columns.filter((column) => visibleMap[column.id] !== false);

  const sortedRows = React.useMemo(() => {
    if (!sort) return [...rows];
    const column = columns.find((item) => item.id === sort.id);
    if (!column || !column.accessor) return [...rows];
    const accessor = column.accessor;

    return [...rows].sort((a, b) => {
      const aValue = accessor(a);
      const bValue = accessor(b);
      if (aValue === bValue) return 0;
      const result = aValue > bValue ? 1 : -1;
      return sort.direction === 'asc' ? result : -result;
    });
  }, [rows, columns, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const pagedRows = sortedRows.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <details className="text-xs">
          <summary className="cursor-pointer text-[var(--color-text-secondary)]">Columns</summary>
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-md border border-[var(--color-border-default)] p-2">
            {columns.map((column) => (
              <label
                key={column.id}
                className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]"
              >
                <Checkbox
                  checked={visibleMap[column.id] !== false}
                  onCheckedChange={(checked) => {
                    setVisibleMap((prev) => ({ ...prev, [column.id]: Boolean(checked) }));
                  }}
                />
                {column.label}
              </label>
            ))}
          </div>
        </details>
        <p className="text-xs text-[var(--color-text-secondary)]">{sortedRows.length} rows</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
              {visibleColumns.map((column) => (
                <th
                  key={column.id}
                  className={`sticky ${stickyTopClassName} z-10 bg-[var(--color-bg-secondary)] px-3 py-2 ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-semibold"
                    onClick={() => {
                      if (!column.sortable) return;
                      setSort((prev) => {
                        if (!prev || prev.id !== column.id) {
                          return { id: column.id, direction: 'asc' };
                        }
                        return {
                          id: column.id,
                          direction: prev.direction === 'asc' ? 'desc' : 'asc',
                        };
                      });
                    }}
                  >
                    {column.label}
                    {sort?.id === column.id ? (sort.direction === 'asc' ? '▲' : '▼') : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-[var(--color-border-default)]">
                {visibleColumns.map((column) => (
                  <td
                    key={column.id}
                    className={`px-3 py-2 ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 0}
          onClick={() => setPage((prev) => Math.max(0, prev - 1))}
        >
          Previous
        </Button>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Page {page + 1} / {totalPages}
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages - 1}
          onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

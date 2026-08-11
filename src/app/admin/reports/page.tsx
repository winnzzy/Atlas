'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminState, useAdminResource } from '@/components/admin/admin-panel';
import { formatCount, formatCurrency } from '@/lib/admin-data';
import { getAdminReports } from '@/lib/api';

/** Currency-shaped metrics get a currency format; counts stay plain. */
const CURRENCY_HINTS = ['volume', 'revenue', 'amount', 'balance', 'value', 'deposits'];

function renderValue(key: string, value: unknown): string {
  if (typeof value === 'number') {
    const lowered = key.toLowerCase();
    return CURRENCY_HINTS.some((hint) => lowered.includes(hint))
      ? formatCurrency(value)
      : formatCount(value);
  }
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function humanize(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
}

export default function AdminReportsPage() {
  const { data, loading, error } = useAdminResource(() => getAdminReports({ limit: 50 }));
  const sections = Object.entries(data ?? {});

  return (
    <>
      <div className="space-y-6">
        <AdminState
          loading={loading}
          error={error}
          empty={sections.length === 0}
          emptyMessage="No reports available yet."
        >
          <div className="grid gap-6 md:grid-cols-2">
            {sections.map(([section, value]) => (
              <Card key={section}>
                <CardHeader>
                  <CardTitle>{humanize(section)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {value && typeof value === 'object' && !Array.isArray(value) ? (
                    Object.entries(value as Record<string, unknown>).map(([key, entry]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2.5"
                      >
                        <span className="text-sm text-slate-500">{humanize(key)}</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {renderValue(key, entry)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm font-semibold text-slate-900">
                      {renderValue(section, value)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </AdminState>
      </div>
    </>
  );
}

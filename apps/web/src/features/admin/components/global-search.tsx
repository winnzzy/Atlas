'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, Input } from '@atlas/ui';
import { adminApi } from '../api';
import type { AdminSearchItem } from '../types';

export function AdminGlobalSearch(): React.JSX.Element {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<AdminSearchItem[]>([]);

  React.useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timeout = window.setTimeout(() => {
      void adminApi.searchGlobal(query.trim(), { limit: 8, offset: 0 }).then((res) => {
        setResults(res.items);
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Global Search: customer, account, transfer, transaction"
          className="h-9 w-[360px] pl-8 text-xs"
        />
      </div>
      {results.length > 0 ? (
        <Card className="absolute left-0 right-0 top-11 z-40 border-[var(--color-border-default)] bg-[var(--color-bg-primary)]">
          <CardContent className="max-h-80 overflow-auto p-2">
            <ul className="space-y-1">
              {results.map((item) => (
                <li
                  key={`${item.kind}-${item.id}`}
                  className="rounded-md px-2 py-1.5 hover:bg-[var(--color-bg-secondary)]"
                >
                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {item.primary}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
                    {item.kind}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

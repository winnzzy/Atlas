'use client';

import { useCallback, useEffect, useState } from 'react';

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

/** Loads admin data on mount and exposes loading/error/reload for the panel shells. */
export function useAdminResource<T>(load: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    load()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause.message : 'Unable to load this data from the server',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nonce, ...deps]);

  return { data, loading, error, reload };
}

export function AdminState({
  loading,
  error,
  empty,
  emptyMessage = 'Nothing to show yet.',
  children,
}: {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
}) {
  if (loading) {
    return <p className="py-6 text-sm text-slate-500">Loading…</p>;
  }

  if (error) {
    return (
      <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
        {error}
      </p>
    );
  }

  if (empty) {
    return <p className="py-6 text-sm text-slate-500">{emptyMessage}</p>;
  }

  return <>{children}</>;
}

'use client';

import React from 'react';
import { Alert, Button } from '@atlas/ui';

export default function DashboardError({
  error,
  reset,
}: {
  readonly error: Error;
  readonly reset: () => void;
}): React.JSX.Element {
  return (
    <Alert variant="danger" title="Dashboard load failed">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs">{error.message}</p>
        <Button size="sm" variant="outline" onClick={reset}>
          Retry
        </Button>
      </div>
    </Alert>
  );
}

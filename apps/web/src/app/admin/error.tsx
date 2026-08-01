'use client';

import React from 'react';
import { Alert, Button } from '@atlas/ui';

export default function AdminError({ reset }: { readonly reset: () => void }): React.JSX.Element {
  return (
    <Alert variant="danger" title="Admin route error">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs">Something failed while rendering the admin interface.</p>
        <Button size="sm" variant="outline" onClick={reset}>
          Retry
        </Button>
      </div>
    </Alert>
  );
}

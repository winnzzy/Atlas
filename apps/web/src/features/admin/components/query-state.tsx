import React from 'react';
import { Alert, Button, Skeleton } from '@atlas/ui';

export type QueryStateProps = {
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly errorMessage?: string;
  readonly onRetry?: () => void;
  readonly skeletonRows?: number;
  readonly children: React.ReactNode;
};

export function QueryState({
  isLoading,
  isError,
  errorMessage,
  onRetry,
  skeletonRows = 6,
  children,
}: QueryStateProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: skeletonRows }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="danger" title="Data load failed">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs">{errorMessage ?? 'Unable to load data from backend endpoint.'}</p>
          {onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      </Alert>
    );
  }

  return <>{children}</>;
}

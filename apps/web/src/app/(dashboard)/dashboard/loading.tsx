import React from 'react';
import { Skeleton } from '@atlas/ui';

export default function DashboardLoading(): React.JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

'use client';

import React from 'react';
import { ProfilePreferencesView } from '@/features/customer-profile';
import { QueryState } from '@/features/admin/components/query-state';
import { useCustomerPreferences } from '@/features/customer/hooks';

export default function DashboardProfilePreferencesPage(): React.JSX.Element {
  const preferencesQuery = useCustomerPreferences();

  return (
    <QueryState
      isLoading={preferencesQuery.isLoading}
      isError={preferencesQuery.isError}
      onRetry={() => void preferencesQuery.refetch()}
    >
      {preferencesQuery.data ? (
        <ProfilePreferencesView preferences={preferencesQuery.data} />
      ) : null}
    </QueryState>
  );
}

'use client';

import React from 'react';
import { ProfileActivityView } from '@/features/customer-profile';
import { QueryState } from '@/features/admin/components/query-state';
import { useCustomerActivity, useCustomerProfile } from '@/features/customer/hooks';

export default function DashboardProfileActivityPage(): React.JSX.Element {
  const activityQuery = useCustomerActivity();
  const profileQuery = useCustomerProfile();

  const isLoading = activityQuery.isLoading || profileQuery.isLoading;
  const isError = activityQuery.isError || profileQuery.isError;

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      onRetry={() => {
        void activityQuery.refetch();
        void profileQuery.refetch();
      }}
    >
      {activityQuery.data && profileQuery.data ? (
        <ProfileActivityView activity={activityQuery.data} profile={profileQuery.data} />
      ) : null}
    </QueryState>
  );
}

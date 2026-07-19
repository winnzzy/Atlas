'use client';

import React from 'react';
import { ProfileOverviewView } from '@/features/customer-profile';
import { QueryState } from '@/features/admin/components/query-state';
import { useCustomerProfile, useCustomerSecurity } from '@/features/customer/hooks';

export default function DashboardProfilePage(): React.JSX.Element {
  const profileQuery = useCustomerProfile();
  const securityQuery = useCustomerSecurity();

  const isLoading = profileQuery.isLoading || securityQuery.isLoading;
  const isError = profileQuery.isError || securityQuery.isError;

  return (
    <QueryState
      isLoading={isLoading}
      isError={isError}
      onRetry={() => {
        void profileQuery.refetch();
        void securityQuery.refetch();
      }}
    >
      {profileQuery.data && securityQuery.data ? (
        <ProfileOverviewView profile={profileQuery.data} security={securityQuery.data} />
      ) : null}
    </QueryState>
  );
}

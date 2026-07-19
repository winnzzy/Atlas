'use client';

import React from 'react';
import { ProfileSecurityView } from '@/features/customer-profile';
import { QueryState } from '@/features/admin/components/query-state';
import { useCustomerSecurity } from '@/features/customer/hooks';

export default function DashboardSecurityPage(): React.JSX.Element {
  const securityQuery = useCustomerSecurity();

  return (
    <QueryState
      isLoading={securityQuery.isLoading}
      isError={securityQuery.isError}
      onRetry={() => void securityQuery.refetch()}
    >
      {securityQuery.data ? <ProfileSecurityView security={securityQuery.data} /> : null}
    </QueryState>
  );
}

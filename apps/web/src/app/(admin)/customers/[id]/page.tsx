'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, CardContent } from '@atlas/ui';
import { adminApi } from '@/features/admin/api';
import { AdminPage } from '@/features/admin/components/admin-page';

export default function CustomerDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const profileQuery = useQuery({
    queryKey: ['admin', 'customer-route-profile', id],
    queryFn: () => adminApi.getCustomerProfile(id),
  });

  return (
    <AdminPage
      title="Customer Profile"
      description="Backend-sourced customer graph"
      actions={
        <Button size="sm" variant="outline" onClick={() => router.push('/admin/customers')}>
          Back to Customers
        </Button>
      }
    >
      <Card>
        <CardContent className="p-4">
          <pre className="overflow-auto text-[11px] text-[var(--color-text-secondary)]">
            {JSON.stringify(profileQuery.data ?? {}, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </AdminPage>
  );
}

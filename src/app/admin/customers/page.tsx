'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { AdminState, useAdminResource } from '@/components/admin/admin-panel';
import { loadAdminCustomers } from '@/lib/admin-data';
import { applyAdminCustomerAction } from '@/lib/api';

export default function AdminCustomersPage() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error, reload } = useAdminResource(() => loadAdminCustomers(search), [search]);
  const customers = data?.customers ?? [];

  const applyAction = async (userId: string, status: string) => {
    setPending(userId);
    setActionError(null);
    try {
      await applyAdminCustomerAction(userId, {
        action: status === 'ACTIVE' ? 'SUSPEND' : 'REACTIVATE',
        reason: status === 'ACTIVE' ? 'Suspended from admin console' : 'Reactivated from admin console',
      });
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Action failed');
    } finally {
      setPending(null);
    }
  };

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>Customer management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(query.trim());
            }}
          >
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email or phone"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          {actionError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {actionError}
            </p>
          ) : null}

          <AdminState
            loading={loading}
            error={error}
            empty={customers.length === 0}
            emptyMessage={search ? 'No customers match that search.' : 'No customers yet.'}
          >
            <Table>
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th>KYC</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {customers.map((customer) => (
                  <Tr key={customer.id}>
                    <Td>{customer.name}</Td>
                    <Td>{customer.email}</Td>
                    <Td>
                      <Badge variant={customer.status === 'ACTIVE' ? 'success' : 'warning'}>
                        {customer.status}
                      </Badge>
                    </Td>
                    <Td>{customer.kycStatus}</Td>
                    <Td>
                      <Button
                        variant="secondary"
                        disabled={pending === customer.id}
                        onClick={() => void applyAction(customer.id, customer.status)}
                      >
                        {pending === customer.id
                          ? 'Working…'
                          : customer.status === 'ACTIVE'
                            ? 'Suspend'
                            : 'Reactivate'}
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </AdminState>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

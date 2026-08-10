'use client';

import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { getCustomers } from '@/lib/demo-store';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState(getCustomers());
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(query.toLowerCase()) ||
          customer.email.toLowerCase().includes(query.toLowerCase()),
      ),
    [customers, query],
  );

  const toggleStatus = (customerId: string) => {
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === customerId
          ? { ...customer, status: customer.status === 'Active' ? 'Suspended' : 'Active' }
          : customer,
      ),
    );
  };

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>Customer management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customers"
          />
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Status</Th>
                <Th>Accounts</Th>
                <Th>Balance</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((customer) => (
                <Tr key={customer.id}>
                  <Td>{customer.name}</Td>
                  <Td>{customer.email}</Td>
                  <Td>
                    <Badge variant={customer.status === 'Active' ? 'success' : 'warning'}>
                      {customer.status}
                    </Badge>
                  </Td>
                  <Td>{customer.accounts}</Td>
                  <Td>${customer.balance.toLocaleString()}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => toggleStatus(customer.id)}>
                        Suspend
                      </Button>
                      <Button variant="ghost">View</Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

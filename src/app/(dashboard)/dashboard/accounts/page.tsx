'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { loadDashboardData, type DashboardAccount } from '@/lib/api-data';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<DashboardAccount[]>([]);

  useEffect(() => {
    void loadDashboardData().then(({ accounts }) => setAccounts(accounts));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <Thead>
                <Tr>
                  <Th>Account</Th>
                  <Th>Type</Th>
                  <Th>Balance</Th>
                  <Th>Available</Th>
                </Tr>
              </Thead>
              <Tbody>
                {accounts.map((account) => (
                  <Tr key={account.id}>
                    <Td>{account.name}</Td>
                    <Td>{account.type}</Td>
                    <Td>${account.balance.toLocaleString()}</Td>
                    <Td>${account.available.toLocaleString()}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

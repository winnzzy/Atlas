'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { getDemoState } from '@/lib/demo-store';

export default function AdminTransactionsPage() {
  const [state] = useState(getDemoState());

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <Thead>
              <Tr>
                <Th>Reference</Th>
                <Th>Customer</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {state.adminTransactions.map((transaction) => (
                <Tr key={transaction.id}>
                  <Td>{transaction.reference}</Td>
                  <Td>{transaction.customer}</Td>
                  <Td>${transaction.amount.toLocaleString()}</Td>
                  <Td>
                    <Badge variant={transaction.status === 'Completed' ? 'success' : 'warning'}>
                      {transaction.status}
                    </Badge>
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

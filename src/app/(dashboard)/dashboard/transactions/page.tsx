'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { loadDashboardData, type DashboardTransaction } from '@/lib/api-data';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);

  useEffect(() => {
    void loadDashboardData().then(({ transactions }) => setTransactions(transactions));
  }, []);

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <Thead>
              <Tr>
                <Th>Reference</Th>
                <Th>Description</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {transactions.map((transaction) => (
                <Tr key={transaction.id}>
                  <Td>{transaction.reference}</Td>
                  <Td>{transaction.description}</Td>
                  <Td>
                    {transaction.type === 'Credit' ? '+' : '-'}$
                    {Math.abs(transaction.amount).toFixed(2)}
                  </Td>
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

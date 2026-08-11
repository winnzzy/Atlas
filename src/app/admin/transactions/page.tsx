'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { AdminState, useAdminResource } from '@/components/admin/admin-panel';
import { formatCurrency, loadAdminTransactions } from '@/lib/admin-data';

function statusVariant(status: string) {
  if (status === 'COMPLETED') return 'success' as const;
  if (status === 'FAILED' || status === 'CANCELLED' || status === 'REVERSED') return 'danger' as const;
  return 'warning' as const;
}

export default function AdminTransactionsPage() {
  const { data, loading, error } = useAdminResource(loadAdminTransactions);
  const transactions = data ?? [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminState
            loading={loading}
            error={error}
            empty={transactions.length === 0}
            emptyMessage="No transactions yet."
          >
            <Table>
              <Thead>
                <Tr>
                  <Th>Reference</Th>
                  <Th>Description</Th>
                  <Th>Type</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {transactions.map((transaction) => (
                  <Tr key={transaction.id}>
                    <Td>{transaction.reference}</Td>
                    <Td>{transaction.description}</Td>
                    <Td>{transaction.type}</Td>
                    <Td>{formatCurrency(transaction.amount)}</Td>
                    <Td>
                      <Badge variant={statusVariant(transaction.status)}>{transaction.status}</Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </AdminState>
        </CardContent>
      </Card>
    </>
  );
}

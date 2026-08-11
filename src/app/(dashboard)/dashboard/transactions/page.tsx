'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { loadDashboardData, type DashboardTransaction } from '@/lib/api-data';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadDashboardData()
      .then(({ transactions }) => setTransactions(transactions))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Banking"
        title="Transactions"
        description="A complete history of postings across your accounts."
      />

      <Card variant="elevated">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-sm text-slate-500">Loading transactions…</p>
          ) : transactions.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              No transactions yet. Your activity will appear here.
            </p>
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Reference</Th>
                  <Th>Description</Th>
                  <Th>Date</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {transactions.map((transaction) => (
                  <Tr key={transaction.id}>
                    <Td className="font-medium text-slate-900">{transaction.reference}</Td>
                    <Td>{transaction.description}</Td>
                    <Td className="whitespace-nowrap text-slate-500">{formatDate(transaction.date)}</Td>
                    <Td className="tabular-nums font-semibold text-slate-900">
                      {transaction.type === 'Credit' ? '+' : '-'}
                      {formatCurrency(Math.abs(transaction.amount))}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

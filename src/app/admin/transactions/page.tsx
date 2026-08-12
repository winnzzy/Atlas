'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { AdminState, useAdminResource } from '@/components/admin/admin-panel';
import { formatCurrency, loadAdminTransactions } from '@/lib/admin-data';
import { deleteAdminTransaction } from '@/lib/api';

function statusVariant(status: string) {
  if (status === 'COMPLETED') return 'success' as const;
  if (status === 'FAILED' || status === 'CANCELLED' || status === 'REVERSED') return 'danger' as const;
  return 'warning' as const;
}

export default function AdminTransactionsPage() {
  const { data, loading, error, reload } = useAdminResource(loadAdminTransactions);
  const transactions = data ?? [];
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Only FAILED transactions may be deleted. Deleting one removes it from the
  // history but never touches balances or the ledger (a failed transaction
  // posted nothing to begin with).
  const remove = async (id: string) => {
    if (!window.confirm('Delete this failed transaction? This cannot be undone.')) return;
    setBusyId(id);
    setActionError(null);
    try {
      await deleteAdminTransaction(id);
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Unable to delete transaction');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {actionError ? (
            <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {actionError}
            </p>
          ) : null}
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
                  <Th>Actions</Th>
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
                    <Td>
                      {transaction.status === 'FAILED' ? (
                        <Button
                          variant="danger"
                          className="px-2.5 py-1.5 text-xs"
                          disabled={busyId === transaction.id}
                          onClick={() => void remove(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {busyId === transaction.id ? 'Deleting…' : 'Delete'}
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
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

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

function toggleSelection(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

function statusVariant(status: string) {
  if (status === 'COMPLETED') return 'success' as const;
  if (status === 'FAILED' || status === 'CANCELLED' || status === 'REVERSED')
    return 'danger' as const;
  return 'warning' as const;
}

export default function AdminTransactionsPage() {
  const { data, loading, error, reload } = useAdminResource(loadAdminTransactions);
  const transactions = data ?? [];
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Admin deletion is not restricted to FAILED transactions — any status can be
  // removed from history. It is always a soft delete: no balance or ledger
  // impact, so it only affects what shows up in transaction history views.
  const remove = async (id: string) => {
    if (
      !window.confirm(
        'Delete this transaction from history? This cannot be undone and never affects balances.',
      )
    )
      return;
    setBusyId(id);
    setActionError(null);
    try {
      await deleteAdminTransaction(id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Unable to delete transaction');
    } finally {
      setBusyId(null);
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (
      !window.confirm(
        `Delete ${selected.size} selected transaction(s) from history? This cannot be undone.`,
      )
    )
      return;
    setBulkBusy(true);
    setActionError(null);
    try {
      await Promise.all(Array.from(selected).map((id) => deleteAdminTransaction(id)));
      setSelected(new Set());
      reload();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : 'Unable to delete the selected transactions',
      );
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            {selected.size > 0 ? (
              <Button
                variant="danger"
                className="px-2.5 py-1.5 text-xs"
                disabled={bulkBusy}
                onClick={() => void deleteSelected()}
              >
                <Trash2 className="h-4 w-4" />
                {bulkBusy ? 'Deleting…' : `Delete selected (${selected.size})`}
              </Button>
            ) : null}
          </div>
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
                  <Th>
                    <input
                      type="checkbox"
                      aria-label="Select all transactions"
                      checked={selected.size > 0 && selected.size === transactions.length}
                      onChange={(event) =>
                        setSelected(
                          event.target.checked ? new Set(transactions.map((t) => t.id)) : new Set(),
                        )
                      }
                    />
                  </Th>
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
                    <Td>
                      <input
                        type="checkbox"
                        aria-label={`Select transaction ${transaction.reference}`}
                        checked={selected.has(transaction.id)}
                        onChange={() =>
                          setSelected((prev) => toggleSelection(prev, transaction.id))
                        }
                      />
                    </Td>
                    <Td>{transaction.reference}</Td>
                    <Td>{transaction.description}</Td>
                    <Td>{transaction.type}</Td>
                    <Td>{formatCurrency(transaction.amount)}</Td>
                    <Td>
                      <Badge variant={statusVariant(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Button
                        variant="danger"
                        className="px-2.5 py-1.5 text-xs"
                        disabled={busyId === transaction.id}
                        onClick={() => void remove(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {busyId === transaction.id ? 'Deleting…' : 'Delete'}
                      </Button>
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

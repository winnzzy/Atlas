'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { AdminState, useAdminResource } from '@/components/admin/admin-panel';
import { formatCurrency, loadAdminCustomers, type AdminCustomer } from '@/lib/admin-data';
import { applyAdminAccountAction, getAdminCustomerAccounts, type AdminAccountAction } from '@/lib/api';

type AdminAccount = {
  id: string;
  name: string;
  type: string;
  status: string;
  currentBalance: number;
  availableBalance: number;
  holdAmount: number;
};

function num(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toAccounts(rows: Record<string, unknown>[]): AdminAccount[] {
  return rows.map((row) => ({
    id: String(row.id ?? ''),
    name: String(row.name ?? row.nickname ?? 'Account'),
    type: String(row.type ?? '—'),
    status: String(row.status ?? 'UNKNOWN'),
    currentBalance: num(row.currentBalance),
    availableBalance: num(row.availableBalance),
    holdAmount: num(row.holdAmount),
  }));
}

export default function AdminAccountsPage() {
  const { data: customerData, loading: customersLoading, error: customersError } =
    useAdminResource(() => loadAdminCustomers());
  const customers: AdminCustomer[] = customerData?.customers ?? [];

  const [selectedUserId, setSelectedUserId] = useState('');
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  // Admin credit is a money movement, so it always needs an amount, a reason and
  // a reference; the API rejects the request without them.
  const [creditFor, setCreditFor] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedUserId && customers[0]) {
      setSelectedUserId(customers[0].id);
    }
  }, [customers, selectedUserId]);

  const loadAccounts = async (userId: string) => {
    if (!userId) return;
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const rows = await getAdminCustomerAccounts(userId);
      setAccounts(toAccounts(Array.isArray(rows) ? rows : []));
    } catch (cause) {
      setAccountsError(cause instanceof Error ? cause.message : 'Unable to load accounts');
      setAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts(selectedUserId);
  }, [selectedUserId]);

  const runAction = async (accountId: string, action: AdminAccountAction) => {
    setBusy(true);
    setNotice(null);
    setAccountsError(null);
    try {
      await applyAdminAccountAction(accountId, action);
      setNotice(`${action.action} applied successfully.`);
      setCreditFor(null);
      setAmount('');
      setReason('');
      setReference('');
      await loadAccounts(selectedUserId);
    } catch (cause) {
      setAccountsError(cause instanceof Error ? cause.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Accounts administration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AdminState
              loading={customersLoading}
              error={customersError}
              empty={customers.length === 0}
              emptyMessage="No customers yet."
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Customer</label>
                <Select
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                >
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} — {customer.email}
                    </option>
                  ))}
                </Select>
              </div>
            </AdminState>

            {notice ? (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
                {notice}
              </p>
            ) : null}

            <AdminState
              loading={accountsLoading}
              error={accountsError}
              empty={accounts.length === 0}
              emptyMessage="This customer has no accounts."
            >
              <Table>
                <Thead>
                  <Tr>
                    <Th>Account</Th>
                    <Th>Type</Th>
                    <Th>Status</Th>
                    <Th>Balance</Th>
                    <Th>Available</Th>
                    <Th>Holds</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {accounts.map((account) => (
                    <Tr key={account.id}>
                      <Td>{account.name}</Td>
                      <Td>{account.type}</Td>
                      <Td>
                        <Badge variant={account.status === 'ACTIVE' ? 'success' : 'warning'}>
                          {account.status}
                        </Badge>
                      </Td>
                      <Td>{formatCurrency(account.currentBalance)}</Td>
                      <Td>{formatCurrency(account.availableBalance)}</Td>
                      <Td>{formatCurrency(account.holdAmount)}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-2">
                          {account.status === 'ACTIVE' ? (
                            <Button
                              variant="secondary"
                              disabled={busy}
                              onClick={() =>
                                void runAction(account.id, {
                                  action: 'FREEZE',
                                  reason: 'Frozen from admin console',
                                })
                              }
                            >
                              Freeze
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              disabled={busy}
                              onClick={() => void runAction(account.id, { action: 'UNFREEZE' })}
                            >
                              Unfreeze
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            disabled={busy}
                            onClick={() => setCreditFor(creditFor === account.id ? null : account.id)}
                          >
                            Credit
                          </Button>
                        </div>

                        {creditFor === account.id ? (
                          <form
                            className="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3"
                            onSubmit={(event) => {
                              event.preventDefault();
                              void runAction(account.id, {
                                action: 'CREDIT',
                                amount,
                                reason,
                                reference,
                              });
                            }}
                          >
                            <Input
                              value={amount}
                              onChange={(event) => setAmount(event.target.value)}
                              placeholder="Amount"
                              type="number"
                              min="0.01"
                              step="0.01"
                              required
                            />
                            <Input
                              value={reason}
                              onChange={(event) => setReason(event.target.value)}
                              placeholder="Reason"
                              required
                            />
                            <Input
                              value={reference}
                              onChange={(event) => setReference(event.target.value)}
                              placeholder="Reference"
                              required
                            />
                            <Button type="submit" disabled={busy}>
                              {busy ? 'Posting…' : 'Post credit'}
                            </Button>
                          </form>
                        ) : null}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </AdminState>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

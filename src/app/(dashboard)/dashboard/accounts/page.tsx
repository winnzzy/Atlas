'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { loadDashboardData, type DashboardAccount } from '@/lib/api-data';
import { formatCurrency } from '@/lib/utils';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<DashboardAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadDashboardData()
      .then(({ accounts }) => setAccounts(accounts))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Banking"
        title="Accounts"
        description="Your current, available, and pending balances across every account."
      />

      <Card variant="elevated">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-8 text-center text-sm text-slate-500">Loading accounts…</p>
          ) : accounts.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">You don&apos;t have any accounts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <Thead>
                  <Tr>
                    <Th>Account</Th>
                    <Th>Type</Th>
                    <Th>Status</Th>
                    <Th>Balance</Th>
                    <Th>Available</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {accounts.map((account) => (
                    <Tr key={account.id}>
                      <Td className="font-medium text-slate-900">{account.name}</Td>
                      <Td>{account.type}</Td>
                      <Td><Badge variant="success">Active</Badge></Td>
                      <Td className="tabular-nums">{formatCurrency(account.balance)}</Td>
                      <Td className="tabular-nums">{formatCurrency(account.available)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

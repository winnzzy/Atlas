'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Bell, TrendingUp, Wallet2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { useAuth } from '@/providers/auth-provider';
import {
  freezeCard,
  getAccounts,
  getCards,
  getNotifications,
  getPortfolio,
  getTransactions,
  getTransfers,
  unfreezeCard,
} from '@/lib/demo-store';

export default function DashboardPage() {
  const { user } = useAuth();
  const [accounts] = useState(getAccounts());
  const [transactions] = useState(getTransactions());
  const [transfers] = useState(getTransfers());
  const [cards, setCards] = useState(getCards());
  const [notifications, setNotifications] = useState(getNotifications());
  const [portfolio] = useState(getPortfolio());

  const totals = useMemo(() => {
    const balance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const available = accounts.reduce((sum, account) => sum + account.available, 0);
    const pending = transfers.filter((transfer) => transfer.status === 'Pending').length;
    return { balance, available, pending };
  }, [accounts, transfers]);

  const toggleCard = (cardId: string, status: string) => {
    if (status === 'ACTIVE') {
      freezeCard(cardId);
      setCards(getCards());
      return;
    }
    unfreezeCard(cardId);
    setCards(getCards());
  };

  const markRead = (id: string) => {
    const updated = notifications.map((item) => (item.id === id ? { ...item, read: true } : item));
    setNotifications(updated);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-[#0f4c81] to-[#1e63a7] p-6 text-white shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-blue-100">Customer Workspace</p>
              <h1 className="mt-2 text-3xl font-semibold">
                Welcome back, {user?.name?.split(' ')[0] ?? 'Jordan'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-blue-50">
                Monitor balances, manage cards, and keep transfers moving with a polished local demo
                experience.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-sm text-blue-100">Total balance</p>
              <p className="text-2xl font-semibold">${totals.balance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Available balance</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  ${totals.available.toLocaleString()}
                </p>
              </div>
              <Wallet2 className="h-8 w-8 text-[#0f4c81]" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Investments</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">$365,000</p>
              </div>
              <TrendingUp className="h-8 w-8 text-[#0f4c81]" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending transfers</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{totals.pending}</p>
              </div>
              <ArrowRight className="h-8 w-8 text-[#0f4c81]" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Notifications</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {notifications.filter((item) => !item.read).length}
                </p>
              </div>
              <Bell className="h-8 w-8 text-[#0f4c81]" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{account.name}</p>
                      <p className="text-sm text-slate-500">{account.type}</p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Balance</p>
                      <p className="text-xl font-semibold text-slate-900">
                        ${account.balance.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Available</p>
                      <p className="text-lg font-semibold text-slate-900">
                        ${account.available.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Reference</Th>
                    <Th>Amount</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {transactions.map((transaction) => (
                    <Tr key={transaction.id}>
                      <Td>
                        {transaction.reference}
                        <div className="text-xs text-slate-500">{transaction.description}</div>
                      </Td>
                      <Td>
                        {transaction.type === 'Credit' ? '+' : '-'}$
                        {Math.abs(transaction.amount).toFixed(2)}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Cards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cards.map((card) => (
                <div key={card.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{card.name}</p>
                      <p className="text-sm text-slate-500">{card.maskedNumber}</p>
                    </div>
                    <Badge variant={card.status === 'ACTIVE' ? 'success' : 'warning'}>
                      {card.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Available credit</p>
                      <p className="text-lg font-semibold text-slate-900">
                        ${card.available.toLocaleString()}
                      </p>
                    </div>
                    <Button variant="secondary" onClick={() => toggleCard(card.id, card.status)}>
                      {card.status === 'ACTIVE' ? 'Freeze' : 'Unfreeze'}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {portfolio.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.weight}</p>
                  </div>
                  <p className="font-semibold text-slate-900">${item.value.toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">{notification.title}</p>
                  <p className="text-sm text-slate-500">{notification.message}</p>
                </div>
                {!notification.read ? (
                  <Button variant="secondary" onClick={() => markRead(notification.id)}>
                    Mark as read
                  </Button>
                ) : (
                  <Badge variant="success">Read</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

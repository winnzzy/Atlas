'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Bell,
  BriefcaseBusiness,
  Landmark,
  ShieldCheck,
  TrendingUp,
  Wallet2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { useAuth } from '@/providers/auth-provider';
import { loadDashboardData, type DashboardAccount, type DashboardCard, type DashboardNotification, type DashboardPortfolioItem, type DashboardTransaction, type DashboardTransfer } from '@/lib/api-data';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<DashboardAccount[]>([]);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [transfers, setTransfers] = useState<DashboardTransfer[]>([]);
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [portfolio, setPortfolio] = useState<DashboardPortfolioItem[]>([]);

  useEffect(() => {
    void loadDashboardData().then(({ accounts, transactions, transfers, cards, notifications, portfolio }) => {
      setAccounts(accounts);
      setTransactions(transactions);
      setTransfers(transfers);
      setCards(cards);
      setNotifications(notifications);
      setPortfolio(portfolio);
    });
  }, []);

  const totals = useMemo(() => {
    const balance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const available = accounts.reduce((sum, account) => sum + account.available, 0);
    const pending = transfers.filter((transfer) => transfer.status === 'Pending').length;
    return { balance, available, pending };
  }, [accounts, transfers]);

  const toggleCard = (cardId: string, status: string) => {
    setCards((currentCards) =>
      currentCards.map((card) =>
        card.id === cardId
          ? {
              ...card,
              status: status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE',
            }
          : card,
      ),
    );
  };

  const markRead = (id: string) => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,#0b345a_0%,#103d62_45%,#1b4b73_100%)] p-6 text-white shadow-[0_20px_50px_rgba(11,52,90,0.16)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90">
                <ShieldCheck className="h-3.5 w-3.5" />
                Prime client workspace
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                Welcome back, {user?.name?.split(' ')[0] ?? 'Jordan'}
              </h1>
              <p className="mt-2 text-sm text-white/80">
                Review balances, coordinate transfers, and monitor your banking activity in one secure workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                New Transfer
              </Button>
              <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                Manage Cards
              </Button>
              <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                Profile
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/15 bg-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">Total net worth</p>
              <p className="mt-2 text-2xl font-semibold">{formatCurrency(totals.balance + portfolio.reduce((sum, item) => sum + item.value, 0))}</p>
            </div>
            <div className="rounded-[24px] border border-white/15 bg-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">Pending</p>
              <p className="mt-2 text-2xl font-semibold">{totals.pending} transfer{totals.pending === 1 ? '' : 's'}</p>
            </div>
            <div className="rounded-[24px] border border-white/15 bg-white/10 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">Active cards</p>
              <p className="mt-2 text-2xl font-semibold">{cards.filter((card) => card.status === 'ACTIVE').length}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card variant="elevated">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Available balance</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatCurrency(totals.available)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#f4f8fc] p-3 text-[#0b345a]">
                <Wallet2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Investments</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">$365,000</p>
              </div>
              <div className="rounded-2xl bg-[#f4f8fc] p-3 text-[#0b345a]">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending transfers</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{totals.pending}</p>
              </div>
              <div className="rounded-2xl bg-[#f4f8fc] p-3 text-[#0b345a]">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Notifications</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {notifications.filter((item) => !item.read).length}
                </p>
              </div>
              <div className="rounded-2xl bg-[#f4f8fc] p-3 text-[#0b345a]">
                <Bell className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Accounts</CardTitle>
                <Badge variant="outline">Live balance view</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
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
                        {formatCurrency(account.balance)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Available</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {formatCurrency(account.available)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Recent transactions</CardTitle>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  <Landmark className="h-3.5 w-3.5" />
                  Clearing in real time
                </div>
              </div>
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
                        <div className="font-medium text-slate-900">{transaction.reference}</div>
                        <div className="text-xs text-slate-500">{transaction.description}</div>
                      </Td>
                      <Td>
                        <div className="font-semibold text-slate-900">
                          {transaction.type === 'Credit' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                        </div>
                        <div className="mt-1">
                          <Badge variant={transaction.status === 'Completed' ? 'success' : 'warning'}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Cards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cards.map((card) => (
                <div key={card.id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
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
                        {formatCurrency(card.available)}
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

          <div className="space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Portfolio snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {portfolio.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-500">{item.weight}</p>
                    </div>
                    <p className="font-semibold text-slate-900">{formatCurrency(item.value)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Service center</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-between">
                  Cards & controls
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Profile & security
                  <ShieldCheck className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Business insights
                  <BriefcaseBusiness className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
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

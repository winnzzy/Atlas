'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CreditCard,
  Landmark,
  LineChart,
  ShieldCheck,
  Wallet2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { useAuth } from '@/providers/auth-provider';
import {
  loadDashboardData,
  type DashboardAccount,
  type DashboardCard,
  type DashboardNotification,
  type DashboardPortfolioItem,
  type DashboardTransaction,
  type DashboardTransfer,
} from '@/lib/api-data';
import { freezeCard, markNotificationRead, unfreezeCard } from '@/lib/api';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

const FROZEN = 'FROZEN';
const FREEZABLE = new Set(['ACTIVATED', 'ISSUED']);

function cardStatusVariant(status: string) {
  if (status === 'ACTIVATED' || status === 'ISSUED') return 'success' as const;
  if (status === 'CANCELLED' || status === 'EXPIRED') return 'danger' as const;
  return 'warning' as const;
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-slate-500">{children}</p>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<DashboardAccount[]>([]);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [transfers, setTransfers] = useState<DashboardTransfer[]>([]);
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [portfolio, setPortfolio] = useState<DashboardPortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyCard, setBusyCard] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const data = await loadDashboardData();
    setAccounts(data.accounts);
    setTransactions(data.transactions);
    setTransfers(data.transfers);
    setCards(data.cards);
    setNotifications(data.notifications);
    setPortfolio(data.portfolio);
  }, []);

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  const totals = useMemo(() => {
    const balance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const available = accounts.reduce((sum, account) => sum + account.available, 0);
    const invested = portfolio.reduce((sum, item) => sum + item.value, 0);
    const pending = transfers.filter((transfer) => transfer.status === 'Pending').length;
    const unread = notifications.filter((item) => !item.read).length;
    const activeCards = cards.filter((card) => card.status === 'ACTIVATED' || card.status === 'ISSUED').length;
    return { balance, available, invested, pending, unread, activeCards };
  }, [accounts, portfolio, transfers, notifications, cards]);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const toggleCardFreeze = async (card: DashboardCard) => {
    setBusyCard(card.id);
    try {
      if (card.status === FROZEN) {
        await unfreezeCard(card.id);
      } else {
        await freezeCard(card.id, 'Frozen by cardholder');
      }
      await refresh();
    } catch {
      // The Cards page owns detailed error handling; keep the overview calm.
    } finally {
      setBusyCard(null);
    }
  };

  const markRead = async (id: string) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    try {
      await markNotificationRead(id);
    } catch {
      await refresh();
    }
  };

  const summaryTiles = [
    { label: 'Available balance', value: formatCurrency(totals.available), icon: Wallet2 },
    { label: 'Total balance', value: formatCurrency(totals.balance), icon: Landmark },
    { label: 'Investments', value: formatCurrency(totals.invested), icon: LineChart },
    { label: 'Unread alerts', value: String(totals.unread), icon: Bell },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome / context */}
      <section className="atlas-reveal overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,#0b345a_0%,#103d62_45%,#1b4b73_100%)] p-6 text-white shadow-[0_20px_50px_rgba(11,52,90,0.16)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90">
              <ShieldCheck className="h-3.5 w-3.5" />
              Your workspace
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
            <p className="mt-2 text-sm text-white/80">
              Review balances, move money, and monitor your banking activity in one secure place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              <Link href="/dashboard/transfers">New transfer</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              <Link href="/dashboard/cards">Manage cards</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-white/15 bg-white/10 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">Net position</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">
              {formatCurrency(totals.balance + totals.invested)}
            </p>
          </div>
          <div className="rounded-[22px] border border-white/15 bg-white/10 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">Pending transfers</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{totals.pending}</p>
          </div>
          <div className="rounded-[22px] border border-white/15 bg-white/10 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/70">Active cards</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{totals.activeCards}</p>
          </div>
        </div>
      </section>

      {/* Summary tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryTiles.map((tile) => (
          <Card key={tile.label} variant="elevated" className="atlas-lift">
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{tile.label}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{tile.value}</p>
              </div>
              <div className="rounded-2xl bg-[#f4f8fc] p-3 text-[#0b345a]">
                <tile.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Accounts + recent transactions */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Accounts</CardTitle>
              <Link href="/dashboard/accounts" className="text-sm font-medium text-[#0b345a] hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <EmptyState>Loading accounts…</EmptyState>
            ) : accounts.length === 0 ? (
              <EmptyState>You don&apos;t have any accounts yet.</EmptyState>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
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
                      <p className="text-xl font-semibold tabular-nums text-slate-900">{formatCurrency(account.balance)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Available</p>
                      <p className="text-lg font-semibold tabular-nums text-slate-900">{formatCurrency(account.available)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Recent transactions</CardTitle>
              <Link href="/dashboard/transactions" className="text-sm font-medium text-[#0b345a] hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <EmptyState>Loading transactions…</EmptyState>
            ) : transactions.length === 0 ? (
              <EmptyState>No transactions yet. Your activity will appear here.</EmptyState>
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>Reference</Th>
                    <Th>Amount</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {transactions.slice(0, 6).map((transaction) => (
                    <Tr key={transaction.id}>
                      <Td>
                        <div className="font-medium text-slate-900">{transaction.reference}</div>
                        <div className="text-xs text-slate-500">{transaction.description}</div>
                      </Td>
                      <Td>
                        <div className="font-semibold tabular-nums text-slate-900">
                          {transaction.type === 'Credit' ? '+' : '-'}
                          {formatCurrency(Math.abs(transaction.amount))}
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
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cards + portfolio */}
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Cards</CardTitle>
              <Link href="/dashboard/cards" className="text-sm font-medium text-[#0b345a] hover:underline">
                Manage
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <EmptyState>Loading cards…</EmptyState>
            ) : cards.length === 0 ? (
              <div className="flex flex-col items-start gap-3 rounded-[22px] border border-dashed border-slate-300 bg-slate-50/60 p-5">
                <div className="rounded-2xl bg-white p-2.5 text-[#0b345a] shadow-sm">
                  <CreditCard className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-900">No card yet</p>
                <p className="text-sm text-slate-600">Apply for a debit card and track its status.</p>
                <Button asChild variant="secondary">
                  <Link href="/dashboard/cards">Apply for a card</Link>
                </Button>
              </div>
            ) : (
              cards.map((card) => (
                <div key={card.id} className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{card.name}</p>
                      <p className="text-sm text-slate-500">{card.maskedNumber}</p>
                    </div>
                    <Badge variant={cardStatusVariant(card.status)}>{card.status}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Available</p>
                      <p className="text-lg font-semibold tabular-nums text-slate-900">{formatCurrency(card.available)}</p>
                    </div>
                    {FREEZABLE.has(card.status) || card.status === FROZEN ? (
                      <Button
                        variant="secondary"
                        disabled={busyCard === card.id}
                        onClick={() => void toggleCardFreeze(card)}
                      >
                        {busyCard === card.id ? 'Working…' : card.status === FROZEN ? 'Unfreeze' : 'Freeze'}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Investments</CardTitle>
              <Link href="/dashboard/investments" className="text-sm font-medium text-[#0b345a] hover:underline">
                View
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <EmptyState>Loading portfolio…</EmptyState>
            ) : portfolio.length === 0 ? (
              <EmptyState>No investments yet.</EmptyState>
            ) : (
              portfolio.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.weight}</p>
                  </div>
                  <p className="font-semibold tabular-nums text-slate-900">{formatCurrency(item.value)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Notifications</CardTitle>
            <Link href="/dashboard/notifications" className="text-sm font-medium text-[#0b345a] hover:underline">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <EmptyState>Loading notifications…</EmptyState>
          ) : notifications.length === 0 ? (
            <EmptyState>You&apos;re all caught up.</EmptyState>
          ) : (
            notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{notification.title}</p>
                  <p className="text-sm text-slate-500">{notification.message}</p>
                </div>
                {!notification.read ? (
                  <Button variant="secondary" onClick={() => void markRead(notification.id)}>
                    Mark as read
                  </Button>
                ) : (
                  <Badge variant="success">Read</Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

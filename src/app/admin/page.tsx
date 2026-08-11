'use client';

import Link from 'next/link';
import {
  Banknote,
  Bell,
  CreditCard,
  Landmark,
  LineChart,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { AdminState, useAdminResource } from '@/components/admin/admin-panel';
import { formatCount, formatCurrency, loadAdminDashboard } from '@/lib/admin-data';
import { formatDate } from '@/lib/utils';

function transferVariant(status: string) {
  if (status === 'COMPLETED') return 'success' as const;
  if (status === 'FAILED' || status === 'CANCELLED' || status === 'REJECTED') return 'danger' as const;
  return 'warning' as const;
}

function severityVariant(severity: string) {
  if (severity === 'CRITICAL') return 'danger' as const;
  if (severity === 'WARNING') return 'warning' as const;
  return 'default' as const;
}

export default function AdminPage() {
  const { data, loading, error } = useAdminResource(loadAdminDashboard);

  const overview = data?.overview ?? null;
  const customers = data?.customers ?? [];
  const transfers = data?.transfers ?? [];
  const audit = data?.audit ?? [];

  const tiles = [
    { label: 'Total customers', value: overview ? formatCount(overview.totalCustomers) : '—', icon: Users },
    { label: 'Active accounts', value: overview ? formatCount(overview.activeAccounts) : '—', icon: Landmark },
    { label: 'Pending approvals', value: overview ? formatCount(overview.pendingApprovals) : '—', icon: CreditCard },
    { label: 'Queued notifications', value: overview ? formatCount(overview.pendingNotifications) : '—', icon: Bell },
    { label: 'Daily volume', value: overview ? formatCurrency(overview.dailyVolume) : '—', icon: TrendingUp },
    { label: 'Monthly volume', value: overview ? formatCurrency(overview.monthlyVolume) : '—', icon: Banknote },
    { label: 'Investments', value: overview ? formatCount(overview.totalInvestments) : '—', icon: LineChart },
    { label: 'Total deposits', value: overview ? formatCurrency(overview.totalDeposits) : '—', icon: Landmark },
  ];

  return (
    <div className="space-y-6">
      <section className="atlas-reveal overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,#0b1f38_0%,#0b345a_55%,#1d4d74_100%)] p-6 text-white shadow-[0_20px_50px_rgba(11,52,90,0.16)] sm:p-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90">
            <ShieldCheck className="h-3.5 w-3.5" />
            Operations console
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Command center</h1>
          <p className="mt-2 text-sm text-white/80">
            Live oversight of customers, volume, approvals, and audit activity.
          </p>
        </div>
      </section>

      <AdminState loading={loading} error={error}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map((tile) => (
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

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Recent transfers</CardTitle>
                <Link href="/admin/transfers" className="text-sm font-medium text-[#0b345a] hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {transfers.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-500">No transfers yet.</p>
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Reference</Th>
                      <Th>Counterparty</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {transfers.map((transfer) => (
                      <Tr key={transfer.id}>
                        <Td className="font-medium text-slate-900">{transfer.reference}</Td>
                        <Td>{transfer.counterparty}</Td>
                        <Td className="tabular-nums">{formatCurrency(transfer.amount)}</Td>
                        <Td><Badge variant={transferVariant(transfer.status)}>{transfer.status}</Badge></Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Audit activity</CardTitle>
                <Link href="/admin/audit" className="text-sm font-medium text-[#0b345a] hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {audit.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No audit events recorded yet.</p>
              ) : (
                audit.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{event.action}</p>
                      <Badge variant={severityVariant(event.severity)}>{event.severity}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {event.resourceType} · {formatDate(event.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card variant="elevated" className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Customer overview</CardTitle>
              <Link href="/admin/customers" className="text-sm font-medium text-[#0b345a] hover:underline">
                Manage customers
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {customers.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No customers yet.</p>
            ) : (
              customers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50/70 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{customer.name}</p>
                    <p className="text-sm text-slate-500">{customer.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={customer.status === 'ACTIVE' ? 'success' : 'warning'}>{customer.status}</Badge>
                    <p className="mt-2 text-sm text-slate-500">KYC {customer.kycStatus}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </AdminState>
    </div>
  );
}

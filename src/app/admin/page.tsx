'use client';

import { Bell, Landmark, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { AdminState, useAdminResource } from '@/components/admin/admin-panel';
import { formatCount, formatCurrency, loadAdminDashboard } from '@/lib/admin-data';

export default function AdminPage() {
  const { data, loading, error } = useAdminResource(loadAdminDashboard);

  const overview = data?.overview ?? null;
  const customers = data?.customers ?? [];
  const transfers = data?.transfers ?? [];

  const statCards = [
    { label: 'Total customers', value: overview ? formatCount(overview.totalCustomers) : '—', icon: Users },
    { label: 'Active accounts', value: overview ? formatCount(overview.activeAccounts) : '—', icon: Landmark },
    { label: 'Daily volume', value: overview ? formatCurrency(overview.dailyVolume) : '—', icon: TrendingUp },
    { label: 'Pending approvals', value: overview ? formatCount(overview.pendingApprovals) : '—', icon: Bell },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,#0b345a_0%,#113d62_45%,#1d4d74_100%)] p-6 text-white shadow-[0_20px_50px_rgba(11,52,90,0.16)]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90">
              <ShieldCheck className="h-3.5 w-3.5" />
              Control tower
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              Operations command center for risk, growth, and support
            </h1>
            <p className="mt-2 text-sm text-white/80">
              Live oversight of volume, approvals, and customer health.
            </p>
          </div>
        </section>

        <AdminState loading={loading} error={error}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((item) => (
              <Card key={item.label} variant="elevated">
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">{item.value}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f6faff] p-3 text-[#0f4c81]">
                    <item.icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Recent transfers</CardTitle>
              </CardHeader>
              <CardContent>
                {transfers.length === 0 ? (
                  <p className="py-4 text-sm text-slate-500">No transfers yet.</p>
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
                          <Td>{transfer.reference}</Td>
                          <Td>{transfer.counterparty}</Td>
                          <Td>{formatCurrency(transfer.amount)}</Td>
                          <Td>
                            <Badge variant={transfer.status === 'COMPLETED' ? 'success' : 'warning'}>
                              {transfer.status}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>System health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(overview?.systemHealth ?? {}).length === 0 ? (
                  <p className="py-4 text-sm text-slate-500">No health metrics reported.</p>
                ) : (
                  Object.entries(overview?.systemHealth ?? {}).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2.5"
                    >
                      <span className="text-slate-500">{key}</span>
                      <Badge variant="default">{String(value)}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card variant="elevated" className="mt-6">
            <CardHeader>
              <CardTitle>Customer overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customers.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">No customers yet.</p>
              ) : (
                customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{customer.name}</p>
                      <p className="text-sm text-slate-500">{customer.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={customer.status === 'ACTIVE' ? 'success' : 'warning'}>
                        {customer.status}
                      </Badge>
                      <p className="mt-2 text-sm text-slate-500">KYC {customer.kycStatus}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </AdminState>
      </div>
    </DashboardLayout>
  );
}

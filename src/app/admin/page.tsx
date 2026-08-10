'use client';

import { useState } from 'react';
import { Activity, Bell, Briefcase, CheckCircle2, Landmark, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { getDemoState } from '@/lib/demo-store';

const statCards = [
  { label: 'Total Customers', value: '2.4k', icon: Users },
  { label: 'Active Accounts', value: '1.8k', icon: Landmark },
  { label: 'Daily Volume', value: '$4.8m', icon: TrendingUp },
  { label: 'Pending Transfers', value: '18', icon: Bell },
];

export default function AdminPage() {
  const [state] = useState(getDemoState());

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,#0b345a_0%,#113d62_45%,#1d4d74_100%)] p-6 text-white shadow-[0_20px_50px_rgba(11,52,90,0.16)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90">
                <ShieldCheck className="h-3.5 w-3.5" />
                Control tower
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                Operations command center for risk, growth, and support
              </h1>
              <p className="mt-2 text-sm text-white/80">
                Executive-grade oversight with daily volume, approvals, and customer health in one
                secure operations view.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                Approvals
              </Button>
              <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                Reports
              </Button>
            </div>
          </div>
        </section>

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

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {state.activity.map((item) => (
                <div
                  key={item}
                  className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-700"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>System health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                <span className="text-slate-500">Uptime</span>
                <Badge variant="success">{state.adminHealth.uptime}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                <span className="text-slate-500">Latency</span>
                <Badge variant="default">{state.adminHealth.latency}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                <span className="text-slate-500">Fraud score</span>
                <Badge variant="success">{state.adminHealth.fraudScore}</Badge>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Button variant="outline">Review queue</Button>
                <Button variant="outline">Settings</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Pending approvals</CardTitle>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                <Activity className="h-3.5 w-3.5" />
                2 requests awaiting review
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <Thead>
                <Tr>
                  <Th>Reference</Th>
                  <Th>Customer</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {state.adminTransfers.map((transfer) => (
                  <Tr key={transfer.id}>
                    <Td>{transfer.reference}</Td>
                    <Td>{transfer.customer}</Td>
                    <Td>${transfer.amount.toLocaleString()}</Td>
                    <Td>
                      <Badge variant={transfer.status === 'Pending' ? 'warning' : 'success'}>
                        {transfer.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Customer overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {state.customers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-900">{customer.name}</p>
                    <p className="text-sm text-slate-500">{customer.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={customer.status === 'Active' ? 'success' : 'warning'}>
                      {customer.status}
                    </Badge>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{customer.accounts} accounts</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Operations highlights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Fraud monitoring threshold updated successfully.
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-700">
                <Briefcase className="h-4 w-4 text-[#0f4c81]" />
                Treasury reserves remain above target limits.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

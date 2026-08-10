'use client';

import { useState } from 'react';
import { LayoutGrid, Bell, Landmark, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { getDemoState } from '@/lib/demo-store';

const statCards = [
  { label: 'Total Customers', value: '2.4k', icon: LayoutGrid },
  { label: 'Active Accounts', value: '1.8k', icon: Landmark },
  { label: 'Daily Volume', value: '$4.8m', icon: TrendingUp },
  { label: 'Pending Transfers', value: '18', icon: Bell },
];

export default function AdminPage() {
  const [state] = useState(getDemoState());

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item) => (
            <Card key={item.label}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{item.value}</p>
                </div>
                <item.icon className="h-8 w-8 text-[#0f4c81]" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {state.activity.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>System health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Uptime</span>
                <Badge variant="success">{state.adminHealth.uptime}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Latency</span>
                <Badge variant="default">{state.adminHealth.latency}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Fraud score</span>
                <Badge variant="success">{state.adminHealth.fraudScore}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending approvals</CardTitle>
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
      </div>
    </DashboardLayout>
  );
}

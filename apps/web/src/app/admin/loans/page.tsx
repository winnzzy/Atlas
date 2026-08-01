'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@atlas/ui';
import { StatCard } from '@atlas/banking-ui';
import { Banknote, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

const mockLoans = [
  {
    id: 'L001',
    borrower: 'Sarah Johnson',
    type: 'personal',
    amount: 25000,
    disbursed: 25000,
    outstanding: 18750,
    rate: 8.5,
    term: 36,
    status: 'active',
    nextPayment: '2026-08-01',
    monthlyPayment: 790,
  },
  {
    id: 'L002',
    borrower: 'Michael Chen',
    type: 'mortgage',
    amount: 450000,
    disbursed: 450000,
    outstanding: 432000,
    rate: 6.25,
    term: 360,
    status: 'active',
    nextPayment: '2026-08-01',
    monthlyPayment: 2772,
  },
  {
    id: 'L003',
    borrower: 'Emma Williams',
    type: 'auto',
    amount: 35000,
    disbursed: 35000,
    outstanding: 21000,
    rate: 5.9,
    term: 60,
    status: 'active',
    nextPayment: '2026-08-15',
    monthlyPayment: 674,
  },
  {
    id: 'L004',
    borrower: 'James Brown',
    type: 'personal',
    amount: 15000,
    disbursed: 15000,
    outstanding: 0,
    rate: 9.2,
    term: 24,
    status: 'completed',
    nextPayment: '-',
    monthlyPayment: 687,
  },
  {
    id: 'L005',
    borrower: 'Olivia Davis',
    type: 'business',
    amount: 100000,
    disbursed: 75000,
    outstanding: 75000,
    rate: 7.5,
    term: 60,
    status: 'active',
    nextPayment: '2026-08-01',
    monthlyPayment: 1978,
  },
  {
    id: 'L006',
    borrower: 'Robert Wilson',
    type: 'personal',
    amount: 20000,
    disbursed: 20000,
    outstanding: 16000,
    rate: 8.9,
    term: 36,
    status: 'overdue',
    nextPayment: '2026-07-01',
    monthlyPayment: 636,
  },
];

const statusColor: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

const typeColor: Record<string, string> = {
  personal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  mortgage: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  auto: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  business: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function LoansPage() {
  const totalOutstanding = mockLoans.reduce((sum, l) => sum + l.outstanding, 0);
  const totalDisbursed = mockLoans.reduce((sum, l) => sum + l.disbursed, 0);
  const activeLoans = mockLoans.filter((l) => l.status === 'active').length;
  const overdueLoans = mockLoans.filter((l) => l.status === 'overdue').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Loan Management
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Manage loan portfolios and disbursements
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Outstanding"
          value={`$${(totalOutstanding / 1_000_000).toFixed(1)}M`}
          icon={<Banknote className="h-5 w-5" />}
        />
        <StatCard
          title="Total Disbursed"
          value={`$${(totalDisbursed / 1_000_000).toFixed(1)}M`}
          trend="up"
          trendValue="15.2%"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Active Loans"
          value={activeLoans.toString()}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <StatCard
          title="Overdue"
          value={overdueLoans.toString()}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Loans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    ID
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Borrower
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Type
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--color-text-secondary)]">
                    Amount
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--color-text-secondary)]">
                    Outstanding
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--color-text-secondary)]">
                    Rate
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Status
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Next Payment
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockLoans.map((loan) => (
                  <tr key={loan.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="py-3 font-mono text-xs text-[var(--color-text-primary)]">
                      {loan.id}
                    </td>
                    <td className="py-3 font-medium text-[var(--color-text-primary)]">
                      {loan.borrower}
                    </td>
                    <td className="py-3">
                      <Badge className={typeColor[loan.type]}>{loan.type}</Badge>
                    </td>
                    <td className="py-3 text-right font-medium text-[var(--color-text-primary)]">
                      ${loan.amount.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-medium text-[var(--color-text-primary)]">
                      ${loan.outstanding.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-[var(--color-text-primary)]">
                      {loan.rate}%
                    </td>
                    <td className="py-3">
                      <Badge className={statusColor[loan.status]}>{loan.status}</Badge>
                    </td>
                    <td className="py-3 text-[var(--color-text-secondary)]">{loan.nextPayment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

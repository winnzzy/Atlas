'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@atlas/ui';
import { StatCard } from '@atlas/banking-ui';
import { Activity, Server, CheckCircle, AlertTriangle } from 'lucide-react';

const mockOperations = [
  {
    id: 'OP001',
    type: 'batch_transfer',
    description: 'Scheduled batch transfer - 234 transactions',
    status: 'completed',
    startedAt: '2026-07-09T06:00:00Z',
    completedAt: '2026-07-09T06:12:00Z',
    duration: '12m',
  },
  {
    id: 'OP002',
    type: 'reconciliation',
    description: 'Daily account reconciliation',
    status: 'completed',
    startedAt: '2026-07-09T05:00:00Z',
    completedAt: '2026-07-09T05:45:00Z',
    duration: '45m',
  },
  {
    id: 'OP003',
    type: 'statement_gen',
    description: 'Monthly statement generation - June 2026',
    status: 'completed',
    startedAt: '2026-07-09T04:00:00Z',
    completedAt: '2026-07-09T04:30:00Z',
    duration: '30m',
  },
  {
    id: 'OP004',
    type: 'kyc_batch',
    description: 'KYC document verification batch',
    status: 'running',
    startedAt: '2026-07-09T08:00:00Z',
    completedAt: '-',
    duration: '45m+',
  },
  {
    id: 'OP005',
    type: 'interest_calc',
    description: 'Daily interest calculation - Savings accounts',
    status: 'completed',
    startedAt: '2026-07-09T03:00:00Z',
    completedAt: '2026-07-09T03:15:00Z',
    duration: '15m',
  },
  {
    id: 'OP006',
    type: 'fraud_scan',
    description: 'Fraud detection scan - All transactions',
    status: 'failed',
    startedAt: '2026-07-09T07:00:00Z',
    completedAt: '2026-07-09T07:05:00Z',
    duration: '5m',
  },
];

const statusColor: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  queued: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function OperationsPage() {
  const completed = mockOperations.filter((o) => o.status === 'completed').length;
  const running = mockOperations.filter((o) => o.status === 'running').length;
  const failed = mockOperations.filter((o) => o.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Operations
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Monitor system operations and batch jobs
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Completed"
          value={completed.toString()}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <StatCard
          title="Running"
          value={running.toString()}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          title="Failed"
          value={failed.toString()}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard title="Success Rate" value="83.3%" icon={<Server className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockOperations.map((op) => (
              <div
                key={op.id}
                className="flex items-center gap-4 rounded-lg border border-[var(--color-border)] p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)]">
                  {op.status === 'running' ? (
                    <Activity className="h-4 w-4 text-blue-500" />
                  ) : op.status === 'failed' ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--color-text-primary)]">{op.description}</p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Started: {new Date(op.startedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-tertiary)]">{op.duration}</span>
                  <Badge className={statusColor[op.status]}>{op.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

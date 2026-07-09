'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@atlas/ui';
import { StatCard } from '@atlas/banking-ui';
import { Shield, AlertTriangle, FileText, User } from 'lucide-react';

const mockAuditLogs = [
  {
    id: 'A001',
    action: 'user.login',
    actor: 'Sarah Johnson',
    ip: '192.168.1.10',
    resource: 'auth/sessions',
    severity: 'info',
    timestamp: '2026-07-09T08:30:00Z',
  },
  {
    id: 'A002',
    action: 'transfer.initiated',
    actor: 'Michael Chen',
    ip: '10.0.0.45',
    resource: 'accounts/ACC002/transfer',
    severity: 'info',
    timestamp: '2026-07-09T08:25:00Z',
  },
  {
    id: 'A003',
    action: 'kyc.failed',
    actor: 'System',
    ip: '-',
    resource: 'kyc/verify/K003',
    severity: 'warning',
    timestamp: '2026-07-09T08:20:00Z',
  },
  {
    id: 'A004',
    action: 'admin.user.suspend',
    actor: 'Admin: J. Smith',
    ip: '172.16.0.5',
    resource: 'users/U005',
    severity: 'critical',
    timestamp: '2026-07-09T08:15:00Z',
  },
  {
    id: 'A005',
    action: 'card.created',
    actor: 'Emma Williams',
    ip: '192.168.2.33',
    resource: 'cards/C004',
    severity: 'info',
    timestamp: '2026-07-09T08:10:00Z',
  },
  {
    id: 'A006',
    action: 'password.changed',
    actor: 'James Brown',
    ip: '10.0.1.78',
    resource: 'auth/password',
    severity: 'info',
    timestamp: '2026-07-09T08:00:00Z',
  },
  {
    id: 'A007',
    action: 'login.failed',
    actor: 'Unknown',
    ip: '203.0.113.42',
    resource: 'auth/login',
    severity: 'warning',
    timestamp: '2026-07-09T07:55:00Z',
  },
  {
    id: 'A008',
    action: 'settings.updated',
    actor: 'Admin: J. Smith',
    ip: '172.16.0.5',
    resource: 'admin/settings',
    severity: 'info',
    timestamp: '2026-07-09T07:45:00Z',
  },
];

const severityColor: Record<string, string> = {
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function AuditPage() {
  const warnings = mockAuditLogs.filter((l) => l.severity === 'warning').length;
  const critical = mockAuditLogs.filter((l) => l.severity === 'critical').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Audit Log
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          System-wide activity audit trail
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Events"
          value={mockAuditLogs.length.toString()}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          title="Warnings"
          value={warnings.toString()}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          title="Critical"
          value={critical.toString()}
          icon={<Shield className="h-5 w-5" />}
        />
        <StatCard title="Unique Actors" value="5" icon={<User className="h-5 w-5" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Timestamp
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Action
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Actor
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Resource
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    IP
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Severity
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockAuditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="py-3 font-mono text-xs text-[var(--color-text-tertiary)]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 font-mono text-xs font-medium text-[var(--color-text-primary)]">
                      {log.action}
                    </td>
                    <td className="py-3 text-[var(--color-text-primary)]">{log.actor}</td>
                    <td className="py-3 font-mono text-xs text-[var(--color-text-tertiary)]">
                      {log.resource}
                    </td>
                    <td className="py-3 font-mono text-xs text-[var(--color-text-tertiary)]">
                      {log.ip}
                    </td>
                    <td className="py-3">
                      <Badge className={severityColor[log.severity]}>{log.severity}</Badge>
                    </td>
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

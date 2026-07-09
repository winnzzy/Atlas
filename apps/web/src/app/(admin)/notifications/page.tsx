'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@atlas/ui';
import { StatCard } from '@atlas/banking-ui';
import { Bell, Mail, MessageSquare, Send, CheckCircle, Clock } from 'lucide-react';

const mockNotifications = [
  {
    id: 'N001',
    type: 'email',
    recipient: 'sarah.j@email.com',
    subject: 'Account Statement Ready',
    status: 'sent',
    sentAt: '2026-07-09T08:30:00Z',
  },
  {
    id: 'N002',
    type: 'push',
    recipient: 'Michael Chen',
    subject: 'New login detected from Chrome',
    status: 'sent',
    sentAt: '2026-07-09T08:15:00Z',
  },
  {
    id: 'N003',
    type: 'sms',
    recipient: '+1 (555) 123-4567',
    subject: 'Your transfer of $2,500 is complete',
    status: 'delivered',
    sentAt: '2026-07-09T07:45:00Z',
  },
  {
    id: 'N004',
    type: 'email',
    recipient: 'emma.w@email.com',
    subject: 'KYC Verification Approved',
    status: 'sent',
    sentAt: '2026-07-09T07:30:00Z',
  },
  {
    id: 'N005',
    type: 'push',
    recipient: 'James Brown',
    subject: 'Card ending 4567 was used for $89.50',
    status: 'failed',
    sentAt: '2026-07-09T07:00:00Z',
  },
  {
    id: 'N006',
    type: 'email',
    recipient: 'olivia.d@email.com',
    subject: 'Welcome to Atlas Banking',
    status: 'sent',
    sentAt: '2026-07-08T18:00:00Z',
  },
];

const typeIcon: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  push: <Bell className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
};

const statusColor: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function NotificationsPage() {
  const delivered = mockNotifications.filter((n) => n.status === 'delivered').length;
  const failed = mockNotifications.filter((n) => n.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Monitor notification delivery and engagement
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sent"
          value={mockNotifications.length.toString()}
          icon={<Send className="h-5 w-5" />}
        />
        <StatCard
          title="Delivered"
          value={delivered.toString()}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <StatCard title="Failed" value={failed.toString()} icon={<Clock className="h-5 w-5" />} />
        <StatCard
          title="Delivery Rate"
          value="83.3%"
          trend="up"
          trendValue="2.1%"
          icon={<Bell className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockNotifications.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-4 rounded-lg border border-[var(--color-border)] p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)]">
                  {typeIcon[n.type]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--color-text-primary)]">
                    {n.subject}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    To: {n.recipient} · {new Date(n.sentAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{n.type}</Badge>
                  <Badge className={statusColor[n.status]}>{n.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

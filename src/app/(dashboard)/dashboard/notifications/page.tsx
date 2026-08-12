'use client';

import { useEffect, useMemo, useState } from 'react';
import { BellOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { loadDashboardData, type DashboardNotification } from '@/lib/api-data';
import { clearNotification, markNotificationRead } from '@/lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = () =>
    loadDashboardData().then(({ notifications }) => setNotifications(notifications));

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const markRead = async (id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
    try {
      await markNotificationRead(id);
    } catch {
      await refresh();
    }
  };

  const clear = async (id: string) => {
    // Optimistically drop it, then persist the removal server-side. On failure,
    // reload so the list reflects the true persisted state again.
    setNotifications((current) => current.filter((notification) => notification.id !== id));
    try {
      await clearNotification(id);
    } catch {
      await refresh();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description="Transfers, card decisions, and account changes as they happen."
        actions={<Badge variant="outline">{unreadCount} unread</Badge>}
      />

      <Card variant="elevated">
        <CardContent className="space-y-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Loading notifications…</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="rounded-2xl bg-[#f4f8fc] p-3 text-[#0b345a]">
                <BellOff className="h-6 w-6" />
              </div>
              <p className="text-base font-semibold text-slate-900">You&apos;re all caught up.</p>
              <p className="text-sm text-slate-600">New account activity will show up here.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {item.read ? (
                      <Badge variant="success">Read</Badge>
                    ) : (
                      <>
                        <Badge variant="warning">Unread</Badge>
                        <Button variant="ghost" onClick={() => void markRead(item.id)}>
                          Mark read
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" onClick={() => void clear(item.id)}>
                      Clear
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

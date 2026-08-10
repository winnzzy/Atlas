'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { loadDashboardData, type DashboardNotification } from '@/lib/api-data';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);

  useEffect(() => {
    void loadDashboardData().then(({ notifications }) => setNotifications(notifications));
  }, []);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Notifications</CardTitle>
              <Badge variant="outline">{unreadCount} unread</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((item) => (
              <div key={item.id} className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!item.read ? <Badge variant="warning">Unread</Badge> : <Badge variant="success">Read</Badge>}
                    {!item.read ? (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setNotifications((currentNotifications) =>
                            currentNotifications.map((notification) =>
                              notification.id === item.id ? { ...notification, read: true } : notification,
                            ),
                          );
                        }}
                      >
                        Mark read
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

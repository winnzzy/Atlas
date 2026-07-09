'use client';

import React, { useMemo, useState } from 'react';
import { Bell, X } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@atlas/ui';
import { formatDateTime } from './formatters';
import { NotificationsEmptyState } from './dashboard-widgets';
import type { DashboardNotification } from './types';

export interface NotificationWidgetProps {
  readonly notifications: readonly DashboardNotification[];
}

export default function NotificationWidget({ notifications }: NotificationWidgetProps) {
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<readonly string[]>([]);

  const visibleNotifications = useMemo(() => {
    return notifications.filter(
      (notification) => !dismissedNotificationIds.includes(notification.id),
    );
  }, [dismissedNotificationIds, notifications]);

  const unreadCount = useMemo(() => {
    return visibleNotifications.filter((notification) => notification.unread).length;
  }, [visibleNotifications]);

  return (
    <section aria-labelledby="notification-widget-title">
      <Card variant="elevated" className="bg-[var(--color-bg-primary)]">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle id="notification-widget-title">Notifications</CardTitle>
              <CardDescription>Unread alerts and recent account events.</CardDescription>
            </div>
            <Badge variant={unreadCount > 0 ? 'info' : 'secondary'}>{unreadCount} unread</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {visibleNotifications.length === 0 ? (
            <NotificationsEmptyState />
          ) : (
            <div className="space-y-3">
              {visibleNotifications.slice(0, 4).map((notification) => (
                <article
                  key={notification.id}
                  className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4"
                  aria-label={`${notification.title}. ${notification.detail}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-[var(--radius-full)] bg-[var(--color-primary-100)] p-2 text-[var(--color-primary-700)]">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {notification.title}
                          </p>
                          {notification.unread ? <Badge variant="info">Unread</Badge> : null}
                        </div>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                          {notification.detail}
                        </p>
                        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Dismiss ${notification.title}`}
                      onClick={() => {
                        setDismissedNotificationIds((currentIds) => [
                          ...currentIds,
                          notification.id,
                        ]);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

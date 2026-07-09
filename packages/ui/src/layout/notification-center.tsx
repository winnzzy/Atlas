'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Bell, Check, CheckCheck, BellOff } from 'lucide-react';
import { cn } from '../lib/cn';
import { Button } from '../components/button';
import { Badge } from '../components/badge';
import { NotificationsContext, type NotificationsContextValue } from './hooks';
import type { Notification } from './types';

// ─── Notifications Provider ────────────────────────────

export interface NotificationsProviderProps {
  readonly children: React.ReactNode;
  readonly initialNotifications?: readonly Notification[];
}

export function NotificationsProvider({
  children,
  initialNotifications = [],
}: NotificationsProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<readonly Notification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const value: NotificationsContextValue = {
    isOpen,
    unreadCount,
    toggle,
    close,
    markAsRead,
    markAllAsRead,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

// ─── Notification Bell ─────────────────────────────────

export function NotificationBell({ className }: { readonly className?: string }) {
  const { toggle, unreadCount } = useNotificationsContext();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      className={cn('relative', className)}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-danger-500)] px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
}

// ─── Notification Item ─────────────────────────────────

interface NotificationItemProps {
  readonly notification: Notification;
  readonly onMarkAsRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const Icon = notification.icon;
  const typeColors: Record<string, string> = {
    info: 'bg-[var(--color-info-500)]',
    success: 'bg-[var(--color-success-500)]',
    warning: 'bg-[var(--color-warning-500)]',
    danger: 'bg-[var(--color-danger-500)]',
  };

  return (
    <div
      className={cn(
        'group flex gap-3 rounded-[var(--radius-md)] p-3 transition-colors hover:bg-[var(--color-bg-secondary)]',
        !notification.isRead && 'bg-[var(--color-primary-50)]/50',
      )}
      role="article"
      aria-label={notification.title}
    >
      {/* Indicator dot */}
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            typeColors[notification.type] ?? 'bg-[var(--color-info-500)]',
          )}
        />
        {!notification.isRead && (
          <button
            onClick={() => onMarkAsRead(notification.id)}
            className="invisible rounded p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] group-hover:visible"
            aria-label="Mark as read"
          >
            <Check className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm',
            notification.isRead
              ? 'text-[var(--color-text-secondary)]'
              : 'font-medium text-[var(--color-text-primary)]',
          )}
        >
          {notification.title}
        </p>
        {notification.description && (
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)] line-clamp-2">
            {notification.description}
          </p>
        )}
        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">{notification.timestamp}</p>
      </div>

      {Icon && <Icon className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />}
    </div>
  );
}

// ─── Notification Drawer ───────────────────────────────

export interface NotificationDrawerProps {
  readonly notifications: readonly Notification[];
  readonly maxHeight?: string;
  readonly className?: string;
}

export function NotificationDrawer({
  notifications,
  maxHeight = '400px',
  className,
}: NotificationDrawerProps) {
  const { isOpen, close, markAsRead, markAllAsRead, unreadCount } = useNotificationsContext();

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[var(--z-dropdown)]" onClick={close} aria-hidden="true" />
      <div
        role="dialog"
        aria-label="Notifications"
        className={cn(
          'absolute right-0 top-full z-[var(--z-dropdown)] mt-2 w-[380px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] shadow-xl',
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-default)] px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Badge variant="danger" className="text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="overflow-y-auto p-2" style={{ maxHeight }}>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
              <BellOff className="mb-3 h-8 w-8 opacity-30" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="mt-1 text-xs">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onMarkAsRead={markAsRead} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-[var(--color-border-default)] px-4 py-2.5 text-center">
            <button className="text-xs font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]">
              View all notifications
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Safe hook ─────────────────────────────────────────

function useNotificationsContext(): NotificationsContextValue {
  const ctx = React.useContext(NotificationsContext);
  if (!ctx) {
    return {
      isOpen: false,
      unreadCount: 0,
      toggle: () => {},
      close: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
    };
  }
  return ctx;
}

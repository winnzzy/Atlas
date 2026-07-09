'use client';

import * as React from 'react';
import { cn } from '../lib/cn';
import {
  LogIn,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Lock,
  Settings,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import type { ActivityItem, ActivityAction } from '../types/banking.types';

const ACTIVITY_ICONS: Record<ActivityAction, React.ElementType> = {
  login: LogIn,
  transfer_sent: ArrowUpRight,
  transfer_received: ArrowDownLeft,
  card_created: CreditCard,
  card_locked: Lock,
  settings_changed: Settings,
  password_changed: KeyRound,
  kyc_verified: ShieldCheck,
};

interface ActivityFeedItemProps {
  readonly item: ActivityItem;
  readonly className?: string;
}

function ActivityFeedItem({ item, className }: ActivityFeedItemProps) {
  const Icon = ACTIVITY_ICONS[item.action] ?? Settings;

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{item.description}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(item.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

interface ActivityFeedProps {
  readonly items: ActivityItem[];
  readonly maxItems?: number;
  readonly className?: string;
}

export function ActivityFeed({ items, maxItems = 10, className }: ActivityFeedProps) {
  const displayed = items.slice(0, maxItems);

  if (displayed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {displayed.map((item) => (
        <ActivityFeedItem key={item.id} item={item} />
      ))}
    </div>
  );
}

'use client';

import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import type { SecurityTimelineEvent } from '@atlas/types';
import { cn } from '../lib/cn';

interface SecurityTimelineProps {
  readonly events: readonly SecurityTimelineEvent[];
  readonly className?: string;
}

const eventConfig = {
  info: { icon: Info, className: 'bg-sky-100 text-sky-700' },
  warning: { icon: AlertTriangle, className: 'bg-amber-100 text-amber-700' },
  critical: { icon: ShieldAlert, className: 'bg-rose-100 text-rose-700' },
} as const;

export function SecurityTimeline({ events, className }: SecurityTimelineProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {events.map((event, index) => {
        const config = eventConfig[event.severity];
        const Icon = config.icon;

        return (
          <div key={event.id} className="relative flex gap-3">
            {index < events.length - 1 ? (
              <span
                className="absolute left-4 top-10 h-[calc(100%-1rem)] w-px bg-border"
                aria-hidden="true"
              />
            ) : null}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                config.className,
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1 rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.occurredAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

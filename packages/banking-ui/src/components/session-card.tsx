'use client';

import type { ActiveSession } from '@atlas/types';
import { Card, CardContent } from '@atlas/ui';
import { cn } from '../lib/cn';

interface SessionCardProps {
  readonly session: ActiveSession;
  readonly className?: string;
}

export function SessionCard({ session, className }: SessionCardProps) {
  return (
    <Card variant="elevated" className={cn('bg-background', className)}>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">{session.deviceName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{session.ipAddress}</p>
          </div>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              session.status === 'active'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700',
            )}
          >
            {session.status === 'active' ? 'Active' : 'Expiring Soon'}
          </span>
        </div>
        <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <span>
            Started{' '}
            {new Date(session.startedAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
          <span>
            Expires{' '}
            {new Date(session.expiresAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

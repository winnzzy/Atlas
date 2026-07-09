'use client';

import { LaptopMinimal, Smartphone } from 'lucide-react';
import type { ConnectedDevice } from '@atlas/types';
import { Card, CardContent } from '@atlas/ui';
import { cn } from '../lib/cn';

interface DeviceCardProps {
  readonly device: ConnectedDevice;
  readonly className?: string;
}

export function DeviceCard({ device, className }: DeviceCardProps) {
  const Icon = device.platform.toLowerCase().includes('ios') ? Smartphone : LaptopMinimal;

  return (
    <Card variant="elevated" className={cn('bg-background', className)}>
      <CardContent className="flex items-start gap-3 p-5">
        <div className="rounded-lg bg-muted p-2 text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{device.name}</p>
            {device.isCurrent ? (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                Current
              </span>
            ) : null}
            {device.isTrusted ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Trusted
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {device.browser} on {device.platform}
          </p>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            <span>{device.location}</span>
            <span>{device.ipAddress}</span>
            <span>
              Last active{' '}
              {new Date(device.lastActiveAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

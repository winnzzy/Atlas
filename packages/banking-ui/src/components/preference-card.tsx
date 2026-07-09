'use client';

import * as React from 'react';
import { Card, CardContent } from '@atlas/ui';
import { cn } from '../lib/cn';

interface PreferenceCardProps {
  readonly title: string;
  readonly description: string;
  readonly value: string;
  readonly icon?: React.ReactNode;
  readonly className?: string;
}

export function PreferenceCard({
  title,
  description,
  value,
  icon,
  className,
}: PreferenceCardProps) {
  return (
    <Card variant="elevated" className={cn('h-full bg-background', className)}>
      <CardContent className="flex h-full items-start gap-3 p-5">
        {icon ? (
          <div className="mt-0.5 rounded-lg bg-muted p-2 text-muted-foreground">{icon}</div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          <p className="mt-4 text-sm font-medium text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import * as React from 'react';
import { cn } from '../lib/cn';
import type { TrendDirection } from '../types/banking.types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  readonly title: string;
  readonly value: string;
  readonly description?: string;
  readonly trend?: TrendDirection;
  readonly trendValue?: string;
  readonly icon?: React.ReactNode;
  readonly className?: string;
}

export function StatCard({
  title,
  value,
  description,
  trend,
  trendValue,
  icon,
  className,
}: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
      {(description || (trend && trendValue)) && (
        <div className="mt-1 flex items-center gap-1">
          {trend && trendValue && (
            <>
              <TrendIcon
                className={cn(
                  'h-3.5 w-3.5',
                  trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
                  trend === 'down' && 'text-red-600 dark:text-red-400',
                  trend === 'flat' && 'text-muted-foreground',
                )}
              />
              <span
                className={cn(
                  'text-xs font-medium',
                  trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
                  trend === 'down' && 'text-red-600 dark:text-red-400',
                  trend === 'flat' && 'text-muted-foreground',
                )}
              >
                {trendValue}
              </span>
            </>
          )}
          {description && <span className="text-xs text-muted-foreground">{description}</span>}
        </div>
      )}
    </div>
  );
}

'use client';

import * as React from 'react';
import { cn } from '../lib/cn';
import { AmountDisplay } from './amount-display';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Money, TrendDirection } from '../types/banking.types';

interface BalanceCardProps {
  readonly title: string;
  readonly balance: Money;
  readonly trend?: TrendDirection;
  readonly trendValue?: string;
  readonly subtitle?: string;
  readonly icon?: React.ReactNode;
  readonly className?: string;
}

export function BalanceCard({
  title,
  balance,
  trend,
  trendValue,
  subtitle,
  icon,
  className,
}: BalanceCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <AmountDisplay money={balance} size="xl" />
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
        )}
      </div>
      {trend && trendValue && (
        <div className="mt-3 flex items-center gap-1">
          <TrendIcon
            className={cn(
              'h-4 w-4',
              trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
              trend === 'down' && 'text-red-600 dark:text-red-400',
              trend === 'flat' && 'text-muted-foreground',
            )}
          />
          <span
            className={cn(
              'text-sm font-medium',
              trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
              trend === 'down' && 'text-red-600 dark:text-red-400',
              trend === 'flat' && 'text-muted-foreground',
            )}
          >
            {trendValue}
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}

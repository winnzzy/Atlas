'use client';

import { cn } from '../lib/cn';

interface ProgressBarProps {
  readonly value: number;
  readonly max?: number;
  readonly label?: string;
  readonly showPercentage?: boolean;
  readonly color?: 'default' | 'success' | 'warning' | 'danger';
  readonly size?: 'sm' | 'md';
  readonly className?: string;
}

const COLOR_CLASSES: Record<string, string> = {
  default: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
};

const SIZE_CLASSES: Record<string, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  color = 'default',
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && <span className="text-sm font-medium text-foreground">{label}</span>}
          {showPercentage && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full overflow-hidden rounded-full bg-muted', SIZE_CLASSES[size])}>
        <div
          className={cn(
            'rounded-full transition-all duration-300',
            COLOR_CLASSES[color],
            SIZE_CLASSES[size],
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}

'use client';

import { cn } from '../lib/cn';
import { Calendar } from 'lucide-react';
import type { DateRange } from '../types/banking.types';

interface DateRangePickerProps {
  readonly value?: DateRange;
  readonly onChange?: (range: DateRange) => void;
  readonly presets?: readonly { label: string; range: DateRange }[];
  readonly className?: string;
}

export function DateRangePicker({ value, onChange, presets, className }: DateRangePickerProps) {
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm tabular-nums text-foreground">
          {value ? `${formatDate(value.from)} – ${formatDate(value.to)}` : 'Select date range'}
        </span>
      </div>
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange?.(preset.range)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { CheckCircle2, Clock3, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/cn';

interface VerificationBadgeProps {
  readonly status: 'verified' | 'pending' | 'under_review';
  readonly className?: string;
}

const statusConfig = {
  verified: {
    label: 'Verified',
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  pending: {
    label: 'Pending',
    icon: Clock3,
    className: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  under_review: {
    label: 'Under Review',
    icon: ShieldAlert,
    className: 'border-sky-200 bg-sky-50 text-sky-700',
  },
} as const;

export function VerificationBadge({ status, className }: VerificationBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        config.className,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

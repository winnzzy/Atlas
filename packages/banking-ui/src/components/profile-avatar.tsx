'use client';

import { CheckCircle2, Clock3 } from 'lucide-react';
import { cn } from '../lib/cn';

interface ProfileAvatarProps {
  readonly name: string;
  readonly initials?: string;
  readonly status?: 'verified' | 'pending' | 'under_review';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly className?: string;
}

const sizeClasses = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-14 w-14 text-lg',
  lg: 'h-20 w-20 text-2xl',
};

export function ProfileAvatar({
  name,
  initials,
  status,
  size = 'md',
  className,
}: ProfileAvatarProps) {
  const fallback =
    initials ??
    name
      .split(' ')
      .map((part) => part[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className={cn('relative inline-flex', className)}>
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-sky-600 to-cyan-500 font-semibold text-white shadow-sm',
          sizeClasses[size],
        )}
        aria-label={`${name} profile avatar`}
      >
        {fallback}
      </div>
      {status && (
        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-0.5">
          {status === 'verified' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          ) : (
            <Clock3 className="h-5 w-5 text-amber-500" aria-hidden="true" />
          )}
        </div>
      )}
    </div>
  );
}

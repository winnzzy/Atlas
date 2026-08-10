import * as React from 'react';
import { cn } from '@/lib/utils';

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0f4c81]',
        className,
      )}
      {...props}
    />
  );
}

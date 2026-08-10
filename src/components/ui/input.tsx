import * as React from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-0 focus:border-[#0f4c81]',
        className,
      )}
      {...props}
    />
  );
}

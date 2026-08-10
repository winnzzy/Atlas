import * as React from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.75 text-sm text-slate-700 outline-none transition focus:border-[#0f4c81] focus:bg-white focus:ring-2 focus:ring-[#0f4c81]/10',
        className,
      )}
      {...props}
    />
  );
}

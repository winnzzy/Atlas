import * as React from 'react';
import { cn } from '@/lib/utils';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'elevated' | 'muted';
};

export function Card({ className, variant = 'default', ...props }: CardProps) {
  const variants = {
    default: 'rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.04)]',
    elevated: 'rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_16px_44px_rgba(15,23,42,0.06)] backdrop-blur',
    muted: 'rounded-[24px] border border-slate-200 bg-slate-50/80 shadow-[0_6px_18px_rgba(15,23,42,0.03)]',
  };

  return <div className={cn(variants[variant], className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-slate-100 px-5 py-4', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold tracking-tight text-slate-900', className)} {...props} />;
}

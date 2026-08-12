import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  asChild?: boolean;
};

export function Button({
  className,
  variant = 'primary',
  asChild = false,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0b345a]/15 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
  const variants = {
    primary: 'bg-[#0b345a] text-white shadow-[0_10px_24px_rgba(11,52,90,0.16)] hover:bg-[#092844]',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    outline: 'border border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-white',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-600 text-white shadow-[0_10px_24px_rgba(220,38,38,0.16)] hover:bg-red-700',
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
      className: cn(
        base,
        variants[variant],
        className,
        (children as React.ReactElement<{ className?: string }>).props.className,
      ),
    });
  }

  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

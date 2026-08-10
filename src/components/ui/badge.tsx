import { cn } from '@/lib/utils';

export function Badge({
  className,
  children,
  variant = 'default',
}: {
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
}) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
    outline: 'border border-slate-200 bg-white text-slate-700',
  };

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

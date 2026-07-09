import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-[var(--radius-full)] font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-primary-100)] text-[var(--color-primary-800)]',
        secondary: 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]',
        success: 'bg-[var(--color-success-100)] text-[var(--color-success-800)]',
        warning: 'bg-[var(--color-warning-100)] text-[var(--color-warning-800)]',
        danger: 'bg-[var(--color-danger-100)] text-[var(--color-danger-800)]',
        info: 'bg-[var(--color-info-100)] text-[var(--color-info-800)]',
        outline: 'border border-[var(--color-border-default)] text-[var(--color-text-secondary)]',
        crypto: 'bg-[var(--color-crypto-100)] text-[var(--color-crypto-800)]',
        investment: 'bg-[var(--color-investment-100)] text-[var(--color-investment-800)]',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  readonly dot?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot, children, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {dot && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  ),
);
Badge.displayName = 'Badge';

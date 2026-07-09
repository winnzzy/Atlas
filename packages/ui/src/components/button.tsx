import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-all duration-[var(--duration-normal)] ease-[var(--ease-default)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-primary-600)] text-[var(--color-text-on-primary)] hover:bg-[var(--color-primary-700)] active:bg-[var(--color-primary-800)] shadow-sm',
        secondary:
          'bg-[var(--color-neutral-100)] text-[var(--color-text-primary)] hover:bg-[var(--color-neutral-200)] active:bg-[var(--color-neutral-300)]',
        outline:
          'border border-[var(--color-border-default)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-tertiary)]',
        ghost:
          'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-tertiary)]',
        danger:
          'bg-[var(--color-danger-600)] text-white hover:bg-[var(--color-danger-700)] active:bg-[var(--color-danger-800)] shadow-sm',
        success:
          'bg-[var(--color-success-600)] text-white hover:bg-[var(--color-success-700)] active:bg-[var(--color-success-800)] shadow-sm',
        link: 'bg-transparent text-[var(--color-text-link)] hover:text-[var(--color-text-link-hover)] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        xs: 'h-7 rounded-[var(--radius-md)] px-2.5 text-xs [&_svg]:size-3',
        sm: 'h-8 rounded-[var(--radius-md)] px-3 text-sm [&_svg]:size-4',
        md: 'h-10 rounded-[var(--radius-md)] px-4 text-sm [&_svg]:size-4',
        lg: 'h-11 rounded-[var(--radius-lg)] px-6 text-base [&_svg]:size-5',
        xl: 'h-12 rounded-[var(--radius-lg)] px-8 text-base [&_svg]:size-5',
        icon: 'h-10 w-10 rounded-[var(--radius-md)] [&_svg]:size-5',
        'icon-sm': 'h-8 w-8 rounded-[var(--radius-md)] [&_svg]:size-4',
        'icon-lg': 'h-12 w-12 rounded-[var(--radius-lg)] [&_svg]:size-5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  readonly isLoading?: boolean;
  readonly leftIcon?: React.ReactNode;
  readonly rightIcon?: React.ReactNode;
  readonly fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading,
      leftIcon,
      rightIcon,
      fullWidth,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }), fullWidth && 'w-full')}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="animate-spin" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };

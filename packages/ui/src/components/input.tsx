import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const inputVariants = cva(
  'flex w-full rounded-[var(--radius-md)] bg-[var(--color-surface-default)] px-3 py-2 text-sm text-[var(--color-text-primary)] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-focus-ring-offset)] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      inputSize: {
        sm: 'h-8 text-xs',
        md: 'h-10 text-sm',
        lg: 'h-11 text-base',
      },
      inputState: {
        default:
          'border border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]',
        error:
          'border-2 border-[var(--color-border-danger)] focus-visible:ring-[var(--color-danger-500)]',
        success:
          'border-2 border-[var(--color-border-success)] focus-visible:ring-[var(--color-success-500)]',
      },
    },
    defaultVariants: { inputSize: 'md', inputState: 'default' },
  },
);

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  readonly label?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly leftAddon?: React.ReactNode;
  readonly rightAddon?: React.ReactNode;
  readonly fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      inputSize,
      inputState,
      label,
      hint,
      error,
      leftAddon,
      rightAddon,
      fullWidth = true,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const state = error ? 'error' : inputState;
    return (
      <div className={cn('flex flex-col gap-1.5', !fullWidth && 'w-auto')}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 text-[var(--color-text-muted)]">{leftAddon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ inputSize, inputState: state, className }),
              leftAddon && 'pl-10',
              rightAddon && 'pr-10',
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 text-[var(--color-text-muted)]">{rightAddon}</div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-[var(--color-danger-600)]"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-[var(--color-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly label?: string;
  readonly hint?: string;
  readonly error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'flex min-h-[80px] w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-default)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-2 border-[var(--color-border-danger)]',
            className,
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <p className="text-xs text-[var(--color-danger-600)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

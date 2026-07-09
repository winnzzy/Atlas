import React from 'react';
import { cn } from '../lib/cn';

// ─── Separator ───
export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly orientation?: 'horizontal' | 'vertical';
  readonly decorative?: boolean;
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? 'none' : 'separator'}
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-[var(--color-border-default)]',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  ),
);
Separator.displayName = 'Separator';

// ─── Skeleton ───
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly variant?: 'text' | 'circular' | 'rectangular';
  readonly width?: string | number;
  readonly height?: string | number;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', width, height, style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'animate-pulse bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-700)]',
        variant === 'text' && 'h-4 w-full rounded-[var(--radius-md)]',
        variant === 'circular' && 'rounded-[var(--radius-full)]',
        variant === 'rectangular' && 'rounded-[var(--radius-md)]',
        className,
      )}
      style={{ width: width ?? style?.width, height: height ?? style?.height, ...style }}
      {...props}
    />
  ),
);
Skeleton.displayName = 'Skeleton';

// ─── Label ───
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  readonly required?: boolean;
  readonly disabled?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, disabled, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none text-[var(--color-text-primary)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        disabled && 'cursor-not-allowed opacity-70',
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-[var(--color-danger-600)]">*</span>}
    </label>
  ),
);
Label.displayName = 'Label';

// ─── Alert ───
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly variant?: 'info' | 'success' | 'warning' | 'danger';
  readonly icon?: React.ReactNode;
  readonly title?: string;
  readonly closable?: boolean;
  readonly onClose?: () => void;
}

const alertVariantMap = {
  info: 'border-[var(--color-info-200)] bg-[var(--color-info-50)] text-[var(--color-info-800)]',
  success:
    'border-[var(--color-success-200)] bg-[var(--color-success-50)] text-[var(--color-success-800)]',
  warning:
    'border-[var(--color-warning-200)] bg-[var(--color-warning-50)] text-[var(--color-warning-800)]',
  danger:
    'border-[var(--color-danger-200)] bg-[var(--color-danger-50)] text-[var(--color-danger-800)]',
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', icon, title, closable, onClose, children, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative flex gap-3 rounded-[var(--radius-lg)] border p-4',
        alertVariantMap[variant],
        className,
      )}
      {...props}
    >
      {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
      <div className="flex-1">
        {title && <h5 className="mb-1 font-medium">{title}</h5>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
      {closable && (
        <button
          onClick={onClose}
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close alert"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M12 4L4 12M4 4l8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  ),
);
Alert.displayName = 'Alert';

// ─── Switch ───
export interface SwitchProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange'
> {
  readonly checked?: boolean;
  readonly onCheckedChange?: (checked: boolean) => void;
  readonly size?: 'sm' | 'md' | 'lg';
}

const switchSizeMap = {
  sm: {
    track: 'h-5 w-9',
    thumb: 'h-4 w-4 translate-x-0.5 peer-data-[state=checked]:translate-x-[18px]',
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5 translate-x-0.5 peer-data-[state=checked]:translate-x-[22px]',
  },
  lg: {
    track: 'h-7 w-14',
    thumb: 'h-6 w-6 translate-x-1 peer-data-[state=checked]:translate-x-[30px]',
  },
};

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, onCheckedChange, size = 'md', disabled, ...props }, ref) => {
    const dims = switchSizeMap[size];
    return (
      <button
        ref={ref}
        role="switch"
        aria-checked={checked}
        data-state={checked ? 'checked' : 'unchecked'}
        disabled={disabled}
        className={cn(
          'peer inline-flex shrink-0 cursor-pointer items-center rounded-[var(--radius-full)] border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          dims.track,
          checked ? 'bg-[var(--color-primary-600)]' : 'bg-[var(--color-neutral-300)]',
          className,
        )}
        onClick={() => onCheckedChange?.(!checked)}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none block rounded-[var(--radius-full)] bg-white shadow-lg ring-0 transition-transform',
            dims.thumb,
          )}
        />
      </button>
    );
  },
);
Switch.displayName = 'Switch';

// ─── Checkbox ───
export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'type'
> {
  readonly label?: string;
  readonly onCheckedChange?: (checked: boolean) => void;
  readonly error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, onCheckedChange, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex items-start gap-2">
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0 rounded-[var(--radius-sm)] border-[var(--color-border-default)] text-[var(--color-primary-600)] focus:ring-2 focus:ring-[var(--color-focus-ring)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[var(--color-border-danger)]',
            className,
          )}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-text-primary)] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';

// ─── Progress ───
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly value?: number;
  readonly max?: number;
  readonly variant?: 'default' | 'success' | 'warning' | 'danger';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly showLabel?: boolean;
}

const progressVariantMap = {
  default: 'bg-[var(--color-primary-600)]',
  success: 'bg-[var(--color-success-600)]',
  warning: 'bg-[var(--color-warning-600)]',
  danger: 'bg-[var(--color-danger-600)]',
};

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    { className, value = 0, max = 100, variant = 'default', size = 'md', showLabel, ...props },
    ref,
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {showLabel && (
          <div className="mb-1 flex justify-between text-xs text-[var(--color-text-secondary)]">
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          className={cn(
            'w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-neutral-200)]',
            size === 'sm' && 'h-1',
            size === 'md' && 'h-2',
            size === 'lg' && 'h-3',
          )}
        >
          <div
            className={cn(
              'h-full rounded-[var(--radius-full)] transition-all duration-300',
              progressVariantMap[variant],
            )}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
          />
        </div>
      </div>
    );
  },
);
Progress.displayName = 'Progress';

// ─── Tooltip ───
export interface TooltipProps {
  readonly content: React.ReactNode;
  readonly children: React.ReactNode;
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
  readonly className?: string;
}

const tooltipPositionMap = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export const Tooltip: React.FC<TooltipProps> = ({ content, children, side = 'top', className }) => (
  <div className="group relative inline-flex">
    {children}
    <div
      role="tooltip"
      className={cn(
        'pointer-events-none absolute z-50 whitespace-nowrap rounded-[var(--radius-md)] bg-[var(--color-neutral-900)] px-3 py-1.5 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100 dark:bg-[var(--color-neutral-100)] dark:text-[var(--color-neutral-900)]',
        tooltipPositionMap[side],
        className,
      )}
    >
      {content}
    </div>
  </div>
);
Tooltip.displayName = 'Tooltip';

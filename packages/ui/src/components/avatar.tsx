import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const avatarVariants = cva('relative flex shrink-0 overflow-hidden rounded-[var(--radius-full)]', {
  variants: {
    size: {
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-xs',
      md: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg',
      '2xl': 'h-20 w-20 text-xl',
    },
  },
  defaultVariants: { size: 'md' },
});

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof avatarVariants> {
  readonly src?: string | null;
  readonly alt?: string;
  readonly fallback?: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, ...props }, ref) => (
    <div ref={ref} className={cn(avatarVariants({ size, className }))} {...props}>
      {src ? (
        <img src={src} alt={alt || ''} className="aspect-square h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[var(--color-primary-100)] text-[var(--color-primary-700)] font-medium">
          {fallback || alt?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  ),
);
Avatar.displayName = 'Avatar';

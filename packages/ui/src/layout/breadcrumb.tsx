'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';
import type { BreadcrumbItem } from './types';

export interface BreadcrumbProps {
  readonly items: readonly BreadcrumbItem[];
  readonly className?: string;
  readonly separator?: React.ReactNode;
  readonly maxItems?: number;
}

export function Breadcrumb({ items, className, separator, maxItems = 5 }: BreadcrumbProps) {
  const displayItems =
    items.length > maxItems ? [...items.slice(0, 1), { label: '...' }, ...items.slice(-2)] : items;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1', className)}>
      <ol className="flex items-center gap-1" role="list">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const Icon = item.icon;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && (
                <span className="text-[var(--color-text-muted)]" aria-hidden="true">
                  {separator ?? <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              )}
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] transition-colors',
                    'hover:text-[var(--color-text-primary)]',
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  <span>{item.label}</span>
                </a>
              ) : (
                <span
                  className={cn(
                    'flex items-center gap-1.5 text-sm',
                    isLast || item.isCurrent
                      ? 'font-medium text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-muted)]',
                  )}
                  aria-current={isLast || item.isCurrent ? 'page' : undefined}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

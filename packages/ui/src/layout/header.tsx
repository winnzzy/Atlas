'use client';

import React from 'react';
import { cn } from '../lib/cn';
import { Avatar } from '../components/avatar';
import { Badge } from '../components/badge';
import { Separator } from '../components/primitives';
import { NotificationBell } from './notification-center';
import { SidebarToggle } from './sidebar';
import { CommandPaletteTrigger } from './command-palette';
import { Breadcrumb } from './breadcrumb';
import type { Environment, UserProfile, ProfileMenuItem, BreadcrumbItem } from './types';

// ─── Environment Badge ─────────────────────────────────

export interface EnvironmentBadgeProps {
  readonly environment: Environment;
  readonly className?: string;
}

export function EnvironmentBadge({ environment, className }: EnvironmentBadgeProps) {
  if (environment === 'production') return null;

  const config: Record<Environment, { label: string; variant: 'warning' | 'info' | 'danger' }> = {
    development: { label: 'DEV', variant: 'warning' },
    staging: { label: 'STG', variant: 'info' },
    production: { label: 'PROD', variant: 'danger' },
  };

  const { label, variant } = config[environment];

  return (
    <Badge variant={variant} className={cn('text-[10px] uppercase tracking-wider', className)}>
      {label}
    </Badge>
  );
}

// ─── Profile Menu ──────────────────────────────────────

export interface ProfileMenuProps {
  readonly user: UserProfile;
  readonly items: readonly ProfileMenuItem[];
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onNavigate?: (href: string) => void;
  readonly className?: string;
}

export function ProfileMenu({
  user,
  items,
  isOpen,
  onClose,
  onNavigate,
  className,
}: ProfileMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[var(--z-dropdown)]" onClick={onClose} aria-hidden="true" />
      <div
        role="menu"
        aria-label="User menu"
        className={cn(
          'absolute right-0 top-full z-[var(--z-dropdown)] mt-2 w-[240px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] shadow-xl',
          className,
        )}
      >
        {/* User info */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar size="sm" src={user.avatar} alt={user.name} fallback={user.initials} />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                {user.name}
              </p>
              <p className="truncate text-xs text-[var(--color-text-muted)]">{user.email}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Menu items */}
        <div className="p-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.id}>
                {item.dividerBefore && <Separator className="my-1" />}
                <button
                  role="menuitem"
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    if (item.href) onNavigate?.(item.href);
                    onClose();
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors',
                    item.variant === 'danger'
                      ? 'text-[var(--color-danger-600)] hover:bg-[var(--color-danger-50)]'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]',
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  <span>{item.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Header ────────────────────────────────────────────

export interface HeaderProps {
  readonly breadcrumbs?: readonly BreadcrumbItem[];
  readonly user?: UserProfile;
  readonly profileItems?: readonly ProfileMenuItem[];
  readonly environment?: Environment;
  readonly onNavigate?: (href: string) => void;
  readonly className?: string;
}

export function Header({
  breadcrumbs,
  user,
  profileItems = [],
  environment,
  onNavigate,
  className,
}: HeaderProps) {
  const [profileOpen, setProfileOpen] = React.useState(false);

  return (
    <header
      className={cn(
        'flex h-16 items-center justify-between border-b border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-4 lg:px-6',
        className,
      )}
    >
      {/* Left: Toggle + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <SidebarToggle />
        {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {environment && environment !== 'production' && (
          <EnvironmentBadge environment={environment} />
        )}
        <CommandPaletteTrigger />
        {user && (
          <div className="relative">
            <NotificationBell />
          </div>
        )}
        {user && (
          <div className="relative">
            <button
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-[var(--radius-md)] p-1 transition-colors hover:bg-[var(--color-bg-secondary)]"
              aria-label="User menu"
              aria-expanded={profileOpen}
            >
              <Avatar size="sm" src={user.avatar} alt={user.name} fallback={user.initials} />
            </button>
            <ProfileMenu
              user={user}
              items={profileItems}
              isOpen={profileOpen}
              onClose={() => setProfileOpen(false)}
              onNavigate={onNavigate}
            />
          </div>
        )}
      </div>
    </header>
  );
}

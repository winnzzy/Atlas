'use client';

import React from 'react';
import { cn } from '../lib/cn';
import { SidebarProvider, Sidebar } from './sidebar';
import { CommandPalette, CommandPaletteProvider } from './command-palette';
import { NotificationsProvider, NotificationDrawer } from './notification-center';
import { Header } from './header';
import type {
  SidebarConfig,
  BreadcrumbItem,
  UserProfile,
  ProfileMenuItem,
  Notification,
  CommandItem,
  Environment,
} from './types';

// ─── Dashboard Shell ───────────────────────────────────

export interface DashboardShellProps {
  readonly children: React.ReactNode;
  readonly sidebarConfig: SidebarConfig;
  readonly breadcrumbs?: readonly BreadcrumbItem[];
  readonly user?: UserProfile;
  readonly profileItems?: readonly ProfileMenuItem[];
  readonly notifications?: readonly Notification[];
  readonly commands?: readonly CommandItem[];
  readonly environment?: Environment;
  readonly activeHref?: string;
  readonly onNavigate?: (href: string) => void;
}

export function DashboardShell({
  children,
  sidebarConfig,
  breadcrumbs,
  user,
  profileItems,
  notifications = [],
  commands = [],
  environment,
  activeHref,
  onNavigate,
}: DashboardShellProps) {
  return (
    <SidebarProvider>
      <CommandPaletteProvider>
        <NotificationsProvider initialNotifications={notifications}>
          <ShellContent
            sidebarConfig={sidebarConfig}
            breadcrumbs={breadcrumbs}
            user={user}
            profileItems={profileItems}
            commands={commands}
            environment={environment}
            activeHref={activeHref}
            onNavigate={onNavigate}
          >
            {children}
          </ShellContent>
        </NotificationsProvider>
      </CommandPaletteProvider>
    </SidebarProvider>
  );
}

// ─── Inner Shell (uses context hooks) ──────────────────

interface ShellContentProps {
  readonly children: React.ReactNode;
  readonly sidebarConfig: SidebarConfig;
  readonly breadcrumbs?: readonly BreadcrumbItem[];
  readonly user?: UserProfile;
  readonly profileItems?: readonly ProfileMenuItem[];
  readonly commands?: readonly CommandItem[];
  readonly environment?: Environment;
  readonly activeHref?: string;
  readonly onNavigate?: (href: string) => void;
}

function ShellContent({
  children,
  sidebarConfig,
  breadcrumbs,
  user,
  profileItems,
  commands,
  environment,
  activeHref,
  onNavigate,
}: ShellContentProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-secondary)]">
      <Sidebar config={sidebarConfig} activeHref={activeHref} onNavigate={onNavigate} />
      <ShellMainContent>
        <Header
          breadcrumbs={breadcrumbs}
          user={user}
          profileItems={profileItems}
          environment={environment}
          onNavigate={onNavigate}
        />
        {children}
      </ShellMainContent>
      <CommandPalette commands={commands ?? []} onNavigate={onNavigate} />
      <NotificationDrawer notifications={[]} />
    </div>
  );
}

// ─── Main Content Area ─────────────────────────────────

interface ShellMainContentProps {
  readonly children: React.ReactNode;
}

function ShellMainContent({ children }: ShellMainContentProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden lg:ml-[260px]">
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

// ─── Admin Shell ───────────────────────────────────────

export interface AdminShellProps extends Omit<DashboardShellProps, 'sidebarConfig'> {
  readonly sidebarConfig: SidebarConfig;
}

export function AdminShell(props: AdminShellProps) {
  return <DashboardShell {...props} />;
}

// ─── Page Container ────────────────────────────────────

export interface PageContainerProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  readonly padding?: boolean;
}

export function PageContainer({
  children,
  className,
  maxWidth = 'full',
  padding = true,
}: PageContainerProps) {
  const maxWidthClasses: Record<string, string> = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        padding && 'px-4 py-6 lg:px-6 lg:py-8',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ─── Page Header ───────────────────────────────────────

export interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly actions?: React.ReactNode;
  readonly className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

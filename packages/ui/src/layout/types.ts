import type { LucideIcon } from 'lucide-react';

// ─── Navigation ────────────────────────────────────────

export type NavPermission = 'admin' | 'user' | 'viewer';

export interface NavBadge {
  readonly label: string;
  readonly variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'crypto';
}

export interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly icon?: LucideIcon;
  readonly badge?: NavBadge;
  readonly permission?: NavPermission;
  readonly featureFlag?: string;
  readonly children?: readonly NavItem[];
  readonly isExternal?: boolean;
}

export interface NavSection {
  readonly id: string;
  readonly label?: string;
  readonly items: readonly NavItem[];
}

// ─── Sidebar ───────────────────────────────────────────

export type SidebarVariant = 'default' | 'admin';

export interface SidebarConfig {
  readonly sections: readonly NavSection[];
  readonly variant: SidebarVariant;
  readonly logo?: React.ReactNode;
  readonly footer?: React.ReactNode;
}

// ─── Breadcrumb ────────────────────────────────────────

export interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
  readonly icon?: LucideIcon;
  readonly isCurrent?: boolean;
}

// ─── Notification ──────────────────────────────────────

export type NotificationType = 'info' | 'success' | 'warning' | 'danger';

export interface Notification {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly type: NotificationType;
  readonly timestamp: string;
  readonly isRead: boolean;
  readonly href?: string;
  readonly icon?: LucideIcon;
}

// ─── Command Palette ───────────────────────────────────

export type CommandType = 'navigation' | 'action' | 'recent';

export interface CommandItem {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: LucideIcon;
  readonly type: CommandType;
  readonly href?: string;
  readonly action?: () => void;
  readonly shortcut?: string;
  readonly section?: string;
}

// ─── Search ────────────────────────────────────────────

export interface SearchResult {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly href?: string;
  readonly icon?: LucideIcon;
  readonly category?: string;
}

// ─── Environment ───────────────────────────────────────

export type Environment = 'development' | 'staging' | 'production';

// ─── Page Container ────────────────────────────────────

export interface PageAction {
  readonly label: string;
  readonly icon?: LucideIcon;
  readonly variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
}

export interface PageTab {
  readonly id: string;
  readonly label: string;
  readonly icon?: LucideIcon;
  readonly count?: number;
  readonly disabled?: boolean;
}

// ─── Profile Menu ──────────────────────────────────────

export interface ProfileMenuItem {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: LucideIcon;
  readonly href?: string;
  readonly onClick?: () => void;
  readonly variant?: 'default' | 'danger';
  readonly dividerBefore?: boolean;
}

export interface UserProfile {
  readonly name: string;
  readonly email: string;
  readonly avatar?: string;
  readonly initials: string;
  readonly role?: string;
}

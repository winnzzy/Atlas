import {
  Home,
  CreditCard,
  ArrowLeftRight,
  BarChart3,
  Repeat,
  Wallet,
  Settings,
  HelpCircle,
  Users,
  Shield,
  Activity,
  FileText,
  Bell,
  TrendingUp,
  ClipboardList,
} from 'lucide-react';
import type { SidebarConfig, NavSection, ProfileMenuItem } from './types';

// ─── Dashboard Navigation ──────────────────────────────

export const dashboardNavSections: readonly NavSection[] = [
  {
    id: 'main',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: Home },
      { id: 'accounts', label: 'Accounts', href: '/dashboard/accounts', icon: Wallet },
      {
        id: 'transactions',
        label: 'Transactions',
        href: '/dashboard/transactions',
        icon: ArrowLeftRight,
      },
      { id: 'cards', label: 'Cards', href: '/dashboard/cards', icon: CreditCard },
      { id: 'transfers', label: 'Transfers', href: '/dashboard/transfers', icon: Repeat },
      { id: 'investments', label: 'Investments', href: '/dashboard/investments', icon: TrendingUp },
      {
        id: 'notifications',
        label: 'Notifications',
        href: '/dashboard/notifications',
        icon: Bell,
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      { id: 'analytics', label: 'Insights', href: '/dashboard/investments', icon: BarChart3 },
      { id: 'statements', label: 'Statements', href: '/dashboard/accounts', icon: FileText },
      { id: 'profile', label: 'Profile', href: '/dashboard/profile', icon: Users },
      {
        id: 'profile-preferences',
        label: 'Preferences',
        href: '/dashboard/profile/preferences',
        icon: Settings,
      },
      {
        id: 'profile-security',
        label: 'Security',
        href: '/dashboard/profile/security',
        icon: Shield,
      },
      {
        id: 'profile-activity',
        label: 'Activity',
        href: '/dashboard/profile/activity',
        icon: Activity,
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      { id: 'settings', label: 'Settings', href: '/dashboard/profile/preferences', icon: Settings },
      { id: 'help', label: 'Help & Support', href: '/dashboard/profile', icon: HelpCircle },
    ],
  },
];

export const defaultDashboardSidebarConfig: SidebarConfig = {
  variant: 'default',
  sections: dashboardNavSections,
};

// ─── Admin Navigation ──────────────────────────────────

export const adminNavSections: readonly NavSection[] = [
  {
    id: 'admin-main',
    label: 'Enterprise',
    items: [
      { id: 'admin-dashboard', label: 'Dashboard', href: '/admin', icon: Home },
      { id: 'admin-customers', label: 'Customers', href: '/admin/customers', icon: Users },
      { id: 'admin-accounts', label: 'Accounts', href: '/admin/accounts', icon: Wallet },
      { id: 'admin-cards', label: 'Cards', href: '/admin/cards', icon: CreditCard },
      {
        id: 'admin-transactions',
        label: 'Transactions',
        href: '/admin/transactions',
        icon: ArrowLeftRight,
      },
      { id: 'admin-transfers', label: 'Transfers', href: '/admin/transfers', icon: Repeat },
      {
        id: 'admin-investments',
        label: 'Investments',
        href: '/admin/investments',
        icon: TrendingUp,
      },
      {
        id: 'admin-notifications',
        label: 'Notifications',
        href: '/admin/notifications',
        icon: Bell,
      },
      { id: 'admin-audit', label: 'Audit', href: '/admin/audit', icon: ClipboardList },
      { id: 'admin-reports', label: 'Reports', href: '/admin/reports', icon: BarChart3 },
      { id: 'admin-settings', label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export const defaultAdminSidebarConfig: SidebarConfig = {
  variant: 'admin',
  sections: adminNavSections,
};

// ─── Default Profile Menu Items ────────────────────────

export const defaultProfileMenuItems: readonly ProfileMenuItem[] = [
  { id: 'profile', label: 'Profile', href: '/dashboard/profile', icon: Users },
  { id: 'settings', label: 'Settings', href: '/dashboard/profile/preferences', icon: Settings },
  { id: 'divider-1' as string, label: '', href: '', dividerBefore: true },
  { id: 'help', label: 'Help & Support', href: '/dashboard/profile', icon: HelpCircle },
  { id: 'divider-2' as string, label: '', href: '', dividerBefore: true },
  { id: 'logout', label: 'Sign out', href: '', icon: Shield, variant: 'danger' },
];

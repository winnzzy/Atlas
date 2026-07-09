import {
  Home,
  CreditCard,
  ArrowLeftRight,
  BarChart3,
  Wallet,
  Settings,
  HelpCircle,
  Users,
  Shield,
  Activity,
  FileText,
  Bell,
  Landmark,
  TrendingUp,
  Bitcoin,
  ClipboardList,
  Wrench,
  PlayCircle,
} from 'lucide-react';
import type { SidebarConfig, NavSection, ProfileMenuItem } from './types';

// ─── Dashboard Navigation ──────────────────────────────

export const dashboardNavSections: readonly NavSection[] = [
  {
    id: 'main',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: Home },
      { id: 'accounts', label: 'Accounts', href: '/accounts', icon: Wallet },
      { id: 'transactions', label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
      { id: 'cards', label: 'Cards', href: '/cards', icon: CreditCard },
      { id: 'crypto', label: 'Crypto', href: '/crypto', icon: Activity },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      { id: 'analytics', label: 'Insights', href: '/analytics', icon: BarChart3 },
      { id: 'statements', label: 'Statements', href: '/statements', icon: FileText },
      { id: 'profile', label: 'Profile', href: '/profile', icon: Users },
      {
        id: 'profile-preferences',
        label: 'Preferences',
        href: '/profile/preferences',
        icon: Settings,
      },
      { id: 'profile-security', label: 'Security', href: '/profile/security', icon: Shield },
      { id: 'profile-activity', label: 'Activity', href: '/profile/activity', icon: Activity },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
      { id: 'help', label: 'Help & Support', href: '/help', icon: HelpCircle },
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
    label: 'Operations',
    items: [
      { id: 'admin-overview', label: 'Overview', href: '/admin', icon: Home },
      { id: 'admin-customers', label: 'Customers', href: '/admin/customers', icon: Users },
      { id: 'admin-accounts', label: 'Accounts', href: '/admin/accounts', icon: Wallet },
      {
        id: 'admin-transactions',
        label: 'Transactions',
        href: '/admin/transactions',
        icon: ArrowLeftRight,
      },
      { id: 'admin-cards', label: 'Cards', href: '/admin/cards', icon: CreditCard },
    ],
  },
  {
    id: 'admin-finance',
    label: 'Finance',
    items: [
      { id: 'admin-crypto', label: 'Crypto', href: '/admin/crypto', icon: Bitcoin },
      {
        id: 'admin-investments',
        label: 'Investments',
        href: '/admin/investments',
        icon: TrendingUp,
      },
      { id: 'admin-loans', label: 'Loans', href: '/admin/loans', icon: Landmark },
    ],
  },
  {
    id: 'admin-operations',
    label: 'System',
    items: [
      {
        id: 'admin-notifications',
        label: 'Notifications',
        href: '/admin/notifications',
        icon: Bell,
      },
      { id: 'admin-audit', label: 'Audit Log', href: '/admin/audit', icon: ClipboardList },
      {
        id: 'admin-operations-tools',
        label: 'Operations',
        href: '/admin/operations',
        icon: Wrench,
      },
      { id: 'admin-settings', label: 'Settings', href: '/admin/settings', icon: Settings },
      { id: 'admin-demo', label: 'Demo Mode', href: '/admin/demo', icon: PlayCircle },
    ],
  },
];

export const defaultAdminSidebarConfig: SidebarConfig = {
  variant: 'admin',
  sections: adminNavSections,
};

// ─── Default Profile Menu Items ────────────────────────

export const defaultProfileMenuItems: readonly ProfileMenuItem[] = [
  { id: 'profile', label: 'Profile', href: '/profile', icon: Users },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
  { id: 'divider-1' as string, label: '', href: '', dividerBefore: true },
  { id: 'help', label: 'Help & Support', href: '/help', icon: HelpCircle },
  { id: 'divider-2' as string, label: '', href: '', dividerBefore: true },
  { id: 'logout', label: 'Sign out', href: '', icon: Shield, variant: 'danger' },
];

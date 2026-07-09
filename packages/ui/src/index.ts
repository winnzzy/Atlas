// ─── Design Tokens ───
import './tokens/tokens.css';

// ─── Utilities ───
export { cn } from './lib/cn';

// ─── Providers ───
export { ThemeProvider, useTheme } from './providers/theme-provider';
export type { ThemeProviderProps, Theme } from './providers/theme-provider';

// ─── Components ───
export { Button, buttonVariants } from './components/button';
export type { ButtonProps } from './components/button';

export { Input, Textarea } from './components/input';
export type { InputProps, TextareaProps } from './components/input';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './components/card';
export type { CardProps } from './components/card';

export { Badge } from './components/badge';
export type { BadgeProps } from './components/badge';

export { Avatar } from './components/avatar';
export type { AvatarProps } from './components/avatar';

export { Spinner } from './components/spinner';
export type { SpinnerProps } from './components/spinner';

export {
  Separator,
  Skeleton,
  Label,
  Alert,
  Switch,
  Checkbox,
  Progress,
  Tooltip,
} from './components/primitives';
export type {
  SeparatorProps,
  SkeletonProps,
  LabelProps,
  AlertProps,
  SwitchProps,
  CheckboxProps,
  ProgressProps,
  TooltipProps,
} from './components/primitives';

// ─── Layout ───
export { DashboardShell, AdminShell, PageContainer, PageHeader } from './layout/app-shell';
export type {
  DashboardShellProps,
  AdminShellProps,
  PageContainerProps,
  PageHeaderProps,
} from './layout/app-shell';

export { Sidebar, SidebarProvider, SidebarToggle } from './layout/sidebar';
export type { SidebarProps, SidebarProviderProps, SidebarToggleProps } from './layout/sidebar';

export { Header, EnvironmentBadge, ProfileMenu } from './layout/header';
export type { HeaderProps, EnvironmentBadgeProps, ProfileMenuProps } from './layout/header';

export { Breadcrumb } from './layout/breadcrumb';
export type { BreadcrumbProps } from './layout/breadcrumb';

export {
  CommandPalette,
  CommandPaletteProvider,
  CommandPaletteTrigger,
} from './layout/command-palette';
export type {
  CommandPaletteProps,
  CommandPaletteProviderProps,
  CommandPaletteTriggerProps,
} from './layout/command-palette';

export {
  NotificationsProvider,
  NotificationBell,
  NotificationDrawer,
} from './layout/notification-center';
export type {
  NotificationsProviderProps,
  NotificationDrawerProps,
} from './layout/notification-center';

export { useSidebar, useCommandPalette, useNotifications } from './layout/hooks';
export type {
  SidebarContextValue,
  CommandPaletteContextValue,
  NotificationsContextValue,
} from './layout/hooks';

export type {
  Environment,
  UserProfile,
  NavItem,
  NavSection,
  SidebarConfig,
  BreadcrumbItem,
  CommandItem,
  Notification,
  ProfileMenuItem,
} from './layout/types';

export {
  dashboardNavSections,
  defaultDashboardSidebarConfig,
  adminNavSections,
  defaultAdminSidebarConfig,
  defaultProfileMenuItems,
} from './layout/navigation-config';

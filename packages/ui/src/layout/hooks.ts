'use client';

import { createContext, useContext } from 'react';

// ─── Sidebar Context ───────────────────────────────────

export interface SidebarContextValue {
  readonly isCollapsed: boolean;
  readonly isMobileOpen: boolean;
  readonly width: number;
  readonly collapsedWidth: number;
  readonly toggleCollapse: () => void;
  readonly setMobileOpen: (open: boolean) => void;
  readonly setWidth: (width: number) => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within a SidebarProvider');
  return ctx;
}

// ─── Command Palette Context ───────────────────────────

export interface CommandPaletteContextValue {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
}

export const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  return ctx;
}

// ─── Notifications Context ─────────────────────────────

export interface NotificationsContextValue {
  readonly isOpen: boolean;
  readonly unreadCount: number;
  readonly toggle: () => void;
  readonly close: () => void;
  readonly markAsRead: (id: string) => void;
  readonly markAllAsRead: () => void;
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}

// ─── Keyboard Shortcut Hook ────────────────────────────

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  modifiers: { readonly meta?: boolean; readonly ctrl?: boolean; readonly shift?: boolean } = {},
): void {
  if (typeof window === 'undefined') return;

  const handler = (e: KeyboardEvent) => {
    const metaMatch = modifiers.meta ? e.metaKey : true;
    const ctrlMatch = modifiers.ctrl ? e.ctrlKey : true;
    const shiftMatch = modifiers.shift ? e.shiftKey : true;

    if (e.key === key && metaMatch && ctrlMatch && shiftMatch) {
      e.preventDefault();
      callback();
    }
  };

  // We use useEffect in the component that calls this
  // This is a utility to be used inside useEffect
  window.addEventListener('keydown', handler);
  // Return cleanup would be handled by the caller
}

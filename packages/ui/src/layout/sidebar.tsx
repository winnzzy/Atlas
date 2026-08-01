'use client';

import React, { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { ChevronDown, PanelLeftClose, PanelLeft, X } from 'lucide-react';
import { cn } from '../lib/cn';
import { Button } from '../components/button';
import { Badge } from '../components/badge';
import { Tooltip } from '../components/primitives';
import { Separator } from '../components/primitives';
import { SidebarContext, type SidebarContextValue } from './hooks';
import type { NavItem, NavSection, SidebarConfig } from './types';

// ─── Sidebar Nav Item ──────────────────────────────────

interface SidebarNavItemProps {
  readonly item: NavItem;
  readonly isCollapsed: boolean;
  readonly depth?: number;
  readonly activeHref?: string;
  readonly onNavigate?: (href: string) => void;
}

function SidebarNavItem({
  item,
  isCollapsed,
  depth = 0,
  activeHref,
  onNavigate,
}: SidebarNavItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = activeHref === item.href;
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (hasChildren) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else {
        onNavigate?.(item.href);
      }
    },
    [hasChildren, onNavigate, item.href],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (hasChildren) {
          setIsOpen((prev) => !prev);
        } else {
          onNavigate?.(item.href);
        }
      }
      if (e.key === 'ArrowRight' && hasChildren && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'ArrowLeft' && hasChildren && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    },
    [hasChildren, isOpen, onNavigate, item.href],
  );

  const badgeContent = item.badge ? (
    <Badge variant={item.badge.variant ?? 'default'} className="ml-auto text-[10px] px-1.5 py-0">
      {item.badge.label}
    </Badge>
  ) : null;

  const navLink = (
    <a
      href={item.href}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={hasChildren ? 'button' : 'link'}
      aria-expanded={hasChildren ? isOpen : undefined}
      aria-current={isActive ? 'page' : undefined}
      tabIndex={0}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-[var(--duration-fast)] ease-[var(--ease-default)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-sidebar-bg)]',
        isActive
          ? 'border-white/10 bg-[linear-gradient(90deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))] text-[var(--color-sidebar-text-active)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
          : 'text-[var(--color-sidebar-text)] hover:border-white/10 hover:bg-[var(--color-sidebar-hover)] hover:text-[var(--color-sidebar-text-active)]',
        depth > 0 && 'ml-3 pl-6',
        isCollapsed && 'justify-center px-2',
      )}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--color-primary-500)]" />
      )}
      {Icon && (
        <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-[var(--color-primary-400)]')} />
      )}
      {!isCollapsed && (
        <>
          <span className="truncate">{item.label}</span>
          {badgeContent}
          {hasChildren && (
            <ChevronDown
              className={cn(
                'ml-auto h-3.5 w-3.5 shrink-0 transition-transform duration-[var(--duration-fast)]',
                isOpen && 'rotate-180',
              )}
            />
          )}
        </>
      )}
    </a>
  );

  return (
    <li role="none">
      {isCollapsed ? (
        <Tooltip content={item.label} side="right">
          {navLink}
        </Tooltip>
      ) : (
        navLink
      )}
      {hasChildren && !isCollapsed && isOpen && (
        <ul role="menu" className="mt-0.5 space-y-0.5">
          {(item.children ?? []).map((child) => (
            <SidebarNavItem
              key={child.id}
              item={child}
              isCollapsed={isCollapsed}
              depth={depth + 1}
              activeHref={activeHref}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ─── Sidebar Section ───────────────────────────────────

interface SidebarSectionProps {
  readonly section: NavSection;
  readonly isCollapsed: boolean;
  readonly activeHref?: string;
  readonly onNavigate?: (href: string) => void;
}

function SidebarSection({ section, isCollapsed, activeHref, onNavigate }: SidebarSectionProps) {
  return (
    <div className="space-y-1">
      {section.label && !isCollapsed && (
        <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-neutral-500)]">
          {section.label}
        </div>
      )}
      <ul role="menu" className="space-y-0.5">
        {section.items.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            activeHref={activeHref}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </div>
  );
}

// ─── Sidebar Provider ──────────────────────────────────

export interface SidebarProviderProps {
  readonly children: React.ReactNode;
  readonly defaultCollapsed?: boolean;
  readonly defaultWidth?: number;
  readonly collapsedWidth?: number;
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
  defaultWidth = 260,
  collapsedWidth = 72,
}: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [width, setWidth] = useState(defaultWidth);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const value: SidebarContextValue = {
    isCollapsed,
    isMobileOpen,
    width,
    collapsedWidth,
    toggleCollapse,
    setMobileOpen,
    setWidth,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

// ─── Sidebar ───────────────────────────────────────────

export interface SidebarProps {
  readonly config: SidebarConfig;
  readonly activeHref?: string;
  readonly onNavigate?: (href: string) => void;
  readonly className?: string;
}

export function Sidebar({ config, activeHref, onNavigate, className }: SidebarProps) {
  const { isCollapsed, isMobileOpen, setMobileOpen, width, collapsedWidth } = useSidebarContext();
  const sidebarRef = useRef<HTMLElement>(null);
  const currentWidth = isCollapsed ? collapsedWidth : width;

  // Close mobile sidebar on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen, setMobileOpen]);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMobileOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--color-overlay)] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        role="navigation"
        aria-label={`${config.variant === 'admin' ? 'Admin' : 'Main'} navigation`}
        className={cn(
          'fixed left-0 top-0 z-[var(--z-sticky)] flex h-screen flex-col bg-[var(--color-sidebar-bg)]/95 backdrop-blur-xl transition-all duration-[var(--duration-slow)] ease-[var(--ease-default)]',
          'border-r border-white/10 shadow-[14px_0_34px_rgba(15,23,42,0.2)]',
          // Mobile
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop
          'lg:translate-x-0',
          className,
        )}
        style={{ width: currentWidth }}
      >
        {/* Logo / Brand */}
        <div
          className={cn(
            'flex h-16 items-center border-b border-white/10 px-4',
            isCollapsed && 'justify-center',
          )}
        >
          {config.logo ?? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-600)] text-sm font-bold text-white shadow-lg shadow-[var(--color-primary-600)]/25">
                A
              </div>
              {!isCollapsed && (
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold tracking-tight text-[var(--color-sidebar-text-active)]">
                    Atlas
                  </span>
                  <span className="text-[11px] text-[var(--color-sidebar-text)]/80">
                    Enterprise Banking
                  </span>
                </div>
              )}
            </div>
          )}
          {/* Mobile close */}
          <button
            className="ml-auto rounded-[var(--radius-md)] p-1.5 text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)] lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          <div className="space-y-6">
            {config.sections.map((section) => (
              <SidebarSection
                key={section.id}
                section={section}
                isCollapsed={isCollapsed}
                activeHref={activeHref}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </nav>

        {/* Footer */}
        {config.footer && (
          <>
            <Separator className="bg-white/5" />
            <div className="px-3 py-3">{config.footer}</div>
          </>
        )}
      </aside>
    </>
  );
}

// Helper hook that doesn't throw (for use inside Sidebar itself)
function useSidebarContext(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    // Return defaults if not wrapped in provider
    return {
      isCollapsed: false,
      isMobileOpen: false,
      width: 260,
      collapsedWidth: 72,
      toggleCollapse: () => {},
      setMobileOpen: () => {},
      setWidth: () => {},
    };
  }
  return ctx;
}

// ─── Sidebar Toggle Button ─────────────────────────────

export interface SidebarToggleProps {
  readonly className?: string;
}

export function SidebarToggle({ className }: SidebarToggleProps) {
  const { isCollapsed, toggleCollapse, setMobileOpen } = useSidebarContext();

  return (
    <>
      {/* Desktop toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggleCollapse}
        className={cn('hidden lg:flex', className)}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </Button>

      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setMobileOpen(true)}
        className={cn('lg:hidden', className)}
        aria-label="Open sidebar"
      >
        <PanelLeft className="h-4 w-4" />
      </Button>
    </>
  );
}

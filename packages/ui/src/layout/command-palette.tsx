'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Search, CornerDownLeft, ArrowUp, ArrowDown, Command } from 'lucide-react';
import { cn } from '../lib/cn';
import { CommandPaletteContext, type CommandPaletteContextValue } from './hooks';
import type { CommandItem } from './types';

// ─── Command Palette Provider ──────────────────────────

export interface CommandPaletteProviderProps {
  readonly children: React.ReactNode;
}

export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  const value: CommandPaletteContextValue = { isOpen, open, close, toggle };

  return <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>;
}

// ─── Command Palette Dialog ────────────────────────────

export interface CommandPaletteProps {
  readonly commands: readonly CommandItem[];
  readonly recentCommands?: readonly CommandItem[];
  readonly onNavigate?: (href: string) => void;
  readonly placeholder?: string;
  readonly emptyMessage?: string;
  readonly className?: string;
}

export function CommandPalette({
  commands,
  recentCommands = [],
  onNavigate,
  placeholder = 'Search commands, pages, actions...',
  emptyMessage = 'No results found.',
  className,
}: CommandPaletteProps) {
  const { isOpen, close } = useCommandPaletteContext();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands
  const filtered = useMemo(() => {
    const allCommands = query.trim() === '' ? [...recentCommands, ...commands] : commands;
    if (query.trim() === '') return allCommands;

    const q = query.toLowerCase();
    return allCommands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q) ||
        cmd.section?.toLowerCase().includes(q),
    );
  }, [commands, recentCommands, query]);

  // Group by section
  const grouped = useMemo(() => {
    const groups = new Map<string, CommandItem[]>();
    for (const cmd of filtered) {
      const section =
        cmd.section ??
        (query.trim() === '' && recentCommands.includes(cmd) ? 'Recent' : 'Commands');
      const existing = groups.get(section) ?? [];
      existing.push(cmd);
      groups.set(section, existing);
    }
    return groups;
  }, [filtered, query, recentCommands]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset active index when filtered changes
  useEffect(() => {
    setActiveIndex(0);
  }, [filtered]);

  const executeCommand = useCallback(
    (cmd: CommandItem) => {
      if (cmd.action) cmd.action();
      if (cmd.href) onNavigate?.(cmd.href);
      close();
    },
    [onNavigate, close],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filtered[activeIndex]) executeCommand(filtered[activeIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [filtered, activeIndex, executeCommand, close],
  );

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeItem = list.querySelector('[data-active="true"]');
    activeItem?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isOpen) return null;

  let flatIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[var(--z-modal)] bg-[var(--color-overlay)]"
        onClick={close}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className={cn(
          'fixed left-1/2 top-[20%] z-[var(--z-modal)] w-full max-w-[560px] -translate-x-1/2',
          className,
        )}
        onKeyDown={handleKeyDown}
      >
        <div className="overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-bg-primary)] shadow-2xl border border-[var(--color-border-default)]">
          {/* Input */}
          <div className="flex items-center border-b border-[var(--color-border-default)] px-4">
            <Search className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex h-12 w-full bg-transparent px-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
              autoComplete="off"
              spellCheck="false"
            />
            <kbd className="hidden h-5 items-center gap-0.5 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-1.5 text-[10px] font-medium text-[var(--color-text-muted)] sm:flex">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[300px] overflow-y-auto p-2" role="listbox">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-[var(--color-text-muted)]">
                <Search className="mb-2 h-8 w-8 opacity-30" />
                <p>{emptyMessage}</p>
              </div>
            ) : (
              Array.from(grouped.entries()).map(([section, items]) => (
                <div key={section} className="mb-1">
                  <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {section}
                  </div>
                  {items.map((cmd) => {
                    flatIndex++;
                    const idx = flatIndex;
                    const isActive = idx === activeIndex;
                    const Icon = cmd.icon;

                    return (
                      <button
                        key={cmd.id}
                        role="option"
                        aria-selected={isActive}
                        data-active={isActive}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm transition-colors',
                          isActive
                            ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)]'
                            : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]',
                        )}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        {Icon && (
                          <Icon className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                        )}
                        <div className="flex-1 truncate">
                          <span className="font-medium">{cmd.label}</span>
                          {cmd.description && (
                            <span className="ml-2 text-xs text-[var(--color-text-muted)]">
                              {cmd.description}
                            </span>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <kbd className="hidden h-5 items-center gap-0.5 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-1.5 text-[10px] font-medium text-[var(--color-text-muted)] sm:flex">
                            {cmd.shortcut}
                          </kbd>
                        )}
                        {isActive && (
                          <div className="flex items-center gap-1 text-[10px] text-[var(--color-primary-600)]">
                            <CornerDownLeft className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[var(--color-border-default)] px-4 py-2">
            <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
              <span className="flex items-center gap-1">
                <ArrowUp className="h-3 w-3" />
                <ArrowDown className="h-3 w-3" />
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3" />
                <span>Select</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="rounded border border-[var(--color-border-default)] px-1 text-[10px]">
                  ESC
                </span>
                <span>Close</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Command Palette Trigger ───────────────────────────

export interface CommandPaletteTriggerProps {
  readonly className?: string;
}

export function CommandPaletteTrigger({ className }: CommandPaletteTriggerProps) {
  const { open } = useCommandPaletteContext();

  return (
    <button
      onClick={open}
      className={cn(
        'flex h-9 items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)]',
        className,
      )}
      aria-label="Open command palette"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Search...</span>
      <kbd className="ml-auto hidden items-center gap-0.5 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-1.5 py-0.5 text-[10px] font-medium sm:flex">
        <Command className="h-3 w-3" />K
      </kbd>
    </button>
  );
}

// ─── Safe hook (no throw) ──────────────────────────────

function useCommandPaletteContext(): CommandPaletteContextValue {
  const ctx = React.useContext(CommandPaletteContext);
  if (!ctx) {
    return { isOpen: false, open: () => {}, close: () => {}, toggle: () => {} };
  }
  return ctx;
}

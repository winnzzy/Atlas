'use client';

import { useEffect } from 'react';
import { Sidebar } from './sidebar';

/**
 * Mobile navigation drawer. Rendered as a fixed overlay (never inline), so it
 * cannot push page content or cause horizontal overflow. Closing is driven by
 * real state — the parent flips `open` to false — not by CSS visibility tricks:
 *  - tapping a nav item calls `onNavigate` (immediate close)
 *  - tapping the backdrop calls `onClose`
 *  - pressing Escape calls `onClose`
 *  - the parent also closes it on every route change
 * Desktop is unaffected: the whole overlay is `lg:hidden`.
 */
export function MobileNavigation({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    // Prevent the page behind the drawer from scrolling while it is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-slate-900/40 backdrop-blur-sm"
      />
      <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-xs flex-col overflow-y-auto p-4">
        <Sidebar mobile onNavigate={onNavigate} />
      </div>
    </div>
  );
}

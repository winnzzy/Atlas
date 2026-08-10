import * as React from 'react';
import { cn } from '@/lib/utils';

export function Tabs({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 rounded-xl bg-slate-100 p-1">{children}</div>;
}

export function TabsTrigger({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-2 text-sm font-semibold',
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600',
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return active ? <div className="mt-4">{children}</div> : null;
}

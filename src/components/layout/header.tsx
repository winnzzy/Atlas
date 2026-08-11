import Link from 'next/link';
import { Bell, Menu, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Avatar } from '@/components/ui/avatar';

export function Header({ onToggleMobile }: { onToggleMobile?: () => void }) {
  const { user, isAdmin } = useAuth();
  const home = isAdmin ? '/admin' : '/dashboard';

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200/80 bg-white/85 px-4 py-3.5 shadow-[0_16px_44px_rgba(15,23,42,0.05)] backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          aria-label="Toggle navigation"
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <Link href={home} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b345a] text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {isAdmin ? 'Atlas Operations' : 'Atlas'}
            </p>
            <p className="text-xs text-slate-500">
              {isAdmin ? 'Administrator console' : 'Digital banking'}
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {!isAdmin ? (
          <Link
            href="/dashboard/notifications"
            aria-label="Notifications"
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50"
          >
            <Bell className="h-4 w-4" />
          </Link>
        ) : null}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5">
          <Avatar>{user?.name?.slice(0, 2).toUpperCase()}</Avatar>
          <div className="hidden pr-1 sm:block">
            <p className="text-sm font-medium leading-tight text-slate-900">{user?.name}</p>
            <p className="text-xs leading-tight text-slate-500">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

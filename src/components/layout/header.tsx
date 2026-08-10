import Link from 'next/link';
import { Bell, Menu, Search, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Avatar } from '@/components/ui/avatar';

export function Header({ onToggleMobile }: { onToggleMobile?: () => void }) {
  const { user, isAdmin } = useAuth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200/80 bg-white/85 px-4 py-4 shadow-[0_16px_44px_rgba(15,23,42,0.05)] backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#0b345a]/10 bg-[#f4f8fc] text-[#0b345a]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {isAdmin ? 'Operations Console' : 'Client Workspace'}
            </p>
            <p className="text-sm text-slate-500">{user?.name}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <label className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-500 md:flex">
          <Search className="h-4 w-4" />
          <input
            aria-label="Search"
            className="w-40 bg-transparent outline-none"
            placeholder="Search"
          />
        </label>
        <button className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-600">
          <Bell className="h-4 w-4" />
        </button>
        <Link
          href={isAdmin ? '/admin' : '/dashboard'}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          {isAdmin ? 'Admin Home' : 'Dashboard'}
        </Link>
        <Avatar>{user?.name?.slice(0, 2).toUpperCase()}</Avatar>
      </div>
    </header>
  );
}

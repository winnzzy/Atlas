import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { Avatar } from '@/components/ui/avatar';

export function Header({ onToggleMobile }: { onToggleMobile?: () => void }) {
  const { user, isAdmin } = useAuth();

  return (
    <header className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="rounded-xl border border-slate-200 p-2 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {isAdmin ? 'Operations Console' : 'Client Workspace'}
          </p>
          <p className="text-sm text-slate-500">{user?.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href={isAdmin ? '/admin' : '/dashboard'}
          className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
        >
          {isAdmin ? 'Admin Home' : 'Dashboard'}
        </Link>
        <Avatar>{user?.name?.slice(0, 2).toUpperCase()}</Avatar>
      </div>
    </header>
  );
}

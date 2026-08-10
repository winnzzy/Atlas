import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  BarChart3,
  CreditCard,
  Landmark,
  LayoutGrid,
  LogOut,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

const customerItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutGrid },
  { href: '/dashboard/accounts', label: 'Accounts', icon: Landmark },
  { href: '/dashboard/transactions', label: 'Transactions', icon: BarChart3 },
  { href: '/dashboard/transfers', label: 'Transfers', icon: TrendingUp },
  { href: '/dashboard/cards', label: 'Cards', icon: CreditCard },
  { href: '/dashboard/investments', label: 'Investments', icon: TrendingUp },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/profile', label: 'Profile', icon: ShieldCheck },
];

const adminItems = [
  { href: '/admin', label: 'Overview', icon: LayoutGrid },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/accounts', label: 'Accounts', icon: Landmark },
  { href: '/admin/transactions', label: 'Transactions', icon: BarChart3 },
  { href: '/admin/transfers', label: 'Transfers', icon: TrendingUp },
  { href: '/admin/cards', label: 'Cards', icon: CreditCard },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/audit', label: 'Audit', icon: ShieldCheck },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ mobile }: { mobile?: boolean }) {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const items = isAdmin ? adminItems : customerItems;

  return (
    <aside
      className={cn(
        mobile
          ? 'space-y-4 rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-[0_16px_44px_rgba(15,23,42,0.06)]'
          : 'hidden w-72 shrink-0 rounded-[28px] border border-slate-200/80 bg-white/85 p-5 shadow-[0_16px_44px_rgba(15,23,42,0.06)] lg:block',
      )}
    >
      <div className="mb-6 rounded-[22px] border border-slate-200/80 bg-[#f4f8fc] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#0b345a]">Atlas</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">Digital Banking</p>
        <p className="text-sm text-slate-500">{user?.name}</p>
      </div>
      <nav className="space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                active
                  ? 'bg-[#0b345a] text-white shadow-[0_8px_20px_rgba(11,52,90,0.14)]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={logout}
        className="mt-6 flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </aside>
  );
}

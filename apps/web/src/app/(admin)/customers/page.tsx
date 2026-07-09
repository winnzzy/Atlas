'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input } from '@atlas/ui';
import { Avatar } from '@atlas/ui';
import { StatCard } from '@atlas/banking-ui';
import { Users, UserCheck, UserX, AlertTriangle, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { mockCustomers } from '@/features/admin/fixtures';

const kycColor: Record<string, string> = {
  verified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const statusColor: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function CustomersPage() {
  const [search, setSearch] = React.useState('');
  const [kycFilter, setKycFilter] = React.useState<string>('all');

  const filtered = React.useMemo(() => {
    return mockCustomers.filter((c) => {
      const matchSearch =
        !search ||
        `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase());
      const matchKyc = kycFilter === 'all' || c.kycStatus === kycFilter;
      return matchSearch && matchKyc;
    });
  }, [search, kycFilter]);

  const totalCustomers = mockCustomers.length;
  const activeCustomers = mockCustomers.filter((c) => c.status === 'active').length;
  const pendingKyc = mockCustomers.filter((c) => c.kycStatus === 'pending').length;
  const suspendedCustomers = mockCustomers.filter((c) => c.status === 'suspended').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Customer Management
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Manage and review all customer accounts
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={totalCustomers.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Active"
          value={activeCustomers.toLocaleString()}
          trend="up"
          trendValue="5.2%"
          icon={<UserCheck className="h-5 w-5" />}
        />
        <StatCard
          title="Pending KYC"
          value={pendingKyc.toLocaleString()}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          title="Suspended"
          value={suspendedCustomers.toLocaleString()}
          icon={<UserX className="h-5 w-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Customers</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                <Input
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <select
                value={kycFilter}
                onChange={(e) => setKycFilter(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All KYC</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Customer
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Email
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    KYC Status
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Account Status
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Location
                  </th>
                  <th className="pb-3 text-left font-medium text-[var(--color-text-secondary)]">
                    Risk Level
                  </th>
                  <th className="pb-3 text-right font-medium text-[var(--color-text-secondary)]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar fallback={`${c.firstName[0]}${c.lastName[0]}`} size="sm" />
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)]">
                            {c.firstName} {c.lastName}
                          </p>
                          <p className="text-xs text-[var(--color-text-tertiary)]">
                            Joined {new Date(c.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-[var(--color-text-secondary)]">{c.email}</td>
                    <td className="py-3">
                      <Badge className={kycColor[c.kycStatus]}>{c.kycStatus}</Badge>
                    </td>
                    <td className="py-3">
                      <Badge className={statusColor[c.status]}>{c.status}</Badge>
                    </td>
                    <td className="py-3 text-[var(--color-text-secondary)]">
                      {c.city}, {c.state}
                    </td>
                    <td className="py-3">
                      <Badge
                        className={
                          c.riskLevel === 'critical'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            : c.riskLevel === 'high'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                              : c.riskLevel === 'medium'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }
                      >
                        {c.riskLevel}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <Link href={`/admin/customers/${c.id}`}>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[var(--color-text-tertiary)]">
              No customers found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
